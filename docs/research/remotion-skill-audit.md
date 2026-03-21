# Remotion skill audit

Date: 2025-03-20
Scope: Audit the current `remotion-best-practices` skill, inspect the local repo for existing Remotion/video-editing capabilities, and identify what we already have, what we can reuse, what we should add, and what needs to be built from scratch.

## Executive summary

We do have a real Remotion skill today. It is not empty or stale boilerplate.

The current skill already covers a lot of core Remotion surface area: compositions, sequencing, transitions, timing, assets, media, captions, SRT import, Whisper.cpp transcription, calculateMetadata, voiceover, audio visualization, maps, charts, transparent videos, and more.

What is missing is not broad Remotion coverage. What is missing is a more production-oriented workflow layer for the exact jobs we care about now:

- caption pipeline recipes for social clips
- silence detection and silence trimming workflows
- end-to-end “audio/video in -> cleaned assets -> captions JSON -> Remotion composition” examples
- stronger guidance for local TTS + Remotion integration using our existing Supertonic setup
- a concrete starter template / example project / scripts
- a repo-local place where these workflows actually live as reusable code rather than only skill docs

The mono-repo currently has essentially **no actual Remotion project/package** checked in. The skill exists, but the implementation surface in the repo does not. So the biggest gap is: **knowledge exists, but productized code/examples do not**.

---

## 1. Current skill status

Current skill path:

- `~/.agents/skills/remotion-best-practices/SKILL.md`

The skill is present and substantial. Total documentation size is about **4,129 lines** across the skill and rule files.

### Current rule files already present

- `rules/3d.md`
- `rules/animations.md`
- `rules/assets.md`
- `rules/audio-visualization.md`
- `rules/audio.md`
- `rules/calculate-metadata.md`
- `rules/can-decode.md`
- `rules/charts.md`
- `rules/compositions.md`
- `rules/display-captions.md`
- `rules/extract-frames.md`
- `rules/ffmpeg.md`
- `rules/fonts.md`
- `rules/get-audio-duration.md`
- `rules/get-video-dimensions.md`
- `rules/get-video-duration.md`
- `rules/gifs.md`
- `rules/images.md`
- `rules/import-srt-captions.md`
- `rules/light-leaks.md`
- `rules/lottie.md`
- `rules/maps.md`
- `rules/measuring-dom-nodes.md`
- `rules/measuring-text.md`
- `rules/parameters.md`
- `rules/sequencing.md`
- `rules/subtitles.md`
- `rules/tailwind.md`
- `rules/text-animations.md`
- `rules/timing.md`
- `rules/transcribe-captions.md`
- `rules/transitions.md`
- `rules/transparent-videos.md`
- `rules/trimming.md`
- `rules/videos.md`
- `rules/voiceover.md`

### Best-covered areas already in the skill

The current skill already documents:

- general Remotion architecture and composition setup
- animation primitives and timing
- transitions using `@remotion/transitions`
- media usage via `@remotion/media`
- captions with `@remotion/captions`
- SRT import via `parseSrt()`
- TikTok-style caption paging via `createTikTokStyleCaptions()`
- transcription with `@remotion/install-whisper-cpp`
- dynamic duration/props via `calculateMetadata`
- FFmpeg/FFprobe entry points via `bunx remotion ffmpeg` and `bunx remotion ffprobe`
- voiceover generation patterns
- waveform/audio visualization
- transparent video considerations

### Evidence from the current skill

Confirmed examples and concepts currently documented:

- captions use JSON `Caption[]` shape from `@remotion/captions`
- `.srt` import via `parseSrt()`
- transcription via `transcribe()` + `toCaptions()` from `@remotion/install-whisper-cpp`
- non-destructive video/audio trimming using `trimBefore` and `trimAfter`
- dynamic composition sizing using `calculateMetadata`
- transitions using `@remotion/transitions`
- media usage through `@remotion/media`

---

## 2. What the current skill is missing

Even though coverage is broad, there are important gaps for our actual use case.

### Missing or too-thin workflow areas

#### A. Silence detection and silence trimming

This is the most obvious gap.

The skill intro says FFmpeg should be used for detecting silence, but the actual `rules/ffmpeg.md` is very thin and currently only covers:

