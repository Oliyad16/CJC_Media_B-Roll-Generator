import React from 'react';
import { Scene } from '../types';
import { Button } from './Button';

interface SceneCardProps {
  scene: Scene;
  onGenerateImage: (id: string, prompt: string) => void;
  onGenerateVideo: (id: string, prompt: string, imageUrl: string) => void;
  onUpdatePrompt: (id: string, newPrompt: string) => void;
}

export const SceneCard: React.FC<SceneCardProps> = ({ scene, onGenerateImage, onGenerateVideo, onUpdatePrompt }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [localPrompt, setLocalPrompt] = React.useState(scene.imagePrompt);

  const handlePromptSave = () => {
    onUpdatePrompt(scene.id, localPrompt);
    setIsEditing(false);
  };

  return (
    <div className="bg-ancient-800 rounded-xl overflow-hidden border border-ancient-600 shadow-xl transition-all hover:border-gold-500/30 group">
      <div className="flex flex-col md:flex-row h-full">
        {/* Left: Content Info */}
        <div className="p-6 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-serif tracking-widest text-gold-500 uppercase">Scene {Number(scene.id) + 1}</span>
              <div className="flex gap-2">
                {scene.isGeneratingImage && (
                  <span className="text-xs text-blue-400 animate-pulse">Generating Visual...</span>
                )}
                {scene.isGeneratingVideo && (
                  <span className="text-xs text-purple-400 animate-pulse">Generating Video...</span>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="text-gray-400 text-xs uppercase tracking-wide mb-1 font-semibold">Audio / Transcript</h4>
              <p className="text-papyrus font-serif text-lg leading-relaxed italic border-l-2 border-gold-600 pl-4 py-1 bg-ancient-900/30 rounded-r">
                "{scene.segmentText}"
              </p>
            </div>

            <div className="mb-4">
              <h4 className="text-gray-400 text-xs uppercase tracking-wide mb-1 font-semibold">Visual Direction</h4>
              <p className="text-gray-300 text-sm leading-relaxed">{scene.visualIdea}</p>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-gray-400 text-xs uppercase tracking-wide font-semibold">AI Image Prompt</h4>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs text-gold-500 hover:text-gold-400 underline"
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
              
              {isEditing ? (
                <div className="space-y-2">
                  <textarea 
                    value={localPrompt}
                    onChange={(e) => setLocalPrompt(e.target.value)}
                    className="w-full bg-ancient-900 text-sm text-gray-300 p-2 rounded border border-ancient-600 focus:border-gold-500 outline-none resize-y h-24"
                  />
                  <Button size="sm" onClick={handlePromptSave} className="w-full text-xs">Save Prompt</Button>
                </div>
              ) : (
                <p className="text-gray-500 text-xs italic line-clamp-3 hover:line-clamp-none transition-all cursor-help bg-black/20 p-2 rounded">
                  {scene.imagePrompt}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-ancient-700 space-y-3">
            <Button 
              onClick={() => onGenerateImage(scene.id, scene.imagePrompt)}
              disabled={scene.isGeneratingImage || scene.isGeneratingVideo}
              isLoading={scene.isGeneratingImage}
              variant="outline"
              className="w-full"
            >
              {scene.generatedImageUrl ? 'Regenerate Image' : 'Generate Image'}
            </Button>
            
            {scene.generatedImageUrl && (
              <Button 
                onClick={() => onGenerateVideo(scene.id, scene.imagePrompt, scene.generatedImageUrl!)}
                disabled={scene.isGeneratingVideo}
                isLoading={scene.isGeneratingVideo}
                variant="primary"
                className="w-full"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>}
              >
                {scene.generatedVideoUrl ? 'Regenerate Video' : 'Animate Scene'}
              </Button>
            )}
          </div>
        </div>

        {/* Right: Media Preview */}
        <div className="w-full md:w-[480px] bg-black relative flex items-center justify-center min-h-[270px] border-l border-ancient-700">
          {scene.generatedVideoUrl ? (
             <div className="relative w-full h-full">
                <video 
                  src={scene.generatedVideoUrl} 
                  controls 
                  className="w-full h-full object-contain"
                  poster={scene.generatedImageUrl}
                >
                  Your browser does not support the video tag.
                </video>
             </div>
          ) : scene.generatedImageUrl ? (
            <div className="relative w-full h-full group-image">
               <img 
                src={scene.generatedImageUrl} 
                alt="AI Generated Visualization" 
                className={`w-full h-full object-cover transition-opacity ${scene.isGeneratingVideo ? 'opacity-50' : 'opacity-100'}`}
              />
              {scene.isGeneratingVideo && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <span className="text-gold-500 font-serif text-sm tracking-widest bg-black/60 px-3 py-1 rounded">CREATING VIDEO...</span>
                 </div>
              )}
              {!scene.isGeneratingVideo && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                   <a 
                     href={scene.generatedImageUrl} 
                     download={`scene-${scene.id}.png`}
                     className="p-2 bg-white text-black rounded-full hover:bg-gold-500 transition-colors"
                     title="Download Image"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                     </svg>
                   </a>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-8 text-ancient-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium">No visual generated yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};