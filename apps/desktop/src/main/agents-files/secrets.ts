// Explicit bindings keep Electron main-process bundling from emitting
// side-effect-only imports with undefined re-export references.
import {
  AGENTS_SECRETS_LOCAL_JSON,
  SECRET_REF_PREFIX,
} from "../../../../../packages/core/src/agents-files/secrets"

export {
  AGENTS_SECRETS_LOCAL_JSON,
  SECRET_REF_PREFIX,
}