import { describe, expect, it } from "vitest";
import {
  normalizeProviderToolInputSchema,
  restoreProviderToolName,
  sanitizeProviderToolName,
} from "./provider-tool-utils";

describe("provider tool utils", () => {
  it("sanitizes provider tool names while preserving reversible colons", () => {
    expect(sanitizeProviderToolName("github:search issues")).toBe("github__COLON__search_issues");
    expect(sanitizeProviderToolName("my__custom__tool")).toBe("my__custom__tool");
  });

  it("reserves room for collision suffixes within the configured provider limit", () => {
    const longName = `${"a".repeat(70)}:tool`;
    const sanitized = sanitizeProviderToolName(longName, { suffix: "12", maxLength: 64 });

    expect(sanitized).toHaveLength(64);
    expect(sanitized.endsWith("_12")).toBe(true);
  });

  it("restores mapped tool names and verified proxy-prefixed provider responses", () => {
    const nameMap = new Map([
      ["github__COLON__search_issues", "github:search_issues"],
      ["proxy_real_tool", "proxy_real_tool"],
      ["shell__COLON__run", "shell:run"],
    ]);

    expect(restoreProviderToolName("github__COLON__search_issues", nameMap)).toBe("github:search_issues");
    expect(restoreProviderToolName("proxy_shell__COLON__run", nameMap)).toBe("shell:run");
    expect(restoreProviderToolName("proxy_real_tool", nameMap)).toBe("proxy_real_tool");
  });

  it("falls back to reversible colon restoration without stripping unverified proxy prefixes", () => {
    expect(restoreProviderToolName("server__COLON__tool")).toBe("server:tool");
    expect(restoreProviderToolName("proxy_server__COLON__tool")).toBe("proxy_server:tool");
  });

  it("normalizes tool input schemas for OpenAI-compatible function calling", () => {
    const input = {
      type: "object",
      properties: { query: { type: "string" } },
      required: "query",
      anyOf: [{ required: ["query"] }],
      oneOf: [],
      allOf: [],
      not: {},
      enum: ["x"],
    };

    expect(normalizeProviderToolInputSchema(input)).toEqual({
      type: "object",
      properties: { query: { type: "string" } },
      required: [],
    });
    expect(input.anyOf).toEqual([{ required: ["query"] }]);
  });

  it("falls back to a minimal object schema for unsupported top-level shapes", () => {
    expect(normalizeProviderToolInputSchema(undefined)).toEqual({
      type: "object",
      properties: {},
      required: [],
    });
    expect(normalizeProviderToolInputSchema({ type: "array", items: { type: "string" } })).toEqual({
      type: "object",
      properties: {},
      required: [],
    });
  });
});
