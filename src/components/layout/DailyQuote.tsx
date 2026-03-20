"use client";

import React from "react";
import { getDailyQuote } from "@/lib/quotes";
import { MessageSquareQuote } from "lucide-react";

export default function DailyQuote() {
  const quote = getDailyQuote();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-500 via-brand-600 to-violet-600 p-5 sm:p-6 text-white">
      <div className="absolute top-0 right-0 opacity-10">
        <MessageSquareQuote className="w-32 h-32 -mt-4 -mr-4" />
      </div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -mb-24 -ml-24 blur-2xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
            <MessageSquareQuote className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Daily Motivation
          </span>
        </div>

        <blockquote className="text-base sm:text-lg font-medium leading-relaxed mb-3">
          &ldquo;{quote.text}&rdquo;
        </blockquote>

        <cite className="text-sm text-white/70 not-italic">
          &mdash; {quote.author}
        </cite>
      </div>
    </div>
  );
}
