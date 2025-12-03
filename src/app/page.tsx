"use client";

import { useState, useEffect } from "react";
import TodoList from "@/components/TodoList";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <TodoList />
    </main>
  );
}
