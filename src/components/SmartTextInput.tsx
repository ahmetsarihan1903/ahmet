import React from 'react';
import { VoiceInputButton } from './VoiceInputButton';
import { formatToSentenceCaseTr } from '../utils/textUtils';

interface SmartTextInputProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isTextarea?: boolean;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  className?: string;
}

export const SmartTextInput: React.FC<SmartTextInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = '',
  isTextarea = false,
  rows = 3,
  required = false,
  disabled = false,
  helperText,
  className = '',
}) => {
  const handleBlur = () => {
    if (value && value.trim()) {
      const formatted = formatToSentenceCaseTr(value);
      if (formatted !== value) {
        onChange(formatted);
      }
    }
  };

  const handleVoiceTranscript = (newText: string) => {
    if (!newText) return;
    if (value && value.trim()) {
      // Append if already has content
      const combined = `${value.trim()} ${newText}`;
      onChange(formatToSentenceCaseTr(combined));
    } else {
      onChange(formatToSentenceCaseTr(newText));
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label htmlFor={id} className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            {label}
            {required && <span className="text-red-500 ml-1 font-bold">*</span>}
          </label>
        </div>
      )}

      <div className="relative flex items-start">
        {isTextarea ? (
          <textarea
            id={id}
            rows={rows}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`w-full pr-10 p-2 sm:p-2.5 text-xs text-slate-900 bg-white rounded border transition-colors outline-none break-words whitespace-pre-wrap ${
              disabled
                ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                : 'border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-200'
            }`}
          />
        ) : (
          <input
            id={id}
            type="text"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`w-full pr-10 p-2 sm:p-2.5 text-xs text-slate-900 bg-white rounded border transition-colors outline-none break-words ${
              disabled
                ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                : 'border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-200'
            }`}
          />
        )}

        {!disabled && (
          <div className="absolute right-1.5 top-1.5 z-10">
            <VoiceInputButton onTranscript={handleVoiceTranscript} size="sm" />
          </div>
        )}
      </div>

      {helperText && (
        <p className="mt-1 text-[11px] text-slate-500 leading-tight">{helperText}</p>
      )}
    </div>
  );
};
