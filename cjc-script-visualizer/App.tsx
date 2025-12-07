import React, { useState, useCallback } from 'react';
import { analyzeTranscript, generateImageForScene, generateVideoForScene } from './services/gemini';
import { Scene, AppState } from './types';
import { SceneCard } from './components/SceneCard';
import { Button } from './components/Button';

// Default text provided by the user
const DEFAULT_TRANSCRIPT = `"I don't know who needs to hear this, but the Bible is history. People always say, don't quote the Bible, give real history. But here's what blows my mind. The Bible is most historically accurate and supported document on the face of the earth. Think about this. People will believe in events from ancient empires that have two or three manuscripts at the most, that survived time barely the trust in philosophers, kings, or historians whose writings barely survived. They'll accept stories taught in schools with maybe a handful of archaeological confirmations. But when it comes to the Bible, a book with over 25,000 ancient manuscripts, a book written across three continents, in three languages in 15 years, who all tell one unified story, a booked, backed by eyewitness accounts, archaeological discoveries and fulfilled by prophecy, suddenly people say we need something more reliable, more reliable than what we have more historical evidence for the Bible than for Julius Caesar himself, more than Plato, more than Homer's Iliad, more than 90% of what is taught as history in schools, the Bible is more accurate and authentic. People don't reject the Bible because it lacks evidence. They reject it because what it demands repentance, transformation and accountability. So the next time someone says don't use the Bible, use real history, remind them, the Bible is real history as a matter of fact. It's the most authenticated, verified and preserved historical record humanity has ever seen. And it hasn't survived thousands of years by accident. It survived because god made sure his word will stand forever. God bless my friends."`;

