# Content and project asset guardrails

Some assets are source code and should live in this repository. Other assets are creative project files that need an explicit owner, backup plan, and restore path before cleanup work starts.

## Canonical locations

- App source code: keep implementation files under `apps/desktop`, `apps/mobile`, `packages`, and `website`.
- Repo documentation and lightweight text assets: keep durable docs under `docs/` and link them from the README when useful.
- Experimental mockups and throwaway exports: keep them outside app source trees unless a PR intentionally adds them.
- Longform scripts, voiceover takes, animation plans, raw media, and demo project files: keep them in a dedicated media/content project location or in an approved tracked repo/directory. Do not leave important work only as untracked files under `apps/desktop`.

## Before cleanup or large removals

Run these checks from the repo root:

```bash
git status --short --untracked-files=all
pnpm check:untracked-assets
```

For every important untracked file, choose one path before deleting or moving code:

1. Commit it in the appropriate repo location.
2. Move it to the canonical external project folder and verify it is backed up.
3. Zip/export it to a named archive and record where the archive lives.
4. If it is intentionally disposable, document that in the cleanup PR or issue.

## Recovery playbook

If content appears missing and git cannot restore it, check these locations before recreating the work:

- OS Trash/Recycle Bin.
- Adjacent demo/media project folders.
- Local zip exports and cloud drive backups.
- Previous working trees, build artifacts, or release-upload scratch folders.

If a file was never tracked and no backup exists, git history cannot recover it. Treat the asset as lost and add the missing backup/ownership step before continuing similar cleanup work.