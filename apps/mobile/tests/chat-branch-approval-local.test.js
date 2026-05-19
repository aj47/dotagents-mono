const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const chatSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8',
);
const openaiClientSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'openaiClient.ts'),
  'utf8',
);
const settingsClientSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'settingsApi.ts'),
  'utf8',
);
const remoteServerSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'apps', 'desktop', 'src', 'main', 'remote-server.ts'),
  'utf8',
);

test('mobile chat restores tool approval response UI locally', () => {
  assert.match(openaiClientSource, /toolApproval\?: NonNullable<AgentProgressUpdate\['pendingToolApproval'\]>/);
  assert.match(openaiClientSource, /variant\?: 'delegation' \| 'approval'/);
  assert.match(chatSource, /pendingToolApprovalResponseId/);
  assert.match(chatSource, /settingsClient\.respondToToolApproval\(approvalId, approved\)/);
  assert.match(chatSource, /Tool Approval Required/);
  assert.match(chatSource, /Deny tool call/);
  assert.match(chatSource, /Approve tool call/);
  assert.match(settingsClientSource, /async respondToToolApproval\(approvalId: string, approved: boolean\)/);
  assert.match(remoteServerSource, /"\/v1\/agent-sessions\/tool-approvals\/:approvalId\/respond"/);
  assert.match(remoteServerSource, /toolApprovalManager\.respondToApproval\(approvalId, body\.approved\)/);
});

test('mobile chat restores conversation branching without shared route registration', () => {
  assert.match(chatSource, /const handleBranchFromMessage = useCallback/);
  assert.match(chatSource, /settingsClient\.branchConversation\(serverConversationId, \{ messageIndex \}\)/);
  assert.match(chatSource, /findSessionByServerConversationId\(branchedConversation\.id\)/);
  assert.match(chatSource, /Branch conversation from \$\{m\.role\} message/);
  assert.match(settingsClientSource, /async branchConversation\(id: string, data: BranchConversationRequest\)/);
  assert.match(remoteServerSource, /"\/v1\/conversations\/:id\/branch"/);
  assert.match(remoteServerSource, /conversationService\.branchConversation\(conversationId, body\.messageIndex\)/);
  assert.doesNotMatch(remoteServerSource, /registerDesktopRemoteServerRoutes/);
});
