/**
 * Shared contract between the main-process loop service and the renderer
 * sidebar for distinguishing scheduled-task sessions from user sessions.
 *
 * The loop service tags every repeat-task conversation by prefixing the
 * conversation title with this string. The sidebar uses the same prefix
 * to group those entries into the dedicated Tasks section. Keep both
 * sides reading from this module so the contract can't drift.
 */
export const TASK_SESSION_TITLE_PREFIX = "[Repeat] "

export function formatRepeatTaskTitle(taskName: string): string {
  return `${TASK_SESSION_TITLE_PREFIX}${taskName}`
}

export function hasRepeatTaskTitlePrefix(title: string | undefined | null): boolean {
  return typeof title === "string" && title.startsWith(TASK_SESSION_TITLE_PREFIX)
}