const App: React.FC = () => {
  const [transcript, setTranscript] = useState<string>(DEFAULT_TRANSCRIPT);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<string | null>(null);

  const checkApiKey = async () => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
    }
  };

  const handleAnalyze = async () => {
    if (!transcript.trim()) return;
    
    // Ensure key is selected before we start heavyweight operations if needed
    // Though analyze uses standard model, best practice for this app context
    await checkApiKey();
    
    setAppState(AppState.ANALYZING);
    setError(null);
    setScenes([]); // Clear previous

    try {
      const analysisItems = await analyzeTranscript(transcript);
      
      const newScenes: Scene[] = analysisItems.map((item, index) => ({
        id: index.toString(),
        segmentText: item.segment,
        visualIdea: item.visualIdea,
        imagePrompt: item.imagePrompt,
        isGeneratingImage: false,
        isGeneratingVideo: false
      }));

      setScenes(newScenes);
      setAppState(AppState.READY);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze transcript. Please try again.");
      setAppState(AppState.ERROR);
    }
  };

  const handleGenerateImage = useCallback(async (sceneId: string, prompt: string) => {
    await checkApiKey();
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isGeneratingImage: true } : s));
    
    try {
      const imageUrl = await generateImageForScene(prompt);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isGeneratingImage: false, generatedImageUrl: imageUrl } : s));
    } catch (err) {
      console.error(err);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isGeneratingImage: false } : s));
    }
  }, []);

  const handleGenerateVideo = useCallback(async (sceneId: string, prompt: string, imageUrl: string) => {
    // Veo strictly requires API key selection
    if (window.aistudio) {
       const hasKey = await window.aistudio.hasSelectedApiKey();
       if (!hasKey) {
         try {
           await window.aistudio.openSelectKey();
         } catch (e) {
           console.error("API Key selection failed or cancelled", e);
           return;
         }
       }
    }

    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isGeneratingVideo: true } : s));

    try {
      const videoUrl = await generateVideoForScene(prompt, imageUrl);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isGeneratingVideo: false, generatedVideoUrl: videoUrl } : s));
    } catch (err) {
      console.error(err);
      // If error is related to entity not found (key issue), we might want to prompt again, but for now just stop loading
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isGeneratingVideo: false } : s));
      alert("Failed to generate video. Please check your API key quotas or try again.");
    }
  }, []);

  const handleUpdatePrompt = useCallback((sceneId: string, newPrompt: string) => {
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, imagePrompt: newPrompt } : s));
  }, []);

  const handleGenerateAll = useCallback(async () => {
    // Sequentially generate to avoid rate limits or overwhelming the UI
    const scenesToGenerate = scenes.filter(s => !s.generatedImageUrl);
    
    // Only generate images for "Generate All" as video is too expensive/slow to batch blindly
    if (scenesToGenerate.length > 0) {
       await checkApiKey();
    }
    
    for (const scene of scenesToGenerate) {
      if (scene.isGeneratingImage) continue;
      await handleGenerateImage(scene.id, scene.imagePrompt);
    }
  }, [scenes, handleGenerateImage]);

  return (
    <div className="min-h-screen pb-20 selection:bg-gold-500/30 selection:text-white">
      {/* Header */}
      <header className="bg-ancient-900 border-b border-ancient-700 sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-amber-700 rounded-full flex items-center justify-center shadow-lg shadow-gold-900/50">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
               </svg>
            </div>
            <div>
              <h1 className="text-xl font-serif text-papyrus tracking-wide">Scripture Visualizer</h1>
              <p className="text-xs text-gray-500 font-sans">AI Storyboard & Video Companion</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {scenes.length > 0 && (
                <Button variant="ghost" onClick={() => { setScenes([]); setAppState(AppState.IDLE); }}>
                  Reset Project
                </Button>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Step 1: Input */}
        <section className={`transition-all duration-500 ${appState === AppState.IDLE ? 'opacity-100 translate-y-0' : 'opacity-100'}`}>
          <div className="bg-ancient-800 rounded-2xl border border-ancient-600 p-1 shadow-2xl">
            <div className="bg-ancient-900/50 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-semibold text-gold-500 uppercase tracking-wider flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  Source Transcript
                </label>
                {appState === AppState.READY && (
                  <span className="text-xs text-green-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Analyzed
                  </span>
                )}
              </div>
              <textarea
                className="w-full h-48 bg-black/30 text-gray-300 p-4 rounded-lg border border-ancient-600 focus:border-gold-500 outline-none transition-colors font-serif text-lg leading-relaxed resize-y"
                placeholder="Paste your video script here..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                disabled={appState === AppState.ANALYZING}
              />
              <div className="mt-4 flex justify-end">
                {appState === AppState.IDLE || appState === AppState.ERROR || appState === AppState.ANALYZING ? (
                   <Button 
                    onClick={handleAnalyze} 
                    isLoading={appState === AppState.ANALYZING}
                    className="w-full md:w-auto"
                   >
                     Analyze & Create Storyboard
                   </Button>
                ) : (
                  <Button 
                    variant="secondary"
                    onClick={handleAnalyze}
                  >
                    Re-Analyze Script
                  </Button>
                )}
              </div>
              {error && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-900/50 text-red-200 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Step 2: Storyboard */}
        {scenes.length > 0 && (
          <section className="mt-12 animate-fade-in">
             <div className="flex items-center justify-between mb-8 sticky top-24 z-40 bg-ancient-900/90 p-4 rounded-xl border border-ancient-700 backdrop-blur">
                <div>
                   <h2 className="text-2xl font-serif text-white">Storyboard Scenes</h2>
                   <p className="text-gray-400 text-sm">Generated {scenes.length} visual concepts based on your script.</p>
                </div>
                <Button onClick={handleGenerateAll} variant="primary">
                  Generate All Images
                </Button>
             </div>

             <div className="grid gap-8">
               {scenes.map((scene) => (
                 <SceneCard 
                   key={scene.id} 
                   scene={scene} 
                   onGenerateImage={handleGenerateImage}
                   onGenerateVideo={handleGenerateVideo}
                   onUpdatePrompt={handleUpdatePrompt}
                 />
               ))}
             </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;