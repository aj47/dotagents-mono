import { formatShellCommand, parseShellCommand } from './shell-parse'

describe('parseShellCommand', () => {
  it('should parse simple command without arguments', () => {
    const result = parseShellCommand('npx')
    expect(result).toEqual({ command: 'npx', args: [] })
  })

  it('should parse command with simple arguments', () => {
    const result = parseShellCommand('npx -y @modelcontextprotocol/server-google-maps')
    expect(result).toEqual({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-google-maps']
    })
  })

  it('should handle double-quoted paths with spaces', () => {
    const result = parseShellCommand('"C:\\Program Files\\My Server\\run.bat" --arg value')
    expect(result).toEqual({
      command: 'C:\\Program Files\\My Server\\run.bat',
      args: ['--arg', 'value']
    })
  })

  it('should handle single-quoted paths with spaces', () => {
    const result = parseShellCommand("'C:\\Program Files\\My Server\\run.bat' --arg value")
    expect(result).toEqual({
      command: 'C:\\Program Files\\My Server\\run.bat',
      args: ['--arg', 'value']
    })
  })

  it('should handle mixed quotes', () => {
    const result = parseShellCommand('node "path with spaces/script.js" arg1 arg2')
    expect(result).toEqual({
      command: 'node',
      args: ['path with spaces/script.js', 'arg1', 'arg2']
    })
  })

  it('should handle escaped characters', () => {
    const result = parseShellCommand('echo "hello\\"world"')
    expect(result).toEqual({
      command: 'echo',
      args: ['hello"world']
    })
  })

  it('should preserve empty quoted arguments', () => {
    const result = parseShellCommand('cmd "" tail')
    expect(result).toEqual({
      command: 'cmd',
      args: ['', 'tail']
    })
  })

  it('should treat tabs as argument separators outside quotes', () => {
    const result = parseShellCommand('cmd\targ1\t"arg\t2"')
    expect(result).toEqual({
      command: 'cmd',
      args: ['arg1', 'arg\t2']
    })
  })

  it('should preserve trailing backslashes inside double quotes', () => {
    const result = parseShellCommand('echo "C:\\temp\\\\"')
    expect(result).toEqual({
      command: 'echo',
      args: ['C:\\temp\\']
    })
  })

  it('should handle multiple spaces between arguments', () => {
    const result = parseShellCommand('cmd   arg1    arg2')
    expect(result).toEqual({
      command: 'cmd',
      args: ['arg1', 'arg2']
    })
  })

  it('should handle empty string', () => {
    const result = parseShellCommand('')
    expect(result).toEqual({ command: '', args: [] })
  })

  it('should handle whitespace-only string', () => {
    const result = parseShellCommand('   ')
    expect(result).toEqual({ command: '', args: [] })
  })

  it('should preserve backslashes in Windows paths', () => {
    const result = parseShellCommand('"C:\\Users\\test\\file.exe" --flag')
    expect(result).toEqual({
      command: 'C:\\Users\\test\\file.exe',
      args: ['--flag']
    })
  })

  it('should preserve unquoted Windows paths without treating path separators as escapes', () => {
    const result = parseShellCommand('C:\\Users\\test\\file.exe --flag')
    expect(result).toEqual({
      command: 'C:\\Users\\test\\file.exe',
      args: ['--flag']
    })
  })

  it('should treat backslash-escaped spaces outside quotes as part of the same token', () => {
    const result = parseShellCommand('python /Users/test/My\\ Scripts/run.py --flag')
    expect(result).toEqual({
      command: 'python',
      args: ['/Users/test/My Scripts/run.py', '--flag']
    })
  })

  it('should unescape quoted tokens produced by formatShellCommand', () => {
    const formatted = formatShellCommand('/Applications/My Tool/run.sh', ['--allowed-dir', '/Users/test/My Projects'])
    expect(parseShellCommand(formatted)).toEqual({
      command: '/Applications/My Tool/run.sh',
      args: ['--allowed-dir', '/Users/test/My Projects']
    })
  })

  it('should round-trip empty args and backslashes through formatShellCommand', () => {
    const formatted = formatShellCommand('cmd', ['', 'C:\\Program Files\\DotAgents'])
    expect(formatted).toBe('cmd "" "C:\\Program Files\\DotAgents"')
    expect(parseShellCommand(formatted)).toEqual({
      command: 'cmd',
      args: ['', 'C:\\Program Files\\DotAgents']
    })
  })
})

