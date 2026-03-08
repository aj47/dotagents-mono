/**
 * Shell command parsing utility
 */

function shouldQuoteShellToken(token: string): boolean {
  return token.length === 0 || /[\s"'\\]/.test(token);
}

function formatShellToken(token: string): string {
  if (!shouldQuoteShellToken(token)) {
    return token;
  }

  return `"${token.replace(/["\\]/g, '\\$&')}"`;
}

export function formatShellCommand(command: string, args: string[] = []): string {
  return [command, ...args]
    .filter((token, index) => index > 0 || token.length > 0)
    .map(formatShellToken)
    .join(" ");
}

export function parseShellCommand(commandString: string): { command: string; args: string[] } {
  const trimmed = commandString.trim();
  if (!trimmed) {
    return { command: "", args: [] };
  }

  const parts: string[] = [];
  let current = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;
  let tokenStarted = false;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];

    if (escaped) {
      if (!inDoubleQuote || char === '"' || char === "\\" || char === "$" || char === "`") {
        current += char;
      } else {
        current += "\\" + char;
      }
      escaped = false;
      tokenStarted = true;
      continue;
    }

    if (char === "\\" && !inSingleQuote) {
      if (inDoubleQuote) {
        escaped = true;
        tokenStarted = true;
        continue;
      }

      const nextChar = trimmed[i + 1];
      if (nextChar && /[\s"'\\]/.test(nextChar)) {
        escaped = true;
        tokenStarted = true;
        continue;
      }

      current += char;
      tokenStarted = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      tokenStarted = true;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      tokenStarted = true;
      continue;
    }

    if (/\s/.test(char) && !inSingleQuote && !inDoubleQuote) {
      if (tokenStarted) {
        parts.push(current);
        current = "";
        tokenStarted = false;
      }
      continue;
    }

    current += char;
    tokenStarted = true;
  }

  if (escaped) {
    current += "\\";
    tokenStarted = true;
  }

  if (tokenStarted) {
    parts.push(current);
  }

  if (parts.length === 0) {
    return { command: "", args: [] };
  }

  return {
    command: parts[0],
    args: parts.slice(1),
  };
}

