const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const textInputPanelSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'components', 'text-input-panel.tsx'),
  'utf8'
);

const overlaySource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'components', 'overlay-follow-up-input.tsx'),
  'utf8'
);

const tileSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'components', 'tile-follow-up-input.tsx'),
  'utf8'
);

const imageUtilsSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'lib', 'message-image-utils.ts'),
  'utf8'
);

test('desktop image attachment helpers normalize inline feedback copy', () => {
  assert.match(imageUtilsSource, /export const getImageAttachmentFeedbackMessage = \(errors: string\[], addedCount = 0\) =>/);
  assert.match(imageUtilsSource, /Any added images are still here\./);
  assert.match(imageUtilsSource, /export const getImageAttachmentUnexpectedErrorMessage = \(error: unknown\) =>/);
});

test('text input panel keeps image-attachment failures inline and recoverable', () => {
  assert.match(textInputPanelSource, /const \[attachmentError, setAttachmentError\] = useState<string \| null>\(null\)/);
  assert.match(textInputPanelSource, /setAttachmentError\(getImageAttachmentFeedbackMessage\(errors, attachments\.length\)\)/);
  assert.match(textInputPanelSource, /setAttachmentError\(getImageAttachmentUnexpectedErrorMessage\(error\)\)/);
  assert.match(textInputPanelSource, /role="alert"/);
  assert.match(textInputPanelSource, /imageAttachments\.length > 0 \? "Add more" : "Choose again"/);
  assert.doesNotMatch(textInputPanelSource, /window\.alert\(/);
});

test('overlay and tile follow-up composers replace blocking attachment alerts with inline feedback', () => {
  for (const source of [overlaySource, tileSource]) {
    assert.match(source, /const \[attachmentError, setAttachmentError\] = useState<string \| null>\(null\)/);
    assert.match(source, /setAttachmentError\(getImageAttachmentFeedbackMessage\(errors, attachments\.length\)\)/);
    assert.match(source, /setAttachmentError\(getImageAttachmentUnexpectedErrorMessage\(error\)\)/);
    assert.match(source, /role="alert"/);
    assert.match(source, /imageAttachments\.length > 0 \? "Add more" : "Choose again"/);
    assert.doesNotMatch(source, /window\.alert\(/);
  }
});