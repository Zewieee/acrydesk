import { Check } from 'lucide-react';
import { productionStageConfig, type ProductionStage } from '../types/rfq';

interface ProductionTrackerProps {
  currentStage?: ProductionStage | null;
}

export default function ProductionTracker({ currentStage }: ProductionTrackerProps) {
  const stages = Object.entries(productionStageConfig).sort((a, b) => a[1].id - b[1].id);
  
  let currentIndex = -1;
  if (currentStage) {
    currentIndex = stages.findIndex(([key]) => key === currentStage);
  }

  return (
    <div className="py-6 px-2">
      <div className="relative">
        {/* Line */}
        <div className="absolute left-6 right-6 top-4 -translate-y-1/2 h-1 bg-slate-200 rounded"></div>
        {/* Progress Line */}
        <div 
          className="absolute left-6 top-4 -translate-y-1/2 h-1 bg-blue-500 rounded transition-all duration-500"
          style={{ width: currentIndex >= 0 ? `calc(${(currentIndex / (stages.length - 1)) * 100}% - 12px)` : '0%', maxWidth: 'calc(100% - 48px)' }}
        ></div>

        <div className="relative flex justify-between">
          {stages.map(([key, config], index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;
            
            return (
              <div key={key} className="flex flex-col items-center relative gap-2 z-10 w-24">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-blue-600 shadow-lg shadow-blue-500/30' 
                      : 'bg-white border-2 border-slate-300'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={16} className="text-white" />
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">{config.id}</span>
                  )}
                </div>
                <div className="text-center">
                  <p className={`text-xs font-medium ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-800' : 'text-slate-500'}`}>
                    {config.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
