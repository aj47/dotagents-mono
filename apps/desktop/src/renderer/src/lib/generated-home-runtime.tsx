import * as Babel from "@babel/standalone"
import React, { useEffect, useMemo, useState } from "react"
import * as LucideIcons from "lucide-react"
import { Badge } from "@renderer/components/ui/badge"
import { Button } from "@renderer/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@renderer/components/ui/card"
import { Input } from "@renderer/components/ui/input"
import { ScrollArea } from "@renderer/components/ui/scroll-area"
import { Slider } from "@renderer/components/ui/slider"
import { Switch } from "@renderer/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@renderer/components/ui/tabs"
import { Textarea } from "@renderer/components/ui/textarea"
import { cn } from "@renderer/lib/utils"
import {
  validateHomeExperienceSource,
  type GeneratedHomeExperience,
} from "@shared/home-experience"

type GeneratedHomeComponent = React.ComponentType<{
  data: unknown
  actions: GeneratedHomeActions
  ui: typeof homeUi
  icons: typeof LucideIcons
}>

export type GeneratedHomeActions = {
  startTextSession: (initialText?: string) => void | Promise<void>
  startVoiceSession: () => void | Promise<void>
  runPrompt: (prompt: string) => void | Promise<void>
  continueConversation: (conversationId: string) => void | Promise<void>
  openSavedConversations: () => void
  navigate: (path: string) => void
  selectAgent: (agentId: string | null) => void
}

type GeneratedHomeErrorBoundaryProps = React.PropsWithChildren<{
  sourceKey: string
  fallback?: React.ReactNode
  onError?: (error: Error) => void
}>

type GeneratedHomeErrorBoundaryState = {
  error: string | null
}

const GeneratedHomeErrorBoundary: any = class GeneratedHomeErrorBoundary extends (React.Component as any) {
  state: GeneratedHomeErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: unknown): GeneratedHomeErrorBoundaryState {
    return {
      error: error instanceof Error ? error.message : String(error),
    }
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error)
  }

  componentDidUpdate(previousProps: GeneratedHomeErrorBoundaryProps) {
    if (previousProps.sourceKey !== this.props.sourceKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <GeneratedHomeFailure message={this.state.error} />
      )
    }

    return this.props.children
  }
}

type ChartPoint = {
  label: string
  value: number
  color?: string
}

type ProjectBoardColumn = {
  id?: string
  title: string
  items?: Array<{
    id?: string
    title?: string
    name?: string
    description?: string
    status?: string
  }>
}

const chartPalette = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"]

function normalizeChartPoints(points: unknown): ChartPoint[] {
  if (!Array.isArray(points)) return []
  return points
    .map((point, index): ChartPoint | null => {
      if (!point || typeof point !== "object") return null
      const record = point as Record<string, unknown>
      const value = Number(record.value)
      if (!Number.isFinite(value)) return null
      return {
        label: String(record.label ?? record.name ?? `Item ${index + 1}`),
        value,
        color: typeof record.color === "string" ? record.color : chartPalette[index % chartPalette.length],
      }
    })
    .filter((point): point is ChartPoint => !!point)
}

