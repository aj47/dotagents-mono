import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const onboardingSource = readFileSync(new URL("./onboarding.tsx", import.meta.url), "utf8")
const providersSource = readFileSync(new URL("./settings-providers.tsx", import.meta.url), "utf8")
const generalSource = readFileSync(new URL("./settings-general.tsx", import.meta.url), "utf8")
const remoteSource = readFileSync(new URL("./settings-remote-server.tsx", import.meta.url), "utf8")
const presetSource = readFileSync(new URL("../components/model-preset-manager.tsx", import.meta.url), "utf8")

describe("secret storage disclosure UI", () => {
  it("shows the secure-storage note where secret values are entered or displayed", () => {
    expect(onboardingSource).toMatch(/<SecureStorageNote/)
    expect(providersSource).toMatch(/type === "password" && <SecureStorageNote/)
    expect(generalSource).toMatch(/<SecureStorageNote/)
    expect(remoteSource).toMatch(/<SecureStorageNote/)
    expect(presetSource).toMatch(/<SecureStorageNote/)
  })
})
