"use client";

import { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import { Todo } from "@/lib/supabase";
import { Plus } from "lucide-react";

type TodoFormProps = {
  onSubmit: (todo: Partial<Todo>) => void;
  onCancel: () => void;
  initialData?: Todo | null;
};

export default function TodoForm({ onSubmit, onCancel, initialData }: TodoFormProps) {
  const [isOpen, setIsOpen] = useState(!!initialData);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || "");
      setPriority(initialData.priority);
      setDueDate(
        initialData.due_date ? new Date(initialData.due_date) : null
      );
      setIsOpen(true);
    } else {
      // Reset form when creating a new todo
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate(null);
    }
  }, [initialData]);

  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        if (isOpen && !title.trim() && !initialData) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, title, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      due_date: dueDate ? dueDate.toISOString() : null,
    });

    if (!initialData) {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate(null);
      setIsOpen(false);
    } else {
      onCancel();
    }
  };

  const priorityOptions = [
    { value: "low", label: "Low", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200" },
    { value: "medium", label: "Medium", color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200" },
    { value: "high", label: "High", color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200" },
  ];

  if (!isOpen && !initialData) {
    return (
      <div ref={formRef} className="relative">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-border/40 hover:border-border/80 transition-all group text-muted-foreground hover:text-foreground bg-card/30 hover:bg-card/50"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">Add a task</span>
        </button>
      </div>
    );
  }

  return (
    <div ref={formRef} className="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-lg space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Title Input */}
      <input
        ref={titleInputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        className="w-full bg-transparent text-foreground placeholder-muted-foreground focus:outline-none text-base font-medium border-b border-border/40 pb-3 focus:border-primary/50 transition-colors"
        autoFocus
      />

      {/* Description Input */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add details..."
        className="w-full bg-transparent text-foreground placeholder-muted-foreground focus:outline-none text-sm border-b border-border/40 pb-3 focus:border-primary/50 transition-colors resize-none"
        rows={2}
      />

      {/* Priority Selection */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
          Priority
        </label>
        <div className="flex gap-2">
          {priorityOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPriority(opt.value as "low" | "medium" | "high")}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                priority === opt.value ? opt.color : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Selection */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
          Due Date
        </label>
        <DatePicker
          selected={dueDate}
          onChange={(date: Date | null) => setDueDate(date)}
          dateFormat="MMM dd, yyyy"
          placeholderText="Select a date"
          className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          wrapperClassName="w-full"
          calendarClassName="react-datepicker-dark"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-2">
        <button
          onClick={() => {
            if (initialData) {
              onCancel();
            } else {
              setIsOpen(false);
              setTitle("");
              setDescription("");
              setPriority("medium");
              setDueDate(null);
            }
          }}
          className="px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {initialData ? "Update Task" : "Add Task"}
        </button>
      </div>
    </div>
  );
}
