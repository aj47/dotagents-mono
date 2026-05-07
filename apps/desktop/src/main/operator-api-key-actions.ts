import crypto from "crypto"

export function generateRemoteServerApiKey(): string {
  return crypto.randomBytes(32).toString("hex")
}
