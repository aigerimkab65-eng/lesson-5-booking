"use client";

import { Clock } from "lucide-react";
import type { Topic } from "@/lib/topics";

interface TopicPickerProps {
  topics: Topic[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TopicPicker({ topics, selectedId, onSelect }: TopicPickerProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl">
          1. Выберите тему консультации
        </h2>
        <p className="mt-1 text-sm text-muted">Каждая встреча длится 60 минут</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {topics.map((topic, index) => {
          const selected = topic.id === selectedId;
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => onSelect(topic.id)}
              className={`card-enter rounded-2xl border px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                selected
                  ? "border-accent bg-accent-soft shadow-[var(--shadow)]"
                  : "border-border bg-surface hover:border-accent/40"
              }`}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <p className="text-sm font-semibold text-foreground sm:text-base">
                {topic.title}
              </p>
              <p className="mt-1.5 text-sm text-muted">{topic.description}</p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                60 минут
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
