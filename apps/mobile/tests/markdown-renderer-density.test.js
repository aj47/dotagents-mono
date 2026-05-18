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
  assert.match(source, /import \{ VideoAttachmentCard, type VideoAttachmentCardProps \} from '\.\/VideoAttachmentCard';/);
  assert.match(source, /export interface MarkdownRendererProps extends MarkdownThinkSectionControlOptions/);
  assert.match(source, /assetBaseUrl\?: VideoAttachmentCardProps\['assetBaseUrl'\];/);
  assert.match(source, /assetAuthToken\?: VideoAttachmentCardProps\['authToken'\];/);
  assert.match(source, /type MarkdownCodeBlockCopyMobilePropsParts,/);
  assert.match(source, /type MarkdownContentMobileStyleSheetSlots,/);
  assert.match(source, /type MarkdownImageMobilePropsParts,/);
  assert.match(source, /type MarkdownThinkSectionMobilePropsParts,/);
  assert.match(source, /type MarkdownThinkSectionMobileStyleSheetSlots,/);
  assert.match(source, /type MarkdownPressHandler = \(\) => void \| Promise<void>;/);
  assert.match(source, /type MarkdownDisplayStyles = React\.ComponentProps<typeof Markdown>\['style'\];/);
  assert.match(source, /type MarkdownDisplayRules = React\.ComponentProps<typeof Markdown>\['rules'\];/);
  assert.match(source, /type MarkdownThinkSectionParts =\s+MarkdownThinkSectionMobilePropsParts<MarkdownThinkSectionStyles, MarkdownPressHandler>;/);
  assert.match(source, /type MarkdownImageParts = MarkdownImageMobilePropsParts<MarkdownImageSource, StyleProp<ImageStyle>>;/);
  assert.match(source, /type MarkdownCodeBlockCopyParts =\s+MarkdownCodeBlockCopyMobilePropsParts<MarkdownCodeBlockCopyStyles, MarkdownPressHandler>;/);
  assert.match(source, /const thinkSectionParts = React\.useMemo<MarkdownThinkSectionParts>\(\s+\(\) => createMarkdownThinkSectionMobilePropsParts\(\{/);
  assert.match(source, /const imageParts = React\.useMemo<MarkdownImageParts>\(\s+\(\) => createMarkdownImageMobilePropsParts\(\{/);
  assert.match(source, /const codeBlockCopyParts = React\.useMemo<MarkdownCodeBlockCopyParts>\(\s+\(\) => createMarkdownCodeBlockCopyMobilePropsParts\(\{/);
  assert.doesNotMatch(source, /const thinkSectionParts = createMarkdownThinkSectionMobilePropsParts\(\{/);
  assert.doesNotMatch(source, /const imageParts = createMarkdownImageMobilePropsParts\(\{/);
  assert.doesNotMatch(source, /const codeBlockCopyParts = createMarkdownCodeBlockCopyMobilePropsParts\(\{/);
  assert.doesNotMatch(source, /const thinkSectionParts: MarkdownThinkSectionParts = createMarkdownThinkSectionMobilePropsParts\(\{/);
  assert.doesNotMatch(source, /const imageParts: MarkdownImageParts = createMarkdownImageMobilePropsParts\(\{/);
  assert.doesNotMatch(source, /const codeBlockCopyParts: MarkdownCodeBlockCopyParts = createMarkdownCodeBlockCopyMobilePropsParts\(\{/);
  assert.doesNotMatch(source, /type Markdown.*Parts = ReturnType<typeof createMarkdown/);
});

test('mobile markdown renderer keeps subcomponent style inputs typed to mobile surfaces', () => {
  assert.match(markdownRenderPartsSource, /export interface MarkdownThinkSectionMobilePropsParts/);
  assert.match(markdownRenderPartsSource, /export interface MarkdownThinkSectionMobilePropsStylesLike<\s+TContainerStyle = unknown,/);
  assert.match(markdownRenderPartsSource, /export interface MarkdownImageMobilePropsParts/);
  assert.match(markdownRenderPartsSource, /export interface MarkdownCodeBlockCopyMobilePropsParts/);
  assert.match(markdownRenderPartsSource, /export interface MarkdownCodeBlockCopyMobilePropsStylesLike<\s+TCodeBlockCopyContainerStyle = unknown,/);
  assert.match(sessionPresentationSource, /type MarkdownThinkSectionMobilePropsParts,/);
  assert.match(sessionPresentationSource, /type MarkdownThinkSectionMobileStyleSheetSlots,/);
  assert.match(sessionPresentationSource, /type MarkdownImageMobilePropsParts,/);
  assert.match(sessionPresentationSource, /type MarkdownCodeBlockCopyMobilePropsParts,/);
  assert.match(sessionPresentationSource, /type MarkdownContentMobileStyleSheetSlots,/);
  assert.match(source, /type MarkdownThinkSectionStyles = MarkdownThinkSectionMobileStyleSheetSlots;/);
  assert.match(source, /type MarkdownCodeBlockCopyStyles = MarkdownContentStyles;/);
  assert.doesNotMatch(source, /type MarkdownThinkSectionStyles = \{[\s\S]*?container: StyleProp<ViewStyle>;[\s\S]*?label: StyleProp<TextStyle>;[\s\S]*?content: StyleProp<ViewStyle>;[\s\S]*?\};/);
  assert.doesNotMatch(source, /type MarkdownCodeBlockCopyStyles = \{[\s\S]*?codeBlockCopyContainer: StyleProp<ViewStyle>;[\s\S]*?codeBlockCopyText: StyleProp<TextStyle>;[\s\S]*?codeBlockCopyButtonPressed: StyleProp<ViewStyle>;[\s\S]*?\};/);
  assert.match(source, /styles: MarkdownThinkSectionStyles;/);
  assert.match(source, /styles: MarkdownCodeBlockCopyStyles;/);
  assert.match(source, /markdownStyles: MarkdownDisplayStyles;/);
  assert.match(source, /markdownRules: MarkdownDisplayRules;/);
  assert.match(source, /const \[imageSource, setImageSource\] = React\.useState<MarkdownImageSource \| null>\(null\);/);
  assert.doesNotMatch(source, /styles: any;[\s\S]*?createMarkdown(ThinkSection|CodeBlockCopy)MobilePropsParts/);
  assert.doesNotMatch(source, /markdown(Styles|Rules): any;/);
});