- basic FFmpeg usage
- destructive trimming via re-encode
- non-destructive trimming in Remotion via `trimBefore` / `trimAfter`

What is missing:

- `silencedetect` usage
- `silenceremove` usage
- recommended thresholds for voiceover cleanup
- how to convert silence intervals into cut lists
- how to decide when to preprocess media with FFmpeg vs when to keep edits non-destructive in Remotion
- handling room tone / breath / pause preservation for social clips
- recipes for trimming speech clips while keeping captions in sync

#### B. Caption pipeline recipes

The skill has caption building blocks, but not enough “full pipeline” guidance.

Missing:

- speech-to-caption workflow from raw video/audio to final animated captions
- post-processing rules for punctuation, casing, filler removal, line breaking, page sizing, and emphasis
- social-video caption styling presets
- handling edited media where timing changes after silence trimming or clip extraction
- guidance on re-timing captions after preprocessing

#### C. Local TTS integration with our stack

The skill has a voiceover rule, but it is currently centered on ElevenLabs.

That is weaker than what we already have in this repo ecosystem, because we also have a local Supertonic skill and app-side Supertonic support.

Missing:

- “preferred local path” guidance using Supertonic-generated WAV/MP3 into Remotion
- segment-per-scene generation workflow
- audio normalization / loudness cleanup / silence cleanup before composition
- `calculateMetadata` patterns driven by generated local TTS assets

#### D. Concrete end-to-end examples

Missing:

- a minimal starter Remotion project in the mono-repo
- a social clip template with captions, b-roll/video layer, and voiceover
- a preprocessing script set (`transcribe`, `trim silence`, `extract metadata`, `prepare captions`)
- tested example assets and scripts

#### E. Rendering and codec decision guidance

Some docs exist, but not a practical “when to choose what” guide.

Missing:

- recommended defaults for fast iteration vs final export
- H.264 / transparency / WebM / ProRes tradeoff summary
- `OffthreadVideo` vs preview-time video choices for production workflows
- render performance advice for caption-heavy videos

---

## 3. What already exists in the mono-repo

## A. The skill itself exists only as knowledge docs

Relevant path:

- `~/.agents/skills/remotion-best-practices/`

This is the strongest existing asset right now.

## B. There does not appear to be an actual Remotion app/package in the repo

Searches across the mono-repo did **not** find a checked-in package/app with Remotion dependencies in `package.json`.

That means:

- no existing Remotion project scaffold was found
- no existing Remotion compositions were found
- no repo-local example code using `@remotion/*` packages was found
- no actual caption rendering components were found in the app codebase

So the repo is missing the implementation layer.

## C. Existing audio / speech infrastructure we can reuse

The repo does have adjacent systems we can use as building blocks.

### STT/transcription infrastructure

Found in the repo:

- `packages/shared/src/stt-models.ts`
- `packages/core/src/config.ts`
- `apps/desktop/src/main/parakeet-stt.ts`
- `apps/desktop/src/main/tipc.ts`

This tells us the repo already understands speech-to-text models and transcription workflows generally, even though this is not wired into a Remotion pipeline yet.

### Supertonic / TTS infrastructure

Found in the repo and skills:

- `~/.agents/skills/supertonic-voiceover/SKILL.md`
- app config references in `packages/core/src/config.ts`
- desktop settings/UI references under `apps/desktop/src/renderer/src/pages/settings-providers.tsx`
- desktop runtime references around Supertonic/TTS in app code

This is important because it means we already have a viable local TTS route for generating narration assets that could feed a Remotion pipeline.

### FFmpeg availability

Evidence found:

- Electron bundles `libffmpeg.dylib` in desktop build artifacts
- Remotion skill docs already rely on `bunx remotion ffmpeg` / `ffprobe`

We should still treat “usable CLI preprocessing workflow” as something we need to formalize, but the environment is not barren.

---

## 4. Best-practice findings from current docs and authoritative references

Based on the current skill contents plus authoritative Remotion docs that were successfully retrieved:

### Captions

Authoritative confirmed features:

- `@remotion/captions`
- `parseSrt()`
- `createTikTokStyleCaptions()`
- JSON `Caption[]` workflow
- Whisper.cpp transcription support through `@remotion/install-whisper-cpp`

