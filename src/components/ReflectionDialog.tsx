"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ReflectionDialogProps = {
  isOpen: boolean;
  taskTitle: string;
  onSave: (reflection: string | null) => void;
  onSkip: () => void;
};

export default function ReflectionDialog({
  isOpen,
  taskTitle,
  onSave,
  onSkip,
}: ReflectionDialogProps) {
  const [reflection, setReflection] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setReflection("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reflection.trim()) {
      onSave(reflection.trim());
    } else {
      onSkip();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onSkip();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onSkip}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Dialog */}
      <div
        className="relative z-50 w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-lg p-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Task completed! 🎉
            </h2>
            <p className="text-sm text-muted-foreground">
              How did this go / what did I learn?
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              ref={inputRef}
              type="text"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your reflection (optional)..."
              className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              maxLength={200}
            />

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onSkip}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Skip
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

