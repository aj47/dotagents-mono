import { describe, expect, it } from 'vitest'
import {
  extractSubAgentToolDisplayContent,
  stringifySubAgentToolResultContent,
} from './delegation-tool-display'

describe('delegation-tool-display', () => {
  it('flattens text content blocks into readable tool output', () => {
    const result = stringifySubAgentToolResultContent([
      {
        type: 'text',
        text: '{\n  "success": true,\n  "message": "Response recorded"\n}',
      },
    ])

    expect(result).toContain('"success": true')
    expect(result).toContain('"message": "Response recorded"')
    expect(result).not.toContain('"type": "text"')
  })

  it('parses legacy serialized tool payloads without escaped JSON noise', () => {
    const parsed = extractSubAgentToolDisplayContent(
      'Tool: respond_to_user\nResult: [{"type":"text","text":"{\\n  \\"success\\": true,\\n  \\"message\\": \\"Response recorded for delivery to user.\\"\\n}"}]',
    )

    expect(parsed.toolName).toBe('respond_to_user')
    expect(parsed.summary).toContain('"success": true')
    expect(parsed.summary).toContain('"message": "Response recorded for delivery to user."')
    expect(parsed.summary).not.toContain('\\"success\\"')
  })
})
