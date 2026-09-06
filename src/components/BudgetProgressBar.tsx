import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BudgetProgressBarProps {
  currentCartOnly?: boolean;
}

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({ currentCartOnly = false }) => {
  const { preferences, cartSubtotal, formatPrice } = useApp();
  const budget = preferences.defaultBudget || 50000;
  
  const percentage = Math.min(Math.round((cartSubtotal / budget) * 100), 100);
  const isOverBudget = cartSubtotal > budget;
  const isNearBudget = percentage >= 80 && !isOverBudget;
  const remaining = Math.max(0, budget - cartSubtotal);

  return (
    <div className="rounded-[20px] p-5 border border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(24,24,27,0.03),0_8px_20px_-6px_rgba(24,24,27,0.04)]">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#18181B]">Monthly Budget Guard</span>
          {isOverBudget ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
              <AlertCircle className="w-3 h-3" /> OVER BUDGET
            </span>
          ) : isNearBudget ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
              NEAR CAP
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <CheckCircle2 className="w-3 h-3" /> ON TRACK
            </span>
          )}
        </div>
        <span className="text-xs font-semibold text-[#57534E]">
          Ceiling: <strong className="text-[#18181B]">{formatPrice(budget)}</strong>
        </span>
      </div>

      <div className="w-full h-2.5 bg-[#F4F2EC] rounded-full overflow-hidden mb-3 relative">
        <div 
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isOverBudget 
              ? 'bg-rose-500' 
              : isNearBudget 
                ? 'bg-amber-500' 
                : 'bg-[#1D4ED8]'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-[#18181B] font-medium">
          Cart Total: <strong className="text-[#18181B]">{formatPrice(cartSubtotal)}</strong> <span className="text-[#57534E]">({percentage}%)</span>
        </span>
        <span className={isOverBudget ? 'text-rose-600 font-bold' : 'text-[#57534E] font-medium'}>
          {isOverBudget 
            ? `Exceeded by ${formatPrice(cartSubtotal - budget)}` 
            : `${formatPrice(remaining)} available`}
        </span>
      </div>
    </div>
  );
};
