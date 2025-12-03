"use client"

import { useState } from "react"
import { useTodos } from "./todo-context"
import type { Todo } from "./todo-context"
import { Trash2, ChevronDown } from "lucide-react"
import { formatRelativeDate } from "@/lib/date-utils"

interface TodoItemProps {
  todo: Todo
}

const priorityColors = {
  high: "from-red-400 to-red-500",
  medium: "from-amber-400 to-amber-500",
  low: "from-blue-400 to-blue-500",
}

const priorityAccent = {
  high: "bg-red-100 dark:bg-red-950",
  medium: "bg-amber-100 dark:bg-amber-950",
  low: "bg-blue-100 dark:bg-blue-950",
}

export default function TodoItem({ todo }: TodoItemProps) {
  const { updateTodo, deleteTodo, toggleComplete } = useTodos()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(todo.title)
  const [editedDescription, setEditedDescription] = useState(todo.description)

  const handleSave = () => {
    if (editedTitle.trim()) {
      updateTodo(todo.id, {
        title: editedTitle,
        description: editedDescription,
      })
      setIsEditing(false)
    }
  }

  const handleDelete = () => {
    if (confirm("Delete this task?")) {
      deleteTodo(todo.id)
    }
  }

  const relativeDate = formatRelativeDate(todo.dueDate)

  return (
    <div className={`group transition-all duration-200 ${todo.completed ? "opacity-60 hover:opacity-100" : ""}`}>
      <div
        className={`relative rounded-xl border transition-all duration-200 overflow-hidden ${
          isExpanded
            ? "border-border bg-card shadow-md"
            : "border-border/50 bg-card/50 hover:border-border hover:bg-card/80"
        }`}
      >
        {/* Priority Indicator Gradient */}
        <div className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${priorityColors[todo.priority]}`} />

        {/* Main Content */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Checkbox */}
            <button
              onClick={() => toggleComplete(todo.id)}
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
                        todo.completed ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {todo.title}
                    </p>
                  </button>

                  {/* Meta Info - Always visible */}
                  <div className="flex items-center gap-3 mt-2">
                    <div
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${priorityAccent[todo.priority]}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${priorityColors[todo.priority]}`} />
                      {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
                    </div>
                    <span className="text-xs text-muted-foreground">{relativeDate}</span>
                  </div>

                  {/* Description - Show when expanded or if short */}
                  {(isExpanded || todo.description.length < 60) && todo.description && (
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
                    setIsExpanded(!isExpanded)
                  }}
                  className={`p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-all ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="hidden group-hover:flex gap-1">
                  <button
                    onClick={() => setIsEditing(true)}
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
  )
}
