#!/usr/bin/env node

import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const fromRoot = (relativePath) => path.join(root, relativePath)
const readText = (relativePath) => readFileSync(fromRoot(relativePath), "utf8")

const failures = []

function fail(message) {
  failures.push(message)
}

function trackedFiles(prefix) {
  const output = execFileSync("git", ["ls-files", prefix], {
    cwd: root,
    encoding: "utf8",
  })
  return output.split("\n").filter(Boolean)
}

function assertFile(relativePath, label = relativePath) {
  if (!existsSync(fromRoot(relativePath))) {
    fail(`${label} is missing (${relativePath})`)
  }
}

function assertTracked(prefix, label = prefix) {
  if (trackedFiles(prefix).length === 0) {
    fail(`${label} has no tracked files (${prefix})`)
  }
}

const coverageDocPath = "docs-site/docs/development/docs-coverage.md"
assertFile(coverageDocPath)
const coverageDoc = existsSync(fromRoot(coverageDocPath)) ? readText(coverageDocPath) : ""

const sourceAreas = [
  {
    label: "desktop app",
    source: "apps/desktop",
    docs: [
      "docs-site/docs/desktop/overview.md",
      "docs-site/docs/development/architecture.md",
      "docs-site/docs/reference/api.md",
    ],
  },
  {
    label: "desktop main process",
    source: "apps/desktop/src/main",
    docs: [
      "docs-site/docs/development/architecture.md",
      "docs-site/docs/desktop/remote-server.md",
      "docs-site/docs/reference/api.md",
    ],
  },
  {
    label: "desktop renderer",
    source: "apps/desktop/src/renderer/src",
    docs: [
      "docs-site/docs/desktop/overview.md",
      "docs-site/docs/development/architecture.md",
    ],
  },
  {
    label: "desktop shared/preload boundary",
    source: "apps/desktop/src/shared",
    docs: [
      "docs-site/docs/development/architecture.md",
      "docs-site/docs/development/docs-coverage.md",
    ],
  },
  {
    label: "desktop Rust binary",
    source: "apps/desktop/dotagents-rs",
    docs: [
      "docs-site/docs/development/architecture.md",
      "docs-site/docs/development/setup.md",
    ],
  },
  {
    label: "mobile app",
    source: "apps/mobile",
    docs: [
      "docs-site/docs/mobile/overview.md",
      "docs-site/docs/getting-started/installation.md",
    ],
  },
  {
    label: "core package",
    source: "packages/core",
    docs: [
      "docs-site/docs/development/architecture.md",
      "docs-site/docs/concepts/dot-agents-protocol.md",
    ],
  },
  {
    label: "shared package",
    source: "packages/shared",
    docs: [
      "docs-site/docs/development/architecture.md",
      "docs-site/docs/reference/api.md",
    ],
  },
  {
    label: "whatsapp MCP package",
    source: "packages/mcp-whatsapp",
    docs: [
      "docs-site/docs/tools/whatsapp.md",
      "packages/mcp-whatsapp/README.md",
    ],
  },
  {
    label: "documentation site",
    source: "docs-site",
    docs: [
      "docs-site/docs/development/setup.md",
      "docs-site/docs/development/docs-coverage.md",
    ],
  },
  {
    label: "marketing website",
    source: "website",
    docs: [
      "README.md",
      "website/README.md",
      "docs-site/docs/development/docs-coverage.md",
    ],
  },
  {
    label: "promo studio renders",
    source: "apps/promo-studio",
    docs: [
      "docs-site/docs/development/docs-coverage.md",
    ],
  },
  {
    label: "repository scripts",
    source: "scripts",
    docs: [
      "docs-site/docs/development/setup.md",
      "docs-site/docs/development/docs-coverage.md",
    ],
  },
  {
    label: "integration tests",
    source: "tests",
    docs: [
      "docs-site/docs/development/setup.md",
      "docs-site/docs/development/docs-coverage.md",
    ],
  },
]

for (const area of sourceAreas) {
  assertTracked(area.source, area.label)
  if (!coverageDoc.includes(area.source)) {
    fail(`coverage doc does not mention source area ${area.source}`)
  }
  for (const docPath of area.docs) {
    assertFile(docPath, `${area.label} doc`)
  }
}

function assertListedFiles({ dir, pattern, docText, label }) {
  const files = readdirSync(fromRoot(dir))
    .filter((file) => pattern.test(file))
    .filter((file) => !file.includes(".test."))
    .sort()

  for (const file of files) {
    if (!docText.includes(file)) {
      fail(`${label} ${file} is not listed in ${coverageDocPath}`)
    }
  }
}

assertListedFiles({
  dir: "apps/desktop/src/renderer/src/pages",
  pattern: /\.tsx$/,
  docText: coverageDoc,
  label: "desktop renderer page",
})

assertListedFiles({
  dir: "apps/mobile/src/screens",
  pattern: /Screen\.tsx$/,
  docText: coverageDoc,
  label: "mobile screen",
})

const apiDocPath = "docs-site/docs/reference/api.md"
const apiDoc = existsSync(fromRoot(apiDocPath)) ? readText(apiDocPath) : ""
const remoteServerSource = readText("apps/desktop/src/main/remote-server.ts")
const routePattern = /fastify\.(get|post|patch|put|delete)\(\s*["`]([^"`]+)["`]/g
const routes = new Set()
let match

while ((match = routePattern.exec(remoteServerSource))) {
  routes.add(`${match[1].toUpperCase()} ${match[2]}`)
}

for (const route of [...routes].sort()) {
  if (!apiDoc.includes(route)) {
    fail(`${apiDocPath} does not document route ${route}`)
  }
}

if (failures.length > 0) {
  console.error("Docs coverage check failed:")
  for (const message of failures) {
    console.error(`- ${message}`)
  }
  process.exit(1)
}

console.log(`Docs coverage check passed (${sourceAreas.length} source areas, ${routes.size} remote routes).`)
