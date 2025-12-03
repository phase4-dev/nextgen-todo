"use client"

import { useState, useEffect } from "react"
import TodoList from "@/components/todo-list"
import { TodoProvider } from "@/components/todo-context"

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <TodoProvider>
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <TodoList />
      </main>
    </TodoProvider>
  )
}
