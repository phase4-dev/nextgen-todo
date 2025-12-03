"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase, Todo } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

import {
  Clock,
  AlertCircle,
  CheckCircle2,
  Target,
  Zap,
  Calendar,
} from "lucide-react";
import Link from "next/link";

type TimeRange = "7d" | "30d" | "90d" | "all";

export default function Dashboard() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

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

  // Filter todos based on time range
  const filteredTodos = useMemo(() => {
    if (timeRange === "all") return todos;

    const now = new Date();
    const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    return todos.filter((todo) => new Date(todo.created_at) >= cutoffDate);
  }, [todos, timeRange]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = filteredTodos.length;
    const completed = filteredTodos.filter((t) => t.completed).length;
    const active = total - completed;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    // Overdue items
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = filteredTodos.filter((todo) => {
      if (todo.completed || !todo.due_date) return false;
      const dueDate = new Date(todo.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    });

    const overdueCount = overdue.length;
    const overdueRate = total > 0 ? (overdueCount / total) * 100 : 0;

    // Priority distribution
    const priorityCounts = {
      high: filteredTodos.filter((t) => t.priority === "high").length,
      medium: filteredTodos.filter((t) => t.priority === "medium").length,
      low: filteredTodos.filter((t) => t.priority === "low").length,
    };

    // Average completion time (in days)
    const completedTodos = filteredTodos.filter(
      (t) => t.completed && t.completed_at && t.created_at
    );
    const avgCompletionTime =
      completedTodos.length > 0
        ? completedTodos.reduce((sum, todo) => {
            const created = new Date(todo.created_at);
            const completed = new Date(todo.completed_at!);
            const days = Math.ceil(
              (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
            );
            return sum + days;
          }, 0) / completedTodos.length
        : 0;

    // Productivity score (0-100)
    // Based on: completion rate (40%), low overdue rate (30%), recent activity (30%)
    const recentCompletions = filteredTodos.filter((t) => {
      if (!t.completed_at) return false;
      const completed = new Date(t.completed_at);
      const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysAgo);
      return completed >= cutoff;
    }).length;

    const activityScore =
      total > 0 ? Math.min((recentCompletions / total) * 100, 100) : 0;
    const productivityScore = Math.round(
      completionRate * 0.4 + (100 - overdueRate) * 0.3 + activityScore * 0.3
    );

    return {
      total,
      completed,
      active,
      completionRate,
      overdueCount,
      overdueRate,
      priorityCounts,
      avgCompletionTime,
      productivityScore,
    };
  }, [filteredTodos, timeRange]);

  // Completion trend data (last 30 days)
  const completionTrendData = useMemo(() => {
    const days = 30;
    const data: { date: string; completed: number; created: number }[] = [];

    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      const completed = filteredTodos.filter((todo) => {
        if (!todo.completed_at) return false;
        const completedDate = new Date(todo.completed_at);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === date.getTime();
      }).length;

      const created = filteredTodos.filter((todo) => {
        const createdDate = new Date(todo.created_at);
        createdDate.setHours(0, 0, 0, 0);
        return createdDate.getTime() === date.getTime();
      }).length;

      data.push({ date: dateStr, completed, created });
    }

    return data;
  }, [filteredTodos]);

  // Priority distribution data
  const priorityData = [
    { name: "High", value: metrics.priorityCounts.high, color: "#ef4444" },
    { name: "Medium", value: metrics.priorityCounts.medium, color: "#f59e0b" },
    { name: "Low", value: metrics.priorityCounts.low, color: "#3b82f6" },
  ].filter((item) => item.value > 0);

  const completionChartConfig = {
    completed: {
      label: "Completed",
      color: "#06d6a0",
    },
    created: {
      label: "Created",
      color: "#3b82f6",
    },
  };

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
        <div className="max-w-7xl mx-auto px-6 py-6 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">
                Performance Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track your productivity and stay on task
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="px-4 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Tasks
              </Link>
              <Link
                href="/timeline"
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="View timeline"
              >
                <Calendar className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Time Range
            </span>
            <div className="flex gap-1 bg-muted/50 p-1 rounded">
              {(["7d", "30d", "90d", "all"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    timeRange === range
                      ? "bg-background text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {range === "all" ? "All Time" : range}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-6">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Tasks
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.total}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.completed} completed, {metrics.active} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completion Rate
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.completionRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.completed} of {metrics.total} tasks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Overdue Items
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.overdueCount}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.overdueRate.toFixed(1)}% of total tasks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Productivity Score
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.productivityScore}
                </div>
                <p className="text-xs text-muted-foreground">Out of 100</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Completion Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Completion Trend</CardTitle>
                <CardDescription>
                  Tasks completed vs created over the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={completionChartConfig}>
                  <LineChart data={completionTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="#06d6a0"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Completed"
                    />
                    <Line
                      type="monotone"
                      dataKey="created"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Created"
                    />
                    <Legend />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
                <CardDescription>
                  Breakdown of tasks by priority level
                </CardDescription>
              </CardHeader>
              <CardContent>
                {priorityData.length > 0 ? (
                  <ChartContainer config={{}}>
                    <PieChart>
                      <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No priority data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Average Completion Time</CardTitle>
                <CardDescription>
                  How long it takes to complete tasks on average
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <div className="text-3xl font-bold">
                      {metrics.avgCompletionTime > 0
                        ? `${metrics.avgCompletionTime.toFixed(1)} days`
                        : "N/A"}
                    </div>
                    {metrics.avgCompletionTime > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Based on{" "}
                        {
                          filteredTodos.filter(
                            (t) => t.completed && t.completed_at
                          ).length
                        }{" "}
                        completed tasks
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Tasks completed in the selected time range
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Completed
                    </span>
                    <span className="text-lg font-semibold">
                      {metrics.completed}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Active
                    </span>
                    <span className="text-lg font-semibold">
                      {metrics.active}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Overdue
                    </span>
                    <span className="text-lg font-semibold text-red-400">
                      {metrics.overdueCount}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
