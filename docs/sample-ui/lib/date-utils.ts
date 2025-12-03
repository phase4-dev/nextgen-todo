export function formatRelativeDate(dateString: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const date = new Date(dateString)
  date.setHours(0, 0, 0, 0)

  const diffTime = date.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Tomorrow"
  if (diffDays === 2) return "2 days from now"
  if (diffDays > 2 && diffDays <= 7) return `${diffDays} days from now`

  // For dates further out, show the date
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