Practical implication:

- The right canonical internal format should remain `Caption[]`
- `.srt` should be treated as import/export compatibility, not the primary working format
- social-style captions should be generated as paged/grouped caption tokens rather than rendered as raw subtitle lines

### Trimming and media

Authoritative confirmed patterns:

- use `trimBefore` / `trimAfter` for non-destructive timeline edits
- use FFmpeg re-encoding for destructive source edits when exact file preprocessing is needed
- `OffthreadVideo` is the render-accurate choice when exact extracted frames matter

Practical implication:

- preprocess only when necessary
- keep editorial trims inside Remotion where possible
- use preprocessing for silence removal, normalization, clip cleanup, resampling, or format fixes

### Dynamic metadata

Confirmed best practice:

- `calculateMetadata` should be used for duration, dimensions, default codec/name, and async prop transformation

Practical implication:

- any serious template we build should derive duration from audio/video/caption data automatically
- social templates should not require manual duration entry

### Voiceover

The current Remotion voiceover rule is useful structurally but too tied to ElevenLabs.

Practical implication:

- we should generalize the pattern so the skill supports provider-agnostic narration generation
- then add a first-class local path for Supertonic

---

## 5. What we can find and reuse right now

## Reusable documentation assets

From the current skill:

- caption primitives: `subtitles.md`, `display-captions.md`, `import-srt-captions.md`, `transcribe-captions.md`
- media primitives: `audio.md`, `videos.md`, `trimming.md`, `ffmpeg.md`
- metadata primitives: `calculate-metadata.md`, `get-video-duration.md`, `get-video-dimensions.md`, `get-audio-duration.md`
- presentation: `transitions.md`, `timing.md`, `text-animations.md`, `fonts.md`, `images.md`, `light-leaks.md`

## Reusable platform assets in the repo

- STT model/config infrastructure
- Supertonic skill and app config
- desktop app audio/TTS/transcription plumbing

## External authoritative sources we should keep grounding on

Primary canonical source:

- Remotion docs: `https://www.remotion.dev/docs/api`
- Captions: `https://www.remotion.dev/docs/captions`
- TikTok-style captions: `https://remotion.dev/docs/captions/create-tiktok-style-captions`
- Whisper transcription: `https://www.remotion.dev/docs/install-whisper-cpp/transcribe`
- Offthread video: `https://www.remotion.dev/docs/offthreadvideo`
- FFmpeg reference: `https://ffmpeg.org/ffmpeg-all.html`

---

## 6. What needs to be created from scratch

This is the most important section.

## A. A repo-local Remotion project/template

We need an actual implementation package, for example:

- `packages/remotion-template/`
- or `apps/remotion-studio/`

This should include:

- `src/Root.tsx`
- `src/index.ts`
- at least 2-3 real compositions
- local `public/` assets
- scripts for rendering and preprocessing

Recommended starter compositions:

1. `CaptionedTalkingHead`
2. `VoiceoverBrollExplainer`
3. `SocialClipTemplate`

## B. Preprocessing scripts

We should create a scripts folder for media preparation, for example:

- `scripts/remotion/transcribe.ts`
- `scripts/remotion/import-srt.ts`
- `scripts/remotion/detect-silence.ts`
- `scripts/remotion/remove-silence.ts`
- `scripts/remotion/media-metadata.ts`
- `scripts/remotion/normalize-audio.ts`

These scripts should output stable JSON artifacts that compositions can consume.

## C. Silence workflow docs and code

We need a brand-new skill rule and matching example scripts for:

- silence detection with FFmpeg
- silence trimming/removal
- cut list generation
- caption re-timing guidance
- voice clip cleanup defaults

Recommended new rule file:

- `~/.agents/skills/remotion-best-practices/rules/silence-trimming.md`

That rule should cover at minimum:

- `silencedetect`
- `silenceremove`
- when to trim destructively vs non-destructively
- how to preserve natural cadence
- how to re-sync captions after destructive edits

## D. A stronger captions workflow rule

Recommended new rule files:

- `rules/caption-pipeline.md`
- `rules/social-captions.md`

These should cover:

- raw transcription -> `Caption[]`
- cleanup/postprocess
- paging/grouping
- highlighted active word rendering
- style presets for short-form content
- caption-safe areas and responsive text sizing

