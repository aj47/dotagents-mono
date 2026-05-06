const DEFAULT_PROVIDER_TOOL_NAME_MAX_LENGTH = 128;
const PROVIDER_TOOL_COLON_SENTINEL = "__COLON__";

export type ProviderToolNameSanitizeOptions = {
  suffix?: string;
  maxLength?: number;
};

export function sanitizeProviderToolName(
  name: string,
  options: ProviderToolNameSanitizeOptions = {},
): string {
  const maxLength = options.maxLength ?? DEFAULT_PROVIDER_TOOL_NAME_MAX_LENGTH;
  let sanitized = name.replace(/:/g, PROVIDER_TOOL_COLON_SENTINEL);
  sanitized = sanitized.replace(/[^a-zA-Z0-9_-]/g, "_");

  if (options.suffix) {
    const suffix = `_${options.suffix}`;
    const maxBaseLength = maxLength - suffix.length;
    if (sanitized.length > maxBaseLength) {
      sanitized = sanitized.substring(0, maxBaseLength);
    }
    return `${sanitized}${suffix}`;
  }

  if (sanitized.length > maxLength) {
    return sanitized.substring(0, maxLength);
  }

  return sanitized;
}

export function restoreProviderToolName(
  sanitizedName: string,
  toolNameMap?: Map<string, string>,
): string {
  if (toolNameMap?.has(sanitizedName)) {
    return toolNameMap.get(sanitizedName)!;
  }

  if (toolNameMap && sanitizedName.startsWith("proxy_")) {
    const cleanedName = sanitizedName.slice(6);
    if (toolNameMap.has(cleanedName)) {
      return toolNameMap.get(cleanedName)!;
    }
  }

  return sanitizedName.replace(new RegExp(PROVIDER_TOOL_COLON_SENTINEL, "g"), ":");
}

export function normalizeProviderToolInputSchema(inputSchema: unknown): Record<string, unknown> {
  const fallback: Record<string, unknown> = { type: "object", properties: {}, required: [] };

  if (!inputSchema || typeof inputSchema !== "object" || Array.isArray(inputSchema)) {
    return fallback;
  }

  const schema = { ...(inputSchema as Record<string, unknown>) };
  const schemaType = schema.type;

  if (schemaType !== undefined && schemaType !== "object") {
    return fallback;
  }
  schema.type = "object";

  if (!schema.properties || typeof schema.properties !== "object" || Array.isArray(schema.properties)) {
    schema.properties = {};
  }

  if (!Array.isArray(schema.required)) {
    schema.required = [];
  }

  delete schema.anyOf;
  delete schema.oneOf;
  delete schema.allOf;
  delete schema.not;
  delete schema.enum;

  return schema;
}
