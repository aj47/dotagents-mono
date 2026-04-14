#!/usr/bin/env node
import { execFileSync } from "node:child_process"

const suspiciousRoots = [/^apps\/desktop\//]
const suspiciousExtensions = new Set([
  ".aif", ".aiff", ".doc", ".docx", ".gif", ".jpeg", ".jpg", ".m4a",
  ".md", ".mov", ".mp3", ".mp4", ".ogg", ".pdf", ".png", ".psd",
  ".srt", ".svg", ".txt", ".vtt", ".wav", ".webp",
])

function getUntrackedFiles() {
  const output = execFileSync("git", ["status", "--porcelain=v1", "--untracked-files=all"], {
    encoding: "utf8",
  })

  return output
    .split("\n")
    .filter((line) => line.startsWith("?? "))
    .map((line) => line.slice(3).trim())
    .filter(Boolean)
}

function extensionFor(file) {
  const basename = file.split("/").pop() ?? file
  const index = basename.lastIndexOf(".")
  return index === -1 ? "" : basename.slice(index).toLowerCase()
}

const suspiciousFiles = getUntrackedFiles().filter((file) => {
  return suspiciousRoots.some((pattern) => pattern.test(file)) && suspiciousExtensions.has(extensionFor(file))
})

if (suspiciousFiles.length === 0) {
  console.log("No suspicious untracked project/content assets found.")
  process.exit(0)
}

console.error("Suspicious untracked project/content assets found:")
for (const file of suspiciousFiles) console.error(`  - ${file}`)
console.error("\nSee docs/content-assets.md before cleanup/removal work.")

if (process.env.ALLOW_UNTRACKED_ASSETS === "1") {
  console.error("ALLOW_UNTRACKED_ASSETS=1 set; warning only.")
  process.exit(0)
}

process.exit(1)