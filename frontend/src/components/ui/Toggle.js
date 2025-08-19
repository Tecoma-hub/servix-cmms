// frontend/src/components/ui/Toggle.js
import React from 'react';

export default function Toggle({ checked, onChange, id, label, disabled = false }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        id={id}
        aria-pressed={checked}
        aria-labelledby={label ? `${id}-label` : undefined}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition 
          ${checked ? 'bg-indigo-600' : 'bg-gray-300'} 
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition 
            ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
      {label && (
        <span id={`${id}-label`} className="text-sm text-slate-700 dark:text-slate-200">
          {label}
        </span>
      )}
    </div>
  );
}
