const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const elicitationSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'components', 'mcp-elicitation-dialog.tsx'),
  'utf8'
);

const samplingSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'components', 'mcp-sampling-dialog.tsx'),
  'utf8'
);

test('elicitation dialog keeps failed responses visible and explains expired requests inline', () => {
  assert.match(elicitationSource, /const \[responseErrorMessage, setResponseErrorMessage\] = useState<string \| null>\(null\)/);
  assert.match(elicitationSource, /const \[pendingAction, setPendingAction\] = useState<"accept" \| "decline" \| "cancel" \| null>\(null\)/);
  assert.match(elicitationSource, /const \[isRequestUnavailable, setIsRequestUnavailable\] = useState\(false\)/);
  assert.match(elicitationSource, /const resolved = await tipcClient\.resolveElicitation\(/);
  assert.match(elicitationSource, /if \(!resolved\) \{[\s\S]*?This request is no longer waiting for a response\./);
  assert.match(elicitationSource, /Couldn't submit your response yet\. Your draft is still open, so you can try again\./);
  assert.match(elicitationSource, /role="alert" aria-live="polite"/);
  assert.match(elicitationSource, /\{isRequestUnavailable \? \(/);
  assert.match(elicitationSource, /pendingAction === "accept" \? "Accepting\.\.\." : "Accept"/);
});

test('sampling dialog keeps approval failures local instead of silently closing', () => {
  assert.match(samplingSource, /const \[responseErrorMessage, setResponseErrorMessage\] = useState<string \| null>\(null\)/);
  assert.match(samplingSource, /const \[pendingDecision, setPendingDecision\] = useState<boolean \| null>\(null\)/);
  assert.match(samplingSource, /const \[isRequestUnavailable, setIsRequestUnavailable\] = useState\(false\)/);
  assert.match(samplingSource, /const resolved = await tipcClient\.resolveSampling\(/);
  assert.match(samplingSource, /This sampling request is no longer waiting for approval\. Close this dialog to continue\./);
  assert.match(samplingSource, /Couldn't submit your decision yet\. This request is still open, so you can try again\./);
  assert.match(samplingSource, /\{isRequestUnavailable \? \(/);
  assert.match(samplingSource, /pendingDecision === true \? "Approving\.\.\." : "Approve"/);
});