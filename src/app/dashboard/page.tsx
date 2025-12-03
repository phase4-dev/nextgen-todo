"use client";

import { useState, useEffect } from "react";
import Dashboard from "@/components/Dashboard";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Dashboard />
    </main>
  );
}

