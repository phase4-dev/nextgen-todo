"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase, Todo } from "@/lib/supabase";
import { ArrowLeft, Calendar, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function Timeline() {
  const [completedTodos, setCompletedTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompletedTodos();
  }, []);

  const fetchCompletedTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("todos")
        .select("*")
        .eq("completed", true)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false });

      if (fetchError) throw fetchError;
      setCompletedTodos(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch completed tasks");
    } finally {
      setLoading(false);
    }
  };

  // Group todos by date
  const groupedTodos = useMemo(() => {
    const groups: Record<string, { dateKey: string; todos: Todo[]; sortKey: string }> = {};
    
    completedTodos.forEach((todo) => {
      if (!todo.completed_at) return;
      const date = new Date(todo.completed_at);
      const dateKey = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      // Create a sortable key (YYYY-MM-DD format)
      const sortKey = date.toISOString().split("T")[0];
      
      if (!groups[dateKey]) {
        groups[dateKey] = { dateKey, todos: [], sortKey };
      }
      groups[dateKey].todos.push(todo);
    });

    return groups;
  }, [completedTodos]);

  const sortedDates = useMemo(() => {
    return Object.values(groupedTodos)
      .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
      .map((group) => group.dateKey);
  }, [groupedTodos]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-3xl mx-auto px-6 py-6 sm:px-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">
                Timeline
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Everything you've shipped + reflections
              </p>
            </div>
            <Link
              href="/dashboard"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="View dashboard"
            >
              <BarChart3 className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="max-w-3xl w-full mx-auto px-6 sm:px-8 py-6 flex flex-col flex-1 min-h-0">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-2 underline hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto min-h-0">
            {sortedDates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Calendar className="w-16 h-16 text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground text-sm">
                  No completed tasks yet
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Complete tasks to see them here
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {sortedDates.map((dateKey) => (
                  <div key={dateKey} className="relative">
                    {/* Date Header */}
                    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm pb-4 mb-4">
                      <h2 className="text-lg font-semibold text-foreground">
                        {dateKey}
                      </h2>
                    </div>

                    {/* Timeline Items */}
                    <div className="space-y-4 pl-6 border-l-2 border-border/30">
                      {groupedTodos[dateKey].todos.map((todo, index) => (
                        <div
                          key={todo.id}
                          className="relative -ml-6 pb-6 last:pb-0"
                        >
                          {/* Timeline Dot */}
                          <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-primary border-2 border-background" />

                          {/* Content Card */}
                          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                            <div className="space-y-3">
                              {/* Task Title */}
                              <div>
                                <h3 className="font-medium text-foreground line-through opacity-60">
                                  {todo.title}
                                </h3>
                                {todo.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-through opacity-50">
                                    {todo.description}
                                  </p>
                                )}
                              </div>

                              {/* Reflection */}
                              {todo.reflection ? (
                                <div className="bg-muted/50 border-l-2 border-primary/50 rounded-r-lg p-3">
                                  <p className="text-sm text-foreground italic">
                                    "{todo.reflection}"
                                  </p>
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground/60 italic">
                                  No reflection recorded
                                </p>
                              )}

                              {/* Time */}
                              {todo.completed_at && (
                                <p className="text-xs text-muted-foreground">
                                  {(() => {
                                    const completedDate = new Date(todo.completed_at);
                                    const now = new Date();
                                    const diffMs = now.getTime() - completedDate.getTime();
                                    const diffMins = Math.floor(diffMs / 60000);
                                    const diffHours = Math.floor(diffMs / 3600000);
                                    const diffDays = Math.floor(diffMs / 86400000);

                                    if (diffMins < 1) return "Just now";
                                    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
                                    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
                                    if (diffDays === 1) return "Yesterday";
                                    if (diffDays < 7) return `${diffDays} days ago`;
                                    return completedDate.toLocaleTimeString("en-US", {
                                      hour: "numeric",
                                      minute: "2-digit",
                                    });
                                  })()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