function Chart({
  points,
  type = "bar",
  className,
}: {
  points?: ChartPoint[]
  type?: "bar" | "line" | "area"
  className?: string
}) {
  const normalized = normalizeChartPoints(points)
  const values = normalized.map((point) => point.value)
  const max = Math.max(...values, 1)
  const width = 320
  const height = 140
  const padding = 18
  const xStep = normalized.length > 1
    ? (width - padding * 2) / (normalized.length - 1)
    : width - padding * 2
  const linePoints = normalized
    .map((point, index) => {
      const x = padding + index * xStep
      const y = height - padding - (point.value / max) * (height - padding * 2)
      return `${x},${y}`
    })
    .join(" ")

  if (normalized.length === 0) {
    return <div className={cn("rounded-md border border-border/70 p-4 text-sm text-muted-foreground", className)}>No chart data</div>
  }

  return (
    <div className={cn("rounded-md border border-border/70 bg-background/60 p-3", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full overflow-visible">
        {type === "bar" ? normalized.map((point, index) => {
          const barWidth = Math.max(10, (width - padding * 2) / normalized.length - 8)
          const barHeight = (point.value / max) * (height - padding * 2)
          const x = padding + index * ((width - padding * 2) / normalized.length) + 4
          const y = height - padding - barHeight
          return (
            <g key={`${point.label}-${index}`}>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx="4" fill={point.color} opacity="0.85" />
              <text x={x + barWidth / 2} y={height - 4} textAnchor="middle" className="fill-muted-foreground text-[9px]">{point.label.slice(0, 8)}</text>
            </g>
          )
        }) : (
          <>
            {type === "area" ? (
              <polygon
                points={`${padding},${height - padding} ${linePoints} ${width - padding},${height - padding}`}
                fill="currentColor"
                className="text-primary/10"
              />
            ) : null}
            <polyline points={linePoints} fill="none" stroke="currentColor" strokeWidth="3" className="text-primary" />
            {normalized.map((point, index) => {
              const [x, y] = linePoints.split(" ")[index].split(",").map(Number)
              return <circle key={`${point.label}-${index}`} cx={x} cy={y} r="4" fill={point.color} />
            })}
          </>
        )}
      </svg>
    </div>
  )
}

function Sparkline({ points, className }: { points?: ChartPoint[]; className?: string }) {
  return <Chart points={points} type="line" className={cn("border-0 bg-transparent p-0", className)} />
}

function Metric({
  label,
  value,
  detail,
  className,
}: {
  label: string
  value: string | number
  detail?: string
  className?: string
}) {
  return (
    <div className={cn("rounded-md border border-border/70 bg-card/80 p-3", className)}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {detail ? <div className="mt-1 text-xs text-muted-foreground">{detail}</div> : null}
    </div>
  )
}

function VideoPlayer({
  src,
  poster,
  title,
  className,
}: {
  src?: string
  poster?: string
  title?: string
  className?: string
}) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-border/70 bg-black", className)}>
      {src ? (
        <video src={src} poster={poster} controls className="aspect-video w-full bg-black" />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-muted text-muted-foreground">
          <LucideIcons.Play className="h-8 w-8" />
        </div>
      )}
      {title ? <div className="border-t border-white/10 bg-background px-3 py-2 text-sm">{title}</div> : null}
    </div>
  )
}

function FileList({
  items = [],
  className,
}: {
  items?: Array<{ id?: string; name?: string; path?: string; kind?: string; status?: string }>
  className?: string
}) {
  return (
    <div className={cn("divide-y divide-border rounded-md border border-border/70", className)}>
      {items.length === 0 ? (
        <div className="p-3 text-sm text-muted-foreground">No files</div>
      ) : items.map((item, index) => (
        <div key={item.id ?? item.path ?? index} className="flex min-w-0 items-center gap-3 p-3">
          <LucideIcons.FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{item.name ?? item.path ?? `File ${index + 1}`}</div>
            {item.path ? <div className="truncate text-xs text-muted-foreground">{item.path}</div> : null}
          </div>
          {item.status ? <Badge variant="outline">{item.status}</Badge> : null}
        </div>
      ))}
    </div>
  )
}

