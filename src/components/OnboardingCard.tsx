"use client";
import { useEffect, useState } from "react";
import { X, HelpCircle, Lightbulb } from "lucide-react";
import { PAGE_EXPLANATIONS, isDismissed, dismiss } from "@/lib/onboarding";

export default function OnboardingCard({ page }: { page: string }) {
  const [visible, setVisible] = useState(false);
  const info = PAGE_EXPLANATIONS[page];

  useEffect(() => {
    if (info && !isDismissed(page)) setVisible(true);
  }, [page, info]);

  if (!info || !visible) return null;

  const handleDismiss = () => {
    dismiss(page);
    setVisible(false);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-blue-400 hover:text-blue-700 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-5 h-5 text-blue-600" />
        </div>
        <div className="pr-6">
          <div className="font-semibold text-blue-900 mb-1">{info.title}</div>
          <p className="text-sm text-blue-800 leading-relaxed">{info.body}</p>
          {info.analogy && (
            <p className="text-sm text-blue-700 mt-2 italic border-l-2 border-blue-300 pl-3">
              💡 {info.analogy}
            </p>
          )}
          <button
            onClick={handleDismiss}
            className="mt-3 text-xs text-blue-600 hover:underline font-medium"
          >
            Got it, don&apos;t show again
          </button>
        </div>
      </div>
    </div>
  );
}

// Small help button to re-show the card
export function HelpButton({ page }: { page: string }) {
  const [visible, setVisible] = useState(false);
  const info = PAGE_EXPLANATIONS[page];
  if (!info) return null;

  if (visible) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6 relative">
        <button onClick={() => setVisible(false)} className="absolute top-3 right-3 text-blue-400 hover:text-blue-700">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="pr-6">
            <div className="font-semibold text-blue-900 mb-1">{info.title}</div>
            <p className="text-sm text-blue-800">{info.body}</p>
            {info.analogy && <p className="text-sm text-blue-700 mt-2 italic border-l-2 border-blue-300 pl-3">💡 {info.analogy}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setVisible(true)}
      className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
      title="What is this page?"
    >
      <HelpCircle className="w-3.5 h-3.5" />
      What is this?
    </button>
  );
}
