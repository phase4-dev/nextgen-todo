"use client";

import { useState } from "react";
import { Todo } from "@/lib/supabase";
import { Trash2, ChevronDown } from "lucide-react";
import { formatRelativeDate, getDaysOverdue } from "@/lib/date-utils";

type TodoItemProps = {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (todo: Todo) => void;
};

const priorityColors = {
  high: "from-red-400 to-red-500",
  medium: "from-amber-400 to-amber-500",
  low: "from-blue-400 to-blue-500",
};

const priorityAccent = {
  high: "bg-red-100 dark:bg-red-950",
  medium: "bg-amber-100 dark:bg-amber-950",
  low: "bg-blue-100 dark:bg-blue-950",
};

export default function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(todo.title);
  const [editedDescription, setEditedDescription] = useState(todo.description || "");

  const handleSave = () => {
    if (editedTitle.trim()) {
      onEdit({
        ...todo,
        title: editedTitle,
        description: editedDescription || null,
      });
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (confirm("Delete this task?")) {
      onDelete(todo.id);
    }
  };

  const relativeDate = formatRelativeDate(todo.due_date);
  const daysOverdue = !todo.completed && todo.due_date ? getDaysOverdue(todo.due_date) : 0;
  const isOverdue = daysOverdue > 0;

  // Calculate dynamic styling based on days overdue
  const getOverdueIntensity = () => {
    if (!isOverdue) return { scale: 1, glow: 0, redIntensity: 0 };
    // Scale from 1.0 to 1.15, glow from 0 to 20px, red intensity from 0 to 1
    const maxDays = 30; // Cap at 30 days for calculations
    const normalizedDays = Math.min(daysOverdue, maxDays) / maxDays;
    return {
      scale: 1 + (normalizedDays * 0.15), // 1.0 to 1.15
      glow: normalizedDays * 20, // 0 to 20px
      redIntensity: normalizedDays, // 0 to 1
    };
  };

  const overdueStyle = getOverdueIntensity();
  const redOpacity = isOverdue ? Math.min(0.3 + (overdueStyle.redIntensity * 0.7), 1) : 0;
  const redGlow = isOverdue ? `0 0 ${overdueStyle.glow}px rgba(239, 68, 68, ${0.3 + overdueStyle.redIntensity * 0.5})` : 'none';

  return (
    <div 
      className={`group transition-all duration-200 ${todo.completed ? "opacity-60 hover:opacity-100" : ""} ${
        isOverdue ? "overdue-item" : ""
      }`}
      style={{
        '--overdue-scale': overdueStyle.scale,
        '--overdue-glow': overdueStyle.glow,
        transformOrigin: 'top center',
      } as React.CSSProperties}
    >
      <div
        className={`relative rounded-xl border transition-all duration-200 overflow-hidden ${
          isExpanded
            ? "border-border bg-card shadow-md"
            : "border-border/50 bg-card/50 hover:border-border hover:bg-card/80"
        } ${isOverdue ? "border-red-500/50" : ""}`}
        style={{
          backgroundColor: isOverdue 
            ? `rgba(239, 68, 68, ${redOpacity})` 
            : undefined,
        }}
      >
        {/* Priority Indicator Gradient - Red for overdue */}
        <div 
          className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${
            isOverdue 
              ? `from-red-500 to-red-600` 
              : priorityColors[todo.priority]
          }`}
          style={{
            height: isOverdue ? `${1 + (overdueStyle.redIntensity * 2)}px` : '4px',
          }}
        />

        {/* Main Content */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Checkbox */}
            <button
              onClick={() => onToggle(todo.id, !todo.completed)}
              className={`flex-shrink-0 mt-1 w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                todo.completed ? "bg-green-500 border-green-500" : "border-border/50 hover:border-border"
              }`}
            >
              {todo.completed && (
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    autoFocus
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Task title"
                  />
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    placeholder="Task description"
                    rows={2}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-xs px-3 py-1.5 rounded text-muted-foreground hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left group/title">
                    <p
                      className={`font-medium transition-colors ${
                        todo.completed 
                          ? "line-through text-muted-foreground" 
                          : isOverdue 
                            ? "text-red-400" 
                            : "text-foreground"
                      }`}
                      style={{
                        color: isOverdue && !todo.completed 
                          ? `rgb(248, ${200 - (overdueStyle.redIntensity * 50)}, ${200 - (overdueStyle.redIntensity * 50)})`
                          : undefined,
                        fontWeight: isOverdue ? '600' : '500',
                      }}
                    >
                      {todo.title}
                    </p>
                  </button>

                  {/* Meta Info - Always visible */}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <div
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${
                        isOverdue 
                          ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                          : priorityAccent[todo.priority]
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${
                        isOverdue 
                          ? "from-red-500 to-red-600" 
                          : priorityColors[todo.priority]
                      }`} />
                      {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                    </div>
                    {todo.due_date && (
                      <span className={`text-xs ${isOverdue ? "text-red-400 font-semibold" : "text-muted-foreground"}`}>
                        {relativeDate}
                      </span>
                    )}
                    {isOverdue && (
                      <span className="text-xs font-bold text-red-500 animate-pulse">
                        ⚠️ This task is {daysOverdue} {daysOverdue === 1 ? "day" : "days"} late
                      </span>
                    )}
                  </div>

                  {/* Description - Show when expanded or if short */}
                  {(isExpanded || (todo.description && todo.description.length < 60)) && todo.description && (
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{todo.description}</p>
                  )}
                </>
              )}
            </div>

            {/* Actions */}
            {!isEditing && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => {
                    setIsExpanded(!isExpanded);
                  }}
                  className={`p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-all ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="hidden group-hover:flex gap-1">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                    }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
