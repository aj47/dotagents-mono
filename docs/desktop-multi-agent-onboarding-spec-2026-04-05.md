## Desktop multi-agent onboarding spec

### Goal

Replace the current Groq-only onboarding with a provider-agnostic flow that can onboard users into one of five main-agent paths:

1. OpenCode via ACP
2. Auggie via ACP
3. Claude Code via ACP
4. Codex via ACP
5. BYOK using DotAgents' built-in API mode

### Product requirements

- Fresh onboarding must expose all five options up front.
- BYOK must be fully completable inside onboarding.
- ACP options must provision or reuse an agent profile instead of forcing the user into Settings first.
- OpenCode should be presented as the recommended ACP option.
- Onboarding must verify external commands before finishing ACP setup.
- Voice/dictation should remain optional and skippable.
- The flow must preserve the existing shell density constraints for welcome vs non-welcome steps.

### Explicit scope for this implementation

This implementation ships the new onboarding architecture and verification UX now.

- **Implemented now**
  - Unified main-agent choice step
  - BYOK setup path for OpenAI / Groq / Gemini
  - ACP setup path for OpenCode / Auggie / Claude Code / Codex
  - External agent profile provisioning / reuse
  - External command verification from onboarding
  - OpenCode managed env/config injection from an in-app provider key
  - OpenCode on-demand install affordance for explicit user-requested setup
  - Updated onboarding copy, summaries, and finish step

- **Spec'd but not fully automated yet**
  - Background progress UI for OpenCode download/install
  - Richer multi-arch install target detection (baseline / musl variants)
  - Automatic install/auth for Claude Code, Codex, or Auggie

### Non-goals for this patch

- Bundling a new external binary dependency
- Changing package manifests or lockfiles
- Reworking the Settings > Providers page
- Reworking mobile onboarding in this patch

### Architecture

#### Shared preset metadata

Move curated external-agent presets into a shared desktop module so onboarding and Settings use the same source of truth.

The shared preset metadata owns:

- display name
- description
- command / args
- docs URL
- install command
- auth hint
- cwd hint
- verification args
- setup mode (`connect-existing` vs `managed`)

#### Pure onboarding helper module

Create a renderer helper module that owns:

- the five onboarding choices
- BYOK config updates
- ACP config updates
- ACP profile draft creation
- matching/reusing an existing external agent profile

This keeps the branching logic testable without mounting the full onboarding component.

### UX flow

#### Step 1 — Welcome

Keep the centered welcome hero and skip path.

#### Step 2 — Choose main agent

Show five cards:

- OpenCode (recommended)
- Auggie
- Claude Code
- Codex
- BYOK

Each card shows:

- description
- setup summary
- whether it is API mode or ACP mode

#### Step 3 — Setup

Branch by selected choice.

##### BYOK

- choose OpenAI / Groq / Gemini
- enter API key
- save config for internal API mode

##### ACP options

- show preset install/auth/cwd guidance
- run onboarding-time verification through `verifyExternalAgentCommand`
- provision or reuse an ACP agent profile
- save `mainAgentMode = "acp"` and `mainAgentName`

##### OpenCode-specific behavior

- allow explicit user-requested runtime install into an app-managed directory
- allow OpenCode to be configured from onboarding with an OpenAI / Groq / Gemini-compatible API key
- inject `OPENCODE_CONFIG_CONTENT` and provider env vars on the generated ACP profile
- prefer the managed app install path when resolving the `opencode` command

Verification is required before enabling the primary continue action for ACP paths.

#### Step 4 — Voice & shortcuts

- keep recording hotkey setup
- keep optional dictation demo
- update copy so failure is not framed as only a Groq problem
- allow users to continue even if dictation is skipped or unavailable

#### Step 5 — Finish

- configure agent hotkey
- summarize chosen main agent
- mark onboarding complete

### Data/config behavior

#### BYOK

Save:

- `mainAgentMode = "api"`
- provider API key
- `mcpToolsProviderId`
- transcript post-processing provider/model
- STT provider where compatible
- TTS provider, preferring local downloaded TTS when available

#### ACP

Save:

- `mainAgentMode = "acp"`
- `mainAgentName = <profile display name>`
- `acpInjectRuntimeTools` left enabled by default
- local STT/TTS defaults only when already downloaded

Provisioned profiles should:

- be enabled
- use ACP connection settings from the preset
- reuse an existing matching preset profile when present
- avoid destructive overwrites of custom existing profiles

### OpenCode install design

OpenCode should **not** be bundled by default.

Instead:

1. detect whether `opencode` is already available
2. if the user chose OpenCode and explicitly requests installation, download the official release asset into an app-managed folder
3. prefer that managed binary path during command resolution
4. continue to support already-installed global `opencode` binaries through normal PATH lookup

### Verification plan

#### Static / unit verification

Add or update tests for:

- shared external preset definitions
- preset detection from stored connection config
- onboarding option availability and order
- BYOK config update generation
- ACP config update generation
- ACP profile draft creation / preset reuse

#### Source-density / structural regression tests

Update node-based source assertions for:

- onboarding welcome shell density
- onboarding option presence
- settings agent ACP setup guidance source

#### Type / build validation

Run targeted desktop checks:

- `pnpm --filter @dotagents/desktop exec vitest run src/shared/external-agent-presets.test.ts src/renderer/src/lib/onboarding-main-agent.test.ts src/renderer/src/pages/settings-general-main-agent-options.test.ts`
- `cd apps/desktop && node --test tests/settings-agents-acp-setup.test.mjs tests/onboarding-step-shell-density.test.mjs tests/onboarding-welcome-density.test.mjs`
- `pnpm --filter @dotagents/desktop typecheck`

#### Manual behavior validation

Smoke-check the following scenarios after the code lands:

1. BYOK + Groq completes onboarding and lands in the app.
2. BYOK + Gemini completes without forcing an invalid STT provider.
3. OpenCode path blocks primary continue until verification succeeds.
4. Existing OpenCode preset profile is reused instead of duplicated.
5. Finishing onboarding marks `onboardingCompleted = true`.
6. Managed OpenCode env/config is accepted by the real CLI.
7. The official OpenCode release asset for the current platform downloads, extracts, and executes successfully.

### Rollback safety

- The refactor only changes onboarding and shared preset metadata.
- Settings > Agents continues using the same verification route.
- Existing saved configs and external profiles remain valid.
