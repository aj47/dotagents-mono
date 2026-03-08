const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('chat image attachments normalize inline partial-success feedback copy', () => {
  assert.match(screenSource, /type ImageAttachmentFeedback = \{/);
  assert.match(screenSource, /const getImageAttachmentFeedbackMessage = \(errors: string\[], addedCount = 0\) => \{/);
  assert.match(screenSource, /Any added images are still here\./);
  assert.match(screenSource, /const getImageAttachmentUnexpectedErrorMessage = \(error: unknown\) => \{/);
});

test('chat image attachments track picker state and replace modal attachment alerts with inline feedback', () => {
  assert.match(screenSource, /const \[imageAttachmentFeedback, setImageAttachmentFeedback\] = useState<ImageAttachmentFeedback \| null>\(null\);/);
  assert.match(screenSource, /const \[imagePickerPending, setImagePickerPending\] = useState\(false\);/);
  assert.match(screenSource, /const imagePickerPendingRef = useRef\(false\);/);
  assert.match(screenSource, /clearImageAttachmentFeedback\(\);[\s\S]*?imagePickerPendingRef\.current = true;[\s\S]*?setImagePickerPending\(true\);/);
  assert.match(screenSource, /setImageAttachmentFeedback\(\{[\s\S]*?title: 'Image limit reached'/);
  assert.match(screenSource, /setImageAttachmentFeedback\(\{[\s\S]*?title: 'Couldn\\'t attach image'[\s\S]*?actionLabel: 'Choose again'/);
  assert.doesNotMatch(screenSource, /Alert\.alert\(\s*'Some images were skipped'/);
  assert.doesNotMatch(screenSource, /Alert\.alert\(\s*'Image too large'/);
  assert.doesNotMatch(screenSource, /Alert\.alert\(\s*'Unsupported image format'/);
  assert.doesNotMatch(screenSource, /Alert\.alert\(\s*'Image picker error'/);
});

test('chat image attachments render an inline retry banner and disable the picker while busy', () => {
  assert.match(screenSource, /\{imageAttachmentFeedback && \([\s\S]*?styles\.imageAttachmentBanner[\s\S]*?accessibilityLabel=\{imageAttachmentFeedback\.actionLabel === 'Add more' \? 'Add more images' : 'Choose images again'\}[\s\S]*?<Text style=\{styles\.retryButtonText\}>\{imageAttachmentFeedback\.actionLabel\}<\/Text>/);
  assert.match(screenSource, /disabled=\{imagePickerPending\}/);
  assert.match(screenSource, /accessibilityLabel=\{imagePickerPending \? 'Selecting images' : 'Attach images'\}/);
  assert.match(screenSource, /\{imagePickerPending \? \([\s\S]*?<ActivityIndicator size="small" color=\{theme\.colors\.primary\} \/>/);
});