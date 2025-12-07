import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponseItem } from "../types";

// Helper to get a fresh client instance to ensure we use the latest API Key
const getAiClient = () => {
  const apiKey = process.env.API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

export const analyzeTranscript = async (transcript: string): Promise<AnalysisResponseItem[]> => {
  const ai = getAiClient();
  if (!process.env.API_KEY) throw new Error("API Key missing");

  const model = "gemini-2.5-flash";
  
  const systemInstruction = `
    You are an expert video editor and documentary filmmaker. 
    Your task is to take a transcript and break it down into a storyboard for a high-quality historical documentary style video.
    Each scene should represent about 5-10 seconds of video.
    
    For each scene:
    1. 'segment': The exact text from the transcript for this scene.
    2. 'visualIdea': A description of the B-roll or motion graphics to show (e.g., "Slow pan of ancient parchment," "Drone shot of Roman ruins").
    3. 'imagePrompt': A highly detailed, photorealistic AI image generation prompt to create this visual. Focus on cinematic lighting, 8k resolution, historical accuracy, and mood.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: transcript,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            segment: { type: Type.STRING },
            visualIdea: { type: Type.STRING },
            imagePrompt: { type: Type.STRING }
          },
          required: ["segment", "visualIdea", "imagePrompt"],
        },
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  try {
    return JSON.parse(text) as AnalysisResponseItem[];
  } catch (e) {
    console.error("Failed to parse JSON", e);
    throw new Error("Invalid JSON response from AI");
  }
};

export const generateImageForScene = async (prompt: string): Promise<string> => {
  const ai = getAiClient();
  if (!process.env.API_KEY) throw new Error("API Key missing");
  
  // Using gemini-3-pro-image-preview for high quality output
  const model = "gemini-3-pro-image-preview";

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9", // Cinematic ratio for video
        imageSize: "1K" // Good balance of speed and quality
      }
    }
  });

  // Check candidates for inline data (image)
  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  
  if (part && part.inlineData && part.inlineData.data) {
    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
  }
  
  throw new Error("No image generated");
};

export const generateVideoForScene = async (prompt: string, imageUrl: string): Promise<string> => {
  const ai = getAiClient();
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  // Extract base64 and mimeType from data URL
  const [header, base64Data] = imageUrl.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';

  // Using Veo fast for preview generation
  const model = 'veo-3.1-fast-generate-preview';

  let operation = await ai.models.generateVideos({
    model,
    prompt: prompt, // Use the visual prompt to guide the animation
    image: {
      imageBytes: base64Data,
      mimeType: mimeType,
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  // Poll for completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  
  if (!videoUri) {
    throw new Error("Video generation failed or returned no URI");
  }

  // Fetch the video content using the API key
  const videoResponse = await fetch(`${videoUri}&key=${apiKey}`);
  
  if (!videoResponse.ok) {
    throw new Error(`Failed to fetch video: ${videoResponse.statusText}`);
  }

  const videoBlob = await videoResponse.blob();
  return URL.createObjectURL(videoBlob);
};