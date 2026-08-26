import React from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  className = '',
  size = 'md',
}) => {
  const { isListening, isSupported, errorMessage, toggleListening } = useVoiceInput((transcript) => {
    onTranscript(transcript);
  });

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base',
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        id="btn-voice-input"
        onClick={toggleListening}
        title={
          !isSupported
            ? 'Tarayıcınızda ses tanıma desteklenmiyor'
            : isListening
            ? 'Dinleniyor... Durdurmak için tıklayın'
            : 'Sesle yazmak için konuşun [🎙️]'
        }
        className={`inline-flex items-center justify-center rounded-lg font-medium transition-all active:scale-95 ${
          isListening
            ? 'bg-red-600 text-white ring-4 ring-red-200 animate-pulse'
            : isSupported
            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-300'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
        } ${sizeClasses[size]} ${className}`}
      >
        {isListening ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-1 text-white" />
            <span className="text-xs font-semibold">Dinliyor...</span>
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
          </>
        )}
      </button>

      {errorMessage && (
        <div className="absolute left-0 bottom-full mb-1 z-30 w-64 p-2 bg-slate-900 text-white text-xs rounded-md shadow-lg border border-slate-700">
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold mb-0.5">
            <MicOff className="w-3.5 h-3.5" />
            <span>Ses Uyarısı</span>
          </div>
          <p className="text-slate-200 text-[11px] leading-tight">{errorMessage}</p>
        </div>
      )}
    </div>
  );
};
