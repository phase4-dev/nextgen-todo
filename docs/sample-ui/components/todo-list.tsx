"use client"

import { useMemo, useState } from "react"
import { useTodos } from "./todo-context"
import TodoItem from "./todo-item"
import AddTodoForm from "./add-todo-form"

type FilterTab = "all" | "active" | "completed"

export default function TodoList() {
  const { todos } = useTodos()
  const [filter, setFilter] = useState<FilterTab>("all")
  const [sortBy, setSortBy] = useState<"date" | "priority">("date")

  const filteredTodos = useMemo(() => {
    let result = todos

    if (filter === "active") {
      result = result.filter((t) => !t.completed)
    } else if (filter === "completed") {
      result = result.filter((t) => t.completed)
    }

    // Sort
    if (sortBy === "priority") {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      result = result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    } else {
      // Sort by date
      result = result.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    }

    return result
  }, [todos, filter, sortBy])

  const activeTodos = todos.filter((t) => !t.completed).length

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-2xl mx-auto px-6 py-6 sm:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">Tasks</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTodos} {activeTodos === 1 ? "task" : "tasks"} to complete
              </p>
            </div>
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

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="max-w-2xl w-full mx-auto px-6 sm:px-8 py-6 flex flex-col flex-1 min-h-0">
          {/* Add Todo Form */}
          <div className="mb-6">
            <AddTodoForm />
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Sort</span>
            <div className="flex gap-1 bg-muted/50 p-1 rounded">
              {(["date", "priority"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    sortBy === s ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
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
                  {filter === "completed" ? "No completed tasks" : "No tasks yet"}
                </p>
                {filter === "all" && <p className="text-xs text-muted-foreground/60 mt-1">Create one to get started</p>}
              </div>
            ) : (
              filteredTodos.map((todo) => <TodoItem key={todo.id} todo={todo} />)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
