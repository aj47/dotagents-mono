export const DEFAULT_REPEAT_TASK_INTERVAL_MINUTES = 60
export const DEFAULT_REPEAT_TASK_SCHEDULE_TIMES = ["09:00"] as const
export const DEFAULT_REPEAT_TASK_WEEKDAYS = [1, 2, 3, 4, 5] as const
export const DEFAULT_REPEAT_TASK_EXECUTION_OPTIONS = {
  enabled: true,
  runOnStartup: false,
  speakOnTrigger: false,
  continueInSession: false,
  runContinuously: false,
} as const