function ProjectBoard({
  columns = [],
  className,
}: {
  columns?: ProjectBoardColumn[]
  className?: string
}) {
  return (
    <div className={cn("grid gap-3 md:grid-cols-3", className)}>
      {columns.map((column, columnIndex) => (
        <div key={column.id ?? column.title ?? columnIndex} className="rounded-md border border-border/70 bg-card/70 p-3">
          <div className="text-sm font-semibold">{column.title}</div>
          <div className="mt-3 space-y-2">
            {(column.items ?? []).map((item, itemIndex) => (
              <div key={item.id ?? item.title ?? item.name ?? itemIndex} className="rounded-md bg-background/70 p-2 text-sm">
                <div className="font-medium">{item.title ?? item.name ?? `Item ${itemIndex + 1}`}</div>
                {item.description ? <div className="mt-1 text-xs text-muted-foreground">{item.description}</div> : null}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function GenericPrimitive({
  className,
  children,
  ...props
}: React.PropsWithChildren<{ className?: string } & Record<string, unknown>>) {
  return (
    <div className={cn("rounded-md border border-border/70 bg-card/70 p-3", className)} {...props}>
      {children}
    </div>
  )
}

const baseHomeUi = {
  Button,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Chart,
  FileList,
  Input,
  Metric,
  Panel({
    className,
    children,
  }: React.PropsWithChildren<{ className?: string }>) {
    return (
      <section
        className={cn(
          "rounded-lg border border-border/70 bg-card/80 p-4 shadow-sm",
          className,
        )}
      >
        {children}
      </section>
    )
  },
  ProjectBoard,
  ScrollArea,
  Slider,
  Sparkline,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  VideoPlayer,
}

const homeUi = new Proxy(baseHomeUi, {
  get(target, property) {
    if (property in target) {
      return target[property as keyof typeof target]
    }
    return GenericPrimitive
  },
}) as typeof baseHomeUi & Record<string, typeof GenericPrimitive>

function GeneratedHomeFailure({ message }: { message: string }) {
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center p-6 text-center">
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-left">
        <div className="text-sm font-semibold text-destructive">Generated home failed to load</div>
        <div className="mt-2 text-xs leading-relaxed text-muted-foreground">{message}</div>
      </div>
    </div>
  )
}

async function compileGeneratedHome(source: GeneratedHomeExperience): Promise<GeneratedHomeComponent> {
  const validation = validateHomeExperienceSource(source)
  if (!validation.ok) {
    throw new Error(validation.errors.join(" "))
  }

  const transformed = Babel.transform(source.tsx, {
    filename: "generated-home.tsx",
    sourceType: "module",
    presets: [
      ["typescript", { isTSX: true, allExtensions: true }],
      ["react", { runtime: "classic" }],
    ],
  }).code

  if (!transformed) {
    throw new Error("Generated home did not compile to JavaScript")
  }

  ;(globalThis as any).__dotagentsHomeRuntime = {
    React,
  }

  const moduleSource = [
    "const React = globalThis.__dotagentsHomeRuntime.React;",
    transformed,
  ].join("\n")
  const blob = new Blob([moduleSource], { type: "text/javascript" })
  const url = URL.createObjectURL(blob)

  try {
    const imported = await import(/* @vite-ignore */ url)
    const Component = imported.default
    if (typeof Component !== "function") {
      throw new Error("Generated home default export was not a React component")
    }
    return Component as GeneratedHomeComponent
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function GeneratedHomeRenderer({
  source,
  data,
  actions,
  className,
  fallback,
  onError,
}: {
  source: GeneratedHomeExperience
  data: unknown
  actions: GeneratedHomeActions
  className?: string
  fallback?: React.ReactNode
  onError?: (error: Error) => void
}) {
  const [Component, setComponent] = useState<GeneratedHomeComponent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const sourceKey = `${source.title}\n${source.tsx}\n${source.css ?? ""}`

  useEffect(() => {
    let cancelled = false
    setComponent(null)
    setError(null)

    void compileGeneratedHome(source)
      .then((compiled) => {
        if (!cancelled) setComponent(() => compiled)
      })
      .catch((err) => {
        if (!cancelled) {
          const nextError = err instanceof Error ? err : new Error(String(err))
          setError(nextError.message)
          onError?.(nextError)
        }
      })

    return () => {
      cancelled = true
    }
  }, [sourceKey])

  const runtimeProps = useMemo(
    () => ({
      data,
      actions,
      ui: homeUi,
      icons: LucideIcons,
    }),
    [actions, data],
  )

  if (error) return fallback ?? <GeneratedHomeFailure message={error} />

  if (!Component) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Preparing generated home...
      </div>
    )
  }

  return (
    <GeneratedHomeErrorBoundary
      sourceKey={sourceKey}
      fallback={fallback}
      onError={onError}
    >
      <div className={cn("min-h-full", className)}>
        {source.css?.trim() ? <style>{source.css}</style> : null}
        <Component {...runtimeProps} />
      </div>
    </GeneratedHomeErrorBoundary>
  )
}
