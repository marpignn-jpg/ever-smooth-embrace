import React from 'react';

export default function Stepper({ steps, current }) {
  return (
    <div className="flex items-start justify-between">
      {steps.map((label, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <div key={label} className="flex flex-1 flex-col items-center">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
              active ? 'bg-[#1a1a2e] text-white' :
              done ? 'bg-[#555] text-white' :
              'bg-[#888] text-white'
            }`}>
              {i + 1}
            </div>
            <span className={`mt-2 text-xs sm:text-sm text-center ${active ? 'font-bold text-foreground' : 'font-normal text-[#888]'}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}