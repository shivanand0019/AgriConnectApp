import React, { useState, useEffect } from 'react';
import { Mic, Sparkles, Radio } from 'lucide-react';
import { VoiceAssistantService } from '../../services/voiceAssistantService';

const FloatingVoiceButton = ({ onClick, isOpen }) => {
  const [systemMode, setSystemMode] = useState('DEMO');

  useEffect(() => {
    VoiceAssistantService.getStatus()
      .then((res) => {
        if (res?.data?.overallMode) {
          setSystemMode(res.data.overallMode);
        }
      })
      .catch(() => setSystemMode('DEMO'));
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Tooltip hint on hover */}
      <button
        onClick={onClick}
        aria-label="Open Gnani AI Multilingual Voice Assistant"
        className={`group relative flex items-center gap-3 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
          isOpen
            ? 'bg-emerald-800 text-white ring-4 ring-emerald-300'
            : 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:shadow-emerald-500/30'
        }`}
      >
        {/* Animated pulse halo */}
        <span className="absolute -inset-1 rounded-full bg-emerald-400 opacity-30 group-hover:opacity-60 blur-sm transition-opacity duration-300 animate-pulse" />

        <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm shadow-inner">
          <Mic className="w-5 h-5 text-white animate-bounce" style={{ animationDuration: '2s' }} />
        </div>

        <div className="relative text-left pr-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-wide">Gnani AI Voice</span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                systemMode === 'LIVE'
                  ? 'bg-emerald-300 text-emerald-950'
                  : 'bg-amber-300 text-amber-950'
              }`}
            >
              {systemMode}
            </span>
          </div>
          <p className="text-[11px] text-emerald-100 flex items-center gap-1 font-medium">
            <Sparkles className="w-3 h-3 text-emerald-200" />
            <span>ಕನ್ನಡ • हिंदी • English</span>
          </p>
        </div>
      </button>
    </div>
  );
};

export default FloatingVoiceButton;
