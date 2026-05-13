const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const screenSource = fs.readFileSync(
  path.join(__dirname, "..", "src", "screens", "SessionListScreen.tsx"),
  "utf8",
)

test("gives the empty session state an in-place primary action", () => {
  assert.match(
    screenSource,
    /getConversationListEmptyState\(\{[\s\S]*?hasActiveSearch: false,/,
  )
  assert.match(
    screenSource,
    /<Text style=\{styles\.emptyTitle\}>\{emptyState\.title\}<\/Text>/,
  )
  assert.match(
    screenSource,
    /<Text style=\{styles\.emptyStateButtonText\}>[\s\S]*?\{emptyState\.actionLabel\}[\s\S]*?<\/Text>/,
  )
  assert.match(
    screenSource,
    /onPress=\{[\s\S]*?isArchivedMode[\s\S]*?\?[\s\S]*?\(\) => setSessionListMode\("active"\)[\s\S]*?: handleCreateSession[\s\S]*?\}/,
  )
  assert.match(
    screenSource,
    /createButtonAccessibilityLabel\([\s\S]*?emptyState\.actionLabel,[\s\S]*?\)/,
  )
  assert.match(screenSource, /accessibilityHint=\{emptyState\.actionHint\}/)
})

test("keeps the empty-state primary action wide and centered for narrow mobile layouts", () => {
  assert.match(
    screenSource,
    /const emptyStateSurface = conversationListSurface\.emptyState/,
  )
  assert.match(
    screenSource,
    /emptyState:\s*\{[\s\S]*?alignItems:\s*emptyStateSurface\.container\.alignItems,[\s\S]*?width:\s*emptyStateSurface\.container\.width,[\s\S]*?maxWidth:\s*emptyStateSurface\.container\.maxWidth,[\s\S]*?padding:\s*spacing\[emptyStateSurface\.container\.padding\],/,
  )
  assert.match(
    screenSource,
    /emptyStateButton:\s*\{[\s\S]*?width:\s*emptyStateSurface\.button\.width,[\s\S]*?maxWidth:\s*emptyStateSurface\.button\.maxWidth,/,
  )
  assert.match(
    screenSource,
    /emptyStateButtonText:\s*\{[\s\S]*?color:\s*conversationListColors\.emptyState\.buttonTextColor,[\s\S]*?fontWeight:\s*emptyStateSurface\.buttonText\.fontWeight,[\s\S]*?textAlign:\s*emptyStateSurface\.buttonText\.textAlign,/,
  )
  assert.doesNotMatch(
    screenSource,
    /theme\.colors\[emptyStateSurface\.buttonText\.colorToken\]/,
  )
})

test("shows connection guidance instead of the chat list when the mobile app is disconnected", () => {
  assert.match(
    screenSource,
    /const isConnected = connectionInfo\.state === "connected"/,
  )
  assert.match(screenSource, /if \(!isConnected\) \{/)
  assert.match(
    screenSource,
    /<Text style=\{styles\.disconnectedTitle\}>\{disconnectedTitle\}<\/Text>/,
  )
  assert.match(
    screenSource,
    /<Text style=\{styles\.emptyStateButtonText\}>Scan QR Code<\/Text>/,
  )
  assert.match(
    screenSource,
    /<Text style=\{styles\.disconnectedSecondaryButtonText\}>[\s\S]*?Connection Settings[\s\S]*?<\/Text>/,
  )
})