## E. Provider-agnostic voiceover pipeline + Supertonic-specific rule

We should split current voiceover guidance into:

- generic voiceover pipeline rule
- Supertonic-specific local voiceover rule

Recommended new rule:

- `rules/supertonic-voiceover.md`

This should cover:

- generating per-scene WAV/MP3 files locally
- optional silence trimming after generation
- loudness normalization
- feeding durations into `calculateMetadata`
- naming conventions for assets

## F. Example asset manifest system

We should create a simple JSON schema for template inputs, for example:

- `script`
- `scenes`
- `audio`
- `captions`
- `broll`
- `brand`
- `render`

This would make the Remotion workflows much easier to automate.

---

## 7. Recommended audit of “what to use when”

## Use existing skill docs as-is for

- composition setup
- timing/animation fundamentals
- `calculateMetadata`
- transitions basics
- media embedding
- SRT import
- TikTok-style caption paging
- Whisper.cpp transcription concepts

## Extend existing docs for

- captions styling recipes
- production caption pipelines
- video/audio preprocessing decisions
- local voiceover integration

## Build from scratch for

- actual Remotion project/package in the repo
- silence-detection and silence-removal scripts
- end-to-end sample compositions
- reusable asset manifests and preprocessing pipeline

---

## 8. Priority plan

## Priority 1: Make the skill truly production-ready

Add these new rule files:

- `rules/silence-trimming.md`
- `rules/caption-pipeline.md`
- `rules/social-captions.md`
- `rules/supertonic-voiceover.md`
- `rules/rendering-codecs.md`

Also strengthen:

- `rules/ffmpeg.md`
- `rules/voiceover.md`
- `rules/display-captions.md`

## Priority 2: Create the first real Remotion package in the repo

Add either:

- `apps/remotion-studio/`

or:

- `packages/remotion-template/`

with:

- starter compositions
- preprocessing scripts
- sample assets
- documented npm scripts

## Priority 3: Build the “social explainer” golden path

Target flow:

1. Generate or ingest narration
2. Trim silence / normalize audio
3. Transcribe to `Caption[]`
4. Optional caption cleanup and grouping
5. Auto-size composition via `calculateMetadata`
6. Render final social clip

This should become the default mental model for the skill.

---

## 9. Concrete file recommendations

## New skill docs to add

- `~/.agents/skills/remotion-best-practices/rules/silence-trimming.md`
- `~/.agents/skills/remotion-best-practices/rules/caption-pipeline.md`
- `~/.agents/skills/remotion-best-practices/rules/social-captions.md`
- `~/.agents/skills/remotion-best-practices/rules/supertonic-voiceover.md`
- `~/.agents/skills/remotion-best-practices/rules/rendering-codecs.md`

## New repo code to add

Suggested:

- `apps/remotion-studio/package.json`
- `apps/remotion-studio/src/Root.tsx`
- `apps/remotion-studio/src/index.ts`
- `apps/remotion-studio/src/compositions/CaptionedTalkingHead.tsx`
- `apps/remotion-studio/src/compositions/VoiceoverBrollExplainer.tsx`
- `apps/remotion-studio/src/components/Captions.tsx`
- `apps/remotion-studio/src/lib/captions.ts`
- `apps/remotion-studio/src/lib/metadata.ts`
- `apps/remotion-studio/public/example-captions.json`
- `apps/remotion-studio/public/example-audio.wav`
- `scripts/remotion/transcribe.ts`
- `scripts/remotion/detect-silence.ts`
- `scripts/remotion/remove-silence.ts`
- `scripts/remotion/normalize-audio.ts`
- `scripts/remotion/prepare-social-video.ts`

---

## 10. Bottom line

Do we have the current Remotion skill? Yes.

Is it already pretty good? Yes.

Is it good enough for the exact workflow we want now—captions, silence trimming, trimmed video/audio preprocessing, local voiceover integration, and sample-driven implementation? Not yet.

The main gap is not conceptual coverage. The main gap is that we need:

- stronger workflow docs for captions + silence removal
- local TTS integration guidance
- a real repo-local Remotion package
- reusable scripts and examples

Without that, we have knowledge but not a usable production lane.

