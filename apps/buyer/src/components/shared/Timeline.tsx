'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Package, ThumbsUp, Truck, MapPin, PartyPopper } from 'lucide-react';

interface TimelineStep {
  label: string;
  description?: string;
  isCompleted: boolean;
  isActive: boolean;
}

const stepIcons = [Package, ThumbsUp, Truck, MapPin, PartyPopper];

export default function Timeline({ steps }: { steps: TimelineStep[] }) {
  const completedCount = steps.filter((s) => s.isCompleted).length;
  const totalSteps = steps.length;
  const progressPercent = totalSteps > 1 ? ((completedCount + (steps.some((s) => s.isActive) ? 0.5 : 0)) / (totalSteps - 1)) * 100 : 0;

  return (
    <div className="px-4 py-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progress</span>
          <span className="text-[10px] font-bold text-lime-600">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-lime-400 to-lime-500 rounded-full"
          />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {steps.map((step, idx) => {
          const StepIcon = stepIcons[idx] ?? Circle;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.15 }}
              className="flex gap-5 relative"
            >
              {/* Connector */}
              {idx < steps.length - 1 && (
                <div className="absolute left-[17px] top-10 bottom-[-14px] w-0.5 bg-gray-100 overflow-hidden">
                  {step.isCompleted && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: '100%' }}
                      transition={{ duration: 0.5, delay: idx * 0.2 + 0.3 }}
                      className="w-full bg-lime-400"
                    />
                  )}
                </div>
              )}

              {/* Icon */}
              <div className="relative z-10 flex-shrink-0">
                {step.isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: idx * 0.2, stiffness: 300 }}
                    className="w-9 h-9 bg-lime-400 rounded-xl flex items-center justify-center shadow-lg shadow-lime-200"
                  >
                    <CheckCircle2 className="w-4.5 h-4.5 text-gray-900" />
                  </motion.div>
                ) : step.isActive ? (
                  <div className="w-9 h-9 bg-white border-2 border-lime-400 rounded-xl flex items-center justify-center relative">
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 bg-lime-400 rounded-xl"
                    />
                    <StepIcon className="w-4 h-4 text-lime-600 relative z-10" />
                  </div>
                ) : (
                  <div className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                    <StepIcon className="w-4 h-4 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col justify-center min-h-[36px]">
                <span className={`text-sm font-bold tracking-wide ${
                  step.isCompleted ? 'text-gray-900' : step.isActive ? 'text-lime-700' : 'text-gray-300'
                }`}>
                  {step.label}
                </span>
                {step.description && (
                  <span className="text-[11px] text-gray-400 mt-0.5 font-medium">{step.description}</span>
                )}
                {step.isActive && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] font-bold text-lime-600 mt-1"
                  >
                    In Progress
                  </motion.span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
