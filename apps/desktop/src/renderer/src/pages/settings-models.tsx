import { Button } from "@renderer/components/ui/button"
import { useConfigQuery } from "@renderer/lib/query-client"
import { Bot, Brain, FileText, Mic, Volume2 } from "lucide-react"

const MODEL_JUMP_TARGETS = [
  { id: "provider-selection", label: "Provider roles" },
  { id: "openai-provider-section", label: "OpenAI presets" },
  { id: "groq-provider-section", label: "Groq models" },
  { id: "gemini-provider-section", label: "Gemini models" },
  { id: "dual-model-section", label: "Dual-model summary" },
] as const

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

function getChatProviderLabel(providerId?: string) {
  switch (providerId) {
    case "groq":
      return "Groq"
    case "gemini":
      return "Gemini"
    default:
      return "OpenAI-compatible"
  }
}

function getSttProviderLabel(providerId?: string) {
  switch (providerId) {
    case "groq":
      return "Groq"
    case "parakeet":
      return "Parakeet (local)"
    default:
      return "OpenAI"
  }
}

function getTtsProviderLabel(providerId?: string) {
  switch (providerId) {
    case "groq":
      return "Groq"
    case "gemini":
      return "Gemini"
    case "kitten":
      return "Kitten (local)"
    case "supertonic":
      return "Supertonic (local)"
    default:
      return "OpenAI"
  }
}

export function Component() {
  const config = useConfigQuery().data
  const agentProviderLabel = getChatProviderLabel(config?.mcpToolsProviderId)

  const currentModelRoles = [
    {
      icon: Mic,
      label: "Voice transcription",
      value: getSttProviderLabel(config?.sttProviderId),
    },
    {
      icon: FileText,
      label: "Transcript cleanup",
      value: getChatProviderLabel(config?.transcriptPostProcessingProviderId),
    },
    {
      icon: Bot,
      label: config?.mainAgentMode === "acp" ? "Agent/MCP tools (API mode)" : "Agent/MCP tools",
      value:
        config?.mainAgentMode === "acp"
          ? `${agentProviderLabel} when API mode is active`
          : agentProviderLabel,
    },
    {
      icon: Volume2,
      label: "Text-to-speech",
      value: getTtsProviderLabel(config?.ttsProviderId),
    },
  ]

  return (
    <section className="rounded-lg border bg-card/80" aria-labelledby="model-settings-guide-heading">
      <div className="space-y-4 px-4 py-4 sm:px-5">
        <div className="space-y-2">
          <h2 id="model-settings-guide-heading" className="text-base font-semibold">
            Model configuration guide
          </h2>
          <p className="text-sm text-muted-foreground">
            This screen keeps model controls inside each provider card. Use these shortcuts to jump directly to the right model, preset, or summarization section instead of hunting through the full settings page.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {currentModelRoles.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-md border bg-background/70 px-3 py-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
              <div className="mt-1 text-sm font-medium">{value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-md border border-dashed bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
          <ul className="space-y-1.5">
            <li>OpenAI-compatible presets bundle endpoint, API key, and default OpenAI-family models together.</li>
            <li>Groq and Gemini model selectors live inside their provider cards alongside credentials.</li>
            <li>Dual-model summarization lets you pick separate strong and weak models for planning vs. summaries.</li>
          </ul>
        </div>

        {config?.mainAgentMode === "acp" && (
          <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
            Your ACP main agent currently handles chat submissions, so the Agent/MCP tools model below applies when you switch back to API mode.
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {MODEL_JUMP_TARGETS.map((target) => (
            <Button
              key={target.id}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => scrollToSection(target.id)}
            >
              {target.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Brain className="h-3.5 w-3.5" />
          Settings changes below save immediately unless a field explicitly says it autosaves after a short pause.
        </div>
      </div>
    </section>
  )
}
