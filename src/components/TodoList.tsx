"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase, Todo } from "@/lib/supabase";
import TodoItem from "./TodoItem";
import TodoForm from "./TodoForm";
import ReflectionDialog from "./ReflectionDialog";
import Link from "next/link";
import { Calendar, BarChart3 } from "lucide-react";

type FilterType = "all" | "active" | "completed";
type SortType = "date" | "priority";

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("date");
  const [showReflectionDialog, setShowReflectionDialog] = useState(false);
  const [completedTodo, setCompletedTodo] = useState<Todo | null>(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("todos")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setTodos(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch todos");
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (todoData: Partial<Todo>) => {
    try {
      const { data, error: insertError } = await supabase
        .from("todos")
        .insert([todoData])
        .select()
        .single();

      if (insertError) throw insertError;
      setTodos((prevTodos) => [data, ...prevTodos]);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add todo");
    }
  };

  const updateTodo = async (todoData: Partial<Todo>) => {
    if (!editingTodo) return;

    try {
      const { data, error: updateError } = await supabase
        .from("todos")
        .update(todoData)
        .eq("id", editingTodo.id)
        .select()
        .single();

      if (updateError) throw updateError;
      setTodos((prevTodos) =>
        prevTodos.map((t) => (t.id === editingTodo.id ? data : t))
      );
      setEditingTodo(null);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update todo");
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      const todo = todos.find((t) => t.id === id);

      if (completed && todo && !todo.completed) {
        // Task is being completed - show reflection dialog
        setCompletedTodo(todo);
        setShowReflectionDialog(true);
        // Don't update the database yet, wait for reflection
        return;
      }

      // Task is being uncompleted or we're updating after reflection
      const updateData: Partial<Todo> = { completed };
      if (!completed) {
        // If uncompleting, clear reflection and completed_at
        updateData.reflection = null;
        updateData.completed_at = null;
      }

      const { error: updateError } = await supabase
        .from("todos")
        .update(updateData)
        .eq("id", id);

      if (updateError) throw updateError;
      setTodos((prevTodos) =>
        prevTodos.map((t) => (t.id === id ? { ...t, ...updateData } : t))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update todo");
    }
  };

  const handleReflectionSave = async (reflection: string | null) => {
    if (!completedTodo) return;

    try {
      const updateData: Partial<Todo> = {
        completed: true,
        reflection,
        completed_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("todos")
        .update(updateData)
        .eq("id", completedTodo.id);

      if (updateError) throw updateError;
      setTodos((prevTodos) =>
        prevTodos.map((t) =>
          t.id === completedTodo.id ? { ...t, ...updateData } : t
        )
      );
      setShowReflectionDialog(false);
      setCompletedTodo(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save reflection"
      );
    }
  };

  const handleReflectionSkip = () => {
    handleReflectionSave(null);
  };

  const deleteTodo = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("todos")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;
      setTodos((prevTodos) => prevTodos.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete todo");
    }
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTodo(null);
  };

  const filteredTodos = useMemo(() => {
    let result = todos;

    if (filter === "active") {
      result = result.filter((t) => !t.completed);
    } else if (filter === "completed") {
      result = result.filter((t) => t.completed);
    }

    // Calculate overdue status for each todo
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todosWithOverdue = result.map((todo) => {
      let daysOverdue = 0;
      if (todo.due_date && !todo.completed) {
        const dueDate = new Date(todo.due_date);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = today.getTime() - dueDate.getTime();
        daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysOverdue = daysOverdue > 0 ? daysOverdue : 0;
      }
      return { ...todo, daysOverdue };
    });

    // Sort: Overdue tasks first (sorted by days overdue descending), then others
    if (sortBy === "priority") {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      todosWithOverdue.sort((a, b) => {
        // Overdue tasks always come first
        if (a.daysOverdue > 0 && b.daysOverdue === 0) return -1;
        if (a.daysOverdue === 0 && b.daysOverdue > 0) return 1;
        // If both overdue, sort by days overdue (most overdue first)
        if (a.daysOverdue > 0 && b.daysOverdue > 0) {
          return b.daysOverdue - a.daysOverdue;
        }
        // Otherwise sort by priority
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    } else {
      // Sort by date, but overdue tasks first
      todosWithOverdue.sort((a, b) => {
        // Overdue tasks always come first
        if (a.daysOverdue > 0 && b.daysOverdue === 0) return -1;
        if (a.daysOverdue === 0 && b.daysOverdue > 0) return 1;
        // If both overdue, sort by days overdue (most overdue first)
        if (a.daysOverdue > 0 && b.daysOverdue > 0) {
          return b.daysOverdue - a.daysOverdue;
        }
        // Otherwise sort by date
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
    }

    return todosWithOverdue;
  }, [todos, filter, sortBy]);

  const activeTodos = todos.filter((t) => !t.completed).length;

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
        <div className="max-w-2xl mx-auto px-6 py-6 sm:px-8">
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
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">
                Tasks
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTodos} {activeTodos === 1 ? "task" : "tasks"} to complete
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="View dashboard"
              >
                <BarChart3 className="w-5 h-5" />
              </Link>
              <Link
                href="/timeline"
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="View timeline"
              >
                <Calendar className="w-5 h-5" />
              </Link>
              <div className="hidden sm:flex gap-1 bg-muted p-1 rounded-lg">
                {(["all", "active", "completed"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      filter === f
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="max-w-2xl w-full mx-auto px-6 sm:px-8 py-6 flex flex-col flex-1 min-h-0">
          {/* Add Todo Form */}
          <div className="mb-6">
            {showForm ? (
              <TodoForm
                onSubmit={editingTodo ? updateTodo : addTodo}
                onCancel={handleCancel}
                initialData={editingTodo}
              />
            ) : (
              <button
                onClick={() => {
                  setEditingTodo(null);
                  setShowForm(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-border/40 hover:border-border/80 transition-all group text-muted-foreground hover:text-foreground bg-card/30 hover:bg-card/50"
              >
                <svg
                  className="w-5 h-5 group-hover:scale-110 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="text-sm font-medium">Add a task</span>
              </button>
            )}
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Sort
            </span>
            <div className="flex gap-1 bg-muted/50 p-1 rounded">
              {(["date", "priority"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    sortBy === s
                      ? "bg-background text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Todo Items */}
          <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
            {filteredTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="text-6xl mb-3 opacity-10">○</div>
                <p className="text-muted-foreground text-sm">
                  {filter === "completed"
                    ? "No completed tasks"
                    : "No tasks yet"}
                </p>
                {filter === "all" && (
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Create one to get started
                  </p>
                )}
              </div>
            ) : (
              filteredTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                  onEdit={handleEdit}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reflection Dialog */}
      {completedTodo && (
        <ReflectionDialog
          isOpen={showReflectionDialog}
          taskTitle={completedTodo.title}
          onSave={handleReflectionSave}
          onSkip={handleReflectionSkip}
        />
      )}
    </div>
  );
}
