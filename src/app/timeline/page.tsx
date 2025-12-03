"use client";

import { useState, useEffect } from "react";
import Timeline from "@/components/Timeline";

export default function TimelinePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Timeline />
    </main>
  );
}

