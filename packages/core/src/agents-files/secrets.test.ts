import { describe, expect, it } from "vitest"
import fs from "fs"
import os from "os"
import path from "path"
import {
  AGENTS_SECRETS_LOCAL_JSON,
  migrateJsonFileSecretsToLocalStore,
  resolveSecretRefs,
  SECRET_REF_PREFIX,
} from "./secrets"

function mkTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

describe("agents-files secrets", () => {
  it("preserves unresolved secret refs instead of replacing them with empty strings", () => {
    const dir = mkTempDir("dotagents-secret-refs-")
    const secretsFilePath = path.join(dir, AGENTS_SECRETS_LOCAL_JSON)
    const missingRef = `${SECRET_REF_PREFIX}openaiApiKey`

    fs.writeFileSync(secretsFilePath, JSON.stringify({ version: 1, secrets: {} }), "utf8")

    const resolved = resolveSecretRefs({ openaiApiKey: missingRef }, secretsFilePath)

    expect(resolved.openaiApiKey).toBe(missingRef)
  })

  it("migrates plaintext secrets with safe backup writes", () => {
    const dir = mkTempDir("dotagents-secret-migration-")
    const configFilePath = path.join(dir, "models.json")
    const secretsFilePath = path.join(dir, AGENTS_SECRETS_LOCAL_JSON)
    const backupDir = path.join(dir, ".backups")

    fs.writeFileSync(
      configFilePath,
      JSON.stringify({ openaiApiKey: "sk-test", themePreference: "dark" }, null, 2),
      "utf8",
    )

    migrateJsonFileSecretsToLocalStore(configFilePath, secretsFilePath, true, { backupDir })

    const migrated = JSON.parse(fs.readFileSync(configFilePath, "utf8"))
    expect(migrated.openaiApiKey).toMatch(new RegExp(`^${SECRET_REF_PREFIX}`))
    expect(migrated.themePreference).toBe("dark")

    const secrets = JSON.parse(fs.readFileSync(secretsFilePath, "utf8"))
    expect(Object.values(secrets.secrets)).toContain("sk-test")

    const backups = fs.readdirSync(backupDir).filter((file) => file.endsWith(".bak"))
    expect(backups.length).toBe(1)
    expect(JSON.parse(fs.readFileSync(path.join(backupDir, backups[0]), "utf8"))).toEqual({
      openaiApiKey: "sk-test",
      themePreference: "dark",
    })
  })
})