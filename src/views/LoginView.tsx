import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, ShieldCheck, ArrowRight, Lock, UserCheck } from 'lucide-react';

interface LoginViewProps {
  onSuccess: () => void;
  onBackToLanding?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess, onBackToLanding }) => {
  const { signInWithGoogle, user, loadingAuth } = useApp();
  const [submitting, setSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    try {
      await signInWithGoogle();
      if (user) {
        onSuccess();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F5] flex flex-col justify-center items-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#18181B] mx-auto mb-3 flex items-center justify-center text-white font-black text-xl shadow-xs">
            S
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] tracking-tight">
            Sign In to SmartCart AI
          </h1>
          <p className="text-sm text-[#57534E] mt-1.5">
            Access your personalized recommendations, saved items, and budget-optimized carts.
          </p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-[20px] border border-stone-200/80 shadow-[0_1px_3px_rgba(24,24,27,0.03),0_12px_28px_-6px_rgba(24,24,27,0.05)] bg-white">
          <div className="space-y-4">
            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={submitting || loadingAuth}
              className="w-full py-3.5 px-6 rounded-xl bg-white hover:bg-stone-50 text-[#18181B] border border-stone-200/90 font-bold text-sm flex items-center justify-center gap-3 shadow-2xs hover:shadow-xs transition-all active:scale-[0.98] disabled:opacity-60"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{submitting ? 'Connecting with Google...' : 'Continue with Google'}</span>
            </button>
          </div>

          {/* Security footnote */}
          <div className="mt-8 pt-6 border-t border-stone-100 flex items-start gap-3 text-xs text-[#57534E]">
            <Lock className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Protected by Firebase Authentication and Firestore security rules. User carts, lists, and query telemetry remain strictly isolated.
            </p>
          </div>
        </div>

        {onBackToLanding && (
          <div className="text-center mt-6">
            <button
              onClick={onBackToLanding}
              className="text-xs font-semibold text-[#57534E] hover:text-[#18181B] transition-colors"
            >
              ← Back to SmartCart AI Overview
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
