const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'MarkdownRenderer.tsx'),
  'utf8',
);
const markdownRenderPartsSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'markdown-render-parts.ts'),
  'utf8',
);
const sessionPresentationSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'session-presentation.ts'),
  'utf8',
);

test('mobile markdown renderer uses explicit shared prop-part contracts', () => {
  assert.match(source, /type MarkdownCodeBlockCopyMobilePropsParts,/);
  assert.match(source, /type MarkdownImageMobilePropsParts,/);
  assert.match(source, /type MarkdownThinkSectionMobilePropsParts,/);
  assert.match(source, /type MarkdownPressHandler = \(\) => void \| Promise<void>;/);
  assert.match(source, /type MarkdownThinkSectionParts =\s+MarkdownThinkSectionMobilePropsParts<MarkdownThinkSectionStyles, MarkdownPressHandler>;/);
  assert.match(source, /type MarkdownImageParts = MarkdownImageMobilePropsParts<MarkdownImageSource, StyleProp<ImageStyle>>;/);
  assert.match(source, /type MarkdownCodeBlockCopyParts =\s+MarkdownCodeBlockCopyMobilePropsParts<MarkdownCodeBlockCopyStyles, MarkdownPressHandler>;/);
  assert.match(source, /const thinkSectionParts: MarkdownThinkSectionParts = createMarkdownThinkSectionMobilePropsParts\(\{/);
  assert.match(source, /const imageParts: MarkdownImageParts = createMarkdownImageMobilePropsParts\(\{/);
  assert.match(source, /const codeBlockCopyParts: MarkdownCodeBlockCopyParts = createMarkdownCodeBlockCopyMobilePropsParts\(\{/);
  assert.doesNotMatch(source, /const thinkSectionParts = createMarkdownThinkSectionMobilePropsParts\(\{/);
  assert.doesNotMatch(source, /const imageParts = createMarkdownImageMobilePropsParts\(\{/);
  assert.doesNotMatch(source, /const codeBlockCopyParts = createMarkdownCodeBlockCopyMobilePropsParts\(\{/);
  assert.doesNotMatch(source, /type Markdown.*Parts = ReturnType<typeof createMarkdown/);
});

test('mobile markdown renderer keeps subcomponent style inputs typed to mobile surfaces', () => {
  assert.match(markdownRenderPartsSource, /export interface MarkdownThinkSectionMobilePropsParts/);
  assert.match(markdownRenderPartsSource, /export interface MarkdownImageMobilePropsParts/);
  assert.match(markdownRenderPartsSource, /export interface MarkdownCodeBlockCopyMobilePropsParts/);
  assert.match(sessionPresentationSource, /type MarkdownThinkSectionMobilePropsParts,/);
  assert.match(sessionPresentationSource, /type MarkdownImageMobilePropsParts,/);
  assert.match(sessionPresentationSource, /type MarkdownCodeBlockCopyMobilePropsParts,/);
  assert.match(source, /type MarkdownThinkSectionStyles = \{[\s\S]*?container: StyleProp<ViewStyle>;[\s\S]*?label: StyleProp<TextStyle>;[\s\S]*?content: StyleProp<ViewStyle>;[\s\S]*?\};/);
  assert.match(source, /type MarkdownCodeBlockCopyStyles = \{[\s\S]*?codeBlockCopyContainer: StyleProp<ViewStyle>;[\s\S]*?codeBlockCopyText: StyleProp<TextStyle>;[\s\S]*?codeBlockCopyButtonPressed: StyleProp<ViewStyle>;[\s\S]*?\};/);
  assert.match(source, /styles: MarkdownThinkSectionStyles;/);
  assert.match(source, /styles: MarkdownCodeBlockCopyStyles;/);
  assert.match(source, /const \[imageSource, setImageSource\] = React\.useState<MarkdownImageSource \| null>\(null\);/);
  assert.doesNotMatch(source, /styles: any;[\s\S]*?createMarkdown(ThinkSection|CodeBlockCopy)MobilePropsParts/);
});
