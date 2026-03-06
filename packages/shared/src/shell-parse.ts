/**
 * Shell command parsing utility
 */

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
      if (char === '"' || char === "\\") {
        current += char;
      } else {
        current += "\\" + char;
      }
      escaped = false;
      tokenStarted = true;
      continue;
    }

    if (char === "\\" && inDoubleQuote) {
      escaped = true;
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

