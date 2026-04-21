// Explicit bindings keep Electron main-process bundling from emitting
// side-effect-only imports with undefined re-export references.
import {
  AGENTS_SECRETS_LOCAL_JSON,
  SECRET_REF_PREFIX,
} from "@dotagents/core"

export {
  AGENTS_SECRETS_LOCAL_JSON,
  SECRET_REF_PREFIX,
}