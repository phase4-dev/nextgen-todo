"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export interface Todo {
  id: string
  title: string
  description: string
  priority: "low" | "medium" | "high"
  dueDate: string // ISO date string
  completed: boolean
  createdAt: string
}

interface TodoContextType {
  todos: Todo[]
  addTodo: (todo: Omit<Todo, "id" | "createdAt">) => void
  updateTodo: (id: string, updates: Partial<Todo>) => void
  deleteTodo: (id: string) => void
  toggleComplete: (id: string) => void
}

const TodoContext = createContext<TodoContextType | undefined>(undefined)

export function TodoProvider({ children }: { children: React.ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("todos")
      if (stored) {
        setTodos(JSON.parse(stored))
      }
    } catch (error) {
      console.error("Failed to load todos from localStorage:", error)
    }
    setIsHydrated(true)
  }, [])

  // Save to localStorage whenever todos change
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("todos", JSON.stringify(todos))
    }
  }, [todos, isHydrated])

  const addTodo = (todo: Omit<Todo, "id" | "createdAt">) => {
    const newTodo: Todo = {
      ...todo,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    setTodos((prev) => [newTodo, ...prev])
  }

  const updateTodo = (id: string, updates: Partial<Todo>) => {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, ...updates } : todo)))
  }

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id))
  }

  const toggleComplete = (id: string) => {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))
  }

  return (
    <TodoContext.Provider
      value={{
        todos,
        addTodo,
        updateTodo,
        deleteTodo,
        toggleComplete,
      }}
    >
      {children}
    </TodoContext.Provider>
  )
}

export function useTodos() {
  const context = useContext(TodoContext)
  if (context === undefined) {
    throw new Error("useTodos must be used within a TodoProvider")
  }
  return context
}
