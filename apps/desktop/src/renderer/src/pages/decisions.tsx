import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { Decision, Goal } from "@dotagents/shared"
import { Badge } from "@renderer/components/ui/badge"
import { Button } from "@renderer/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@renderer/components/ui/card"
import { Input } from "@renderer/components/ui/input"
import { Textarea } from "@renderer/components/ui/textarea"
import { tipcClient } from "@renderer/lib/tipc-client"

type Tab = "pending" | "history"

function formatTime(timestamp?: number | null): string {
  if (!timestamp) return "None"
  return new Date(timestamp).toLocaleString()
}

function DecisionCard({
  decision,
  goal,
  onAnswer,
  onDefer,
  onCancel,
}: {
  decision: Decision
  goal?: Goal
  onAnswer: (decision: Decision, answer: string) => void
  onDefer: (decision: Decision) => void
  onCancel: (decision: Decision) => void
}) {
  const [customAnswer, setCustomAnswer] = useState("")
  const isPending = decision.status === "pending"

  return (
    <Card className="border-border/70">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{decision.question}</CardTitle>
            <CardDescription className="mt-1">
              {goal ? `Goal: ${goal.title}` : decision.goalId ? `Goal: ${decision.goalId}` : "No linked goal"}
            </CardDescription>
          </div>
          <div className="flex shrink-0 gap-1">
            {decision.urgent && <Badge className="bg-red-500/15 text-red-700 dark:text-red-300">urgent</Badge>}
            <Badge variant="outline">{decision.type}</Badge>
            <Badge variant="secondary">{decision.status}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2 text-muted-foreground">
          {decision.recommendation && <div><span className="font-medium text-foreground">Recommendation:</span> {decision.recommendation}</div>}
          {decision.why && <div><span className="font-medium text-foreground">Why:</span> {decision.why}</div>}
          {decision.risk && <div><span className="font-medium text-foreground">Risk:</span> {decision.risk}</div>}
          <div><span className="font-medium text-foreground">Default:</span> {decision.defaultAction || "None"} · expires {formatTime(decision.expiresAt)}</div>
          <div>
            <span className="font-medium text-foreground">Ask threshold:</span>{" "}
            {decision.irreversible ? "irreversible" : decision.pathChanging ? "path-changing" : `${decision.revertEffortHours}h revert effort`}
          </div>
          {decision.body && <Textarea readOnly value={decision.body} rows={3} />}
        </div>

        {isPending ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {decision.recommendation && (
                <Button onClick={() => onAnswer(decision, decision.recommendation ?? "")}>Accept recommendation</Button>
              )}
              <Button variant="outline" onClick={() => onAnswer(decision, "yes")}>Yes</Button>
              <Button variant="outline" onClick={() => onAnswer(decision, "no")}>No</Button>
              <Button variant="outline" onClick={() => onDefer(decision)}>Defer</Button>
              <Button variant="ghost" onClick={() => onCancel(decision)}>Cancel</Button>
            </div>
            <div className="flex gap-2">
              <Input
                value={customAnswer}
                onChange={(event) => setCustomAnswer(event.target.value)}
                placeholder="Custom answer"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  if (!customAnswer.trim()) return
                  onAnswer(decision, customAnswer.trim())
                  setCustomAnswer("")
                }}
              >
                Submit
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-md bg-muted/50 p-3 text-muted-foreground">
            Answer: <span className="font-medium text-foreground">{decision.answer || "None"}</span> · {formatTime(decision.answeredAt)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function DecisionsPage() {
  const [tab, setTab] = useState<Tab>("pending")
  const queryClient = useQueryClient()

  const decisionsQuery = useQuery<Decision[]>({
    queryKey: ["decisions", tab],
    queryFn: () => tipcClient.getDecisions({ status: tab }) as Promise<Decision[]>,
  })

  const goalsQuery = useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: () => tipcClient.getGoals() as Promise<Goal[]>,
  })

  const goalsById = useMemo(
    () => new Map((goalsQuery.data ?? []).map((goal) => [goal.id, goal] as const)),
    [goalsQuery.data],
  )

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["decisions"] })
    queryClient.invalidateQueries({ queryKey: ["goals"] })
  }

  const answerDecision = async (decision: Decision, answer: string) => {
    try {
      await tipcClient.respondToDecision({ id: decision.id, response: { answer, answerSource: "aj" } })
      invalidate()
      toast.success("Decision answered")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to answer decision")
    }
  }

  const setDecisionAside = async (decision: Decision, action: "defer" | "cancel") => {
    try {
      if (action === "defer") await tipcClient.deferDecision({ id: decision.id })
      else await tipcClient.cancelDecision({ id: decision.id })
      invalidate()
      toast.success(action === "defer" ? "Decision deferred" : "Decision canceled")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update decision")
    }
  }

  const decisions = decisionsQuery.data ?? []

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Decision Queue</div>
        <h1 className="text-3xl font-semibold tracking-tight">Decisions</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Agents should only ask here for irreversible, path-changing, or expensive-to-revert calls.
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === "pending" ? "default" : "outline"} onClick={() => setTab("pending")}>Pending</Button>
        <Button variant={tab === "history" ? "default" : "outline"} onClick={() => setTab("history")}>History</Button>
      </div>

      {decisions.length === 0 ? (
        <Card><CardContent className="py-8 text-sm text-muted-foreground">No {tab} decisions.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {decisions.map((decision) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              goal={decision.goalId ? goalsById.get(decision.goalId) : undefined}
              onAnswer={(item, answer) => void answerDecision(item, answer)}
              onDefer={(item) => void setDecisionAside(item, "defer")}
              onCancel={(item) => void setDecisionAside(item, "cancel")}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const Component = DecisionsPage
