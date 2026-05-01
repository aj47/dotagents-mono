#!/usr/bin/env python3
"""Run one DotAgents AutoResearch case through the current app code.

This is intentionally a current-worktree runner: apply a candidate patch first, then
run this command to see how that code state behaves on a specific case.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TEST_FILE = "src/main/autoresearch-e2e.live.test.ts"


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def load_case(cases_path: Path, case_id: str) -> dict:
    pack = json.loads(cases_path.read_text(encoding="utf-8"))
    for case in pack.get("cases", []):
        if case.get("id") == case_id:
            return case
    raise SystemExit(f"case id not found: {case_id}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cases", type=Path, default=ROOT / "autoresearch/fixtures/topic-extraction-skill/cases.json")
    ap.add_argument("--case-id", default="case-a-approval-boundary")
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--mode", choices=["live", "mock"], default="live")
    ap.add_argument("--mock-response", default="Mock autoresearch response")
    ap.add_argument("--provider", default=os.environ.get("AUTORESEARCH_LIVE_LLM_PROVIDER_ID") or os.environ.get("LIVE_LLM_PROVIDER_ID") or "openai")
    ap.add_argument("--model", default=os.environ.get("AUTORESEARCH_LIVE_LLM_MODEL") or os.environ.get("LIVE_LLM_MODEL") or "gpt-4.1-mini")
    args = ap.parse_args()

    cases_path = args.cases.resolve()
    case = load_case(cases_path, args.case_id)
    out = args.out.resolve()
    out.mkdir(parents=True, exist_ok=True)

    env = os.environ.copy()
    env.update({
        "AUTORESEARCH_E2E": "1",
        "AUTORESEARCH_E2E_MODE": args.mode,
        "AUTORESEARCH_REPO_ROOT": str(ROOT),
        "AUTORESEARCH_CASES_PATH": str(cases_path),
        "AUTORESEARCH_CASE_ID": args.case_id,
        "AUTORESEARCH_OUT": str(out),
        "AUTORESEARCH_MOCK_RESPONSE": args.mock_response,
        "AUTORESEARCH_LIVE_LLM_PROVIDER_ID": args.provider,
        "AUTORESEARCH_LIVE_LLM_MODEL": args.model,
    })

    manifest = {
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "mode": args.mode,
        "provider": args.provider,
        "model": args.model,
        "case_id": args.case_id,
        "case": {k: v for k, v in case.items() if k != "expected"},
        "repo_root": str(ROOT),
        "command": ["pnpm", "--filter", "@dotagents/desktop", "exec", "vitest", "run", TEST_FILE],
    }
    write(out / "manifest.json", json.dumps(manifest, indent=2) + "\n")

    proc = subprocess.run(manifest["command"], cwd=ROOT, env=env, text=True, capture_output=True)
    write(out / "runner.stdout.log", proc.stdout)
    write(out / "runner.stderr.log", proc.stderr)
    write(out / "runner.json", json.dumps({"returncode": proc.returncode}, indent=2) + "\n")
    print(proc.stdout, end="")
    print(proc.stderr, end="")
    print(f"Wrote e2e receipt to {out}")
    return proc.returncode


if __name__ == "__main__":
    raise SystemExit(main())