"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useTodos } from "./todo-context"
import { Plus } from "lucide-react"

export default function AddTodoForm() {
  const { addTodo } = useTodos()
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [daysOffset, setDaysOffset] = useState(0)
  const formRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const getDueDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + daysOffset)
    return date.toISOString().split("T")[0]
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      addTodo({
        title,
        description,
        priority,
        dueDate: getDueDate(),
        completed: false,
      })
      setTitle("")
      setDescription("")
      setPriority("medium")
      setDaysOffset(0)
      setIsOpen(false)
    }
  }

  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        if (isOpen && !title.trim()) {
          setIsOpen(false)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, title])

  const priorityOptions = [
    { value: "low", label: "Low", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200" },
    { value: "medium", label: "Medium", color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200" },
    { value: "high", label: "High", color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200" },
  ]

  const dayLabels = ["Today", "Tomorrow", "In 2 days", "In 3 days", "In 7 days"]

  return (
    <div ref={formRef} className="relative">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-border/40 hover:border-border/80 transition-all group text-muted-foreground hover:text-foreground bg-card/30 hover:bg-card/50"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">Add a task</span>
        </button>
      ) : (
        <div className="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-lg space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Title Input */}
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full bg-transparent text-foreground placeholder-muted-foreground focus:outline-none text-base font-medium border-b border-border/40 pb-3 focus:border-primary/50 transition-colors"
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
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {dayLabels.map((label, index) => (
                <button
                  key={index}
                  onClick={() =>
                    setDaysOffset(index === 0 ? 0 : index === 1 ? 1 : index === 2 ? 2 : index === 3 ? 3 : 7)
                  }
                  className={`whitespace-nowrap px-3 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                    daysOffset === (index === 0 ? 0 : index === 1 ? 1 : index === 2 ? 2 : index === 3 ? 3 : 7)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => {
                setIsOpen(false)
                setTitle("")
                setDescription("")
                setPriority("medium")
                setDaysOffset(0)
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
              Add Task
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
