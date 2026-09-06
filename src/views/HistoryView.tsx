import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  History, 
  ArrowRight, 
  Clock 
} from 'lucide-react';

interface HistoryViewProps {
  onReopenQuery: (query: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onReopenQuery }) => {
  const { history } = useApp();

  if (history.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 sm:p-12 text-center rounded-[20px] border border-stone-200/80 bg-white shadow-2xs space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#F4F2EC] text-[#57534E] flex items-center justify-center mx-auto">
          <History className="w-8 h-8 text-[#18181B]" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#18181B]">No activity recorded yet</h2>
        <p className="text-xs sm:text-sm text-[#57534E] max-w-sm mx-auto leading-relaxed">
          Your AI queries, product comparisons, and shopping session history will be securely logged here for instant recall.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] tracking-tight flex items-center gap-2.5">
          <span>Activity History</span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-[#18181B] border border-stone-200">
            {history.length} Entries
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-[#57534E] mt-1">
          Review previous AI queries, comparison sessions, and recommendations
        </p>
      </div>

      <div className="space-y-3">
        {history.map((item) => (
          <div 
            key={item.id}
            className="p-5 rounded-[20px] border border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(24,24,27,0.03),0_8px_20px_-6px_rgba(24,24,27,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-xs transition-all"
          >
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] text-[#57534E]">
                <Clock className="w-3.5 h-3.5 text-[#1D4ED8]" />
                <span>{new Date(item.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>

              <h4 className="font-bold text-sm text-[#18181B] leading-snug">
                "{item.query}"
              </h4>

              <p className="text-xs text-[#57534E] line-clamp-2 leading-relaxed">
                {item.summary}
              </p>

              {item.productsSelected && item.productsSelected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.productsSelected.map((prodName, i) => (
                    <span key={i} className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1D4ED8] border border-blue-200/60">
                      {prodName}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => onReopenQuery(item.query)}
              className="px-4 py-2 rounded-xl bg-[#F4F2EC] hover:bg-stone-200/80 text-[#18181B] text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 self-end sm:self-auto border border-stone-200/60"
            >
              <span>Ask Again</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#1D4ED8]" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
