
import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
  // Create an array of steps
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="w-full mb-4">
      <div className="flex justify-between mb-1 text-xs text-muted-foreground">
        <span>Progress</span>
        <span>{currentStep}/{totalSteps}</span>
      </div>
      
      <div className="flex gap-2 w-full">
        {steps.map((step) => (
          <div key={step} className="flex-1 flex flex-col items-center">
            <div 
              className={`w-full h-2 rounded-full mb-1 transition-colors duration-300 ${
                step <= currentStep ? 'bg-primary' : 'bg-secondary/50'
              }`}
            />
            <span 
              className={`text-xs font-medium ${
                step <= currentStep ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
