import type { AgentProfileConnectionTypeValue } from './agent-profile-connection';
import type { AgentProfileRole } from './agent-profile-role';
import type {
  ProfileMcpServerConfig,
  ProfileModelConfig,
  ProfileSkillsConfig,
} from './agent-profile-session-snapshot';

export type AgentProfileConnectionType = AgentProfileConnectionTypeValue;

export type AgentProfileConnection = {
  type: AgentProfileConnectionType;
  agent?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  baseUrl?: string;
};

export type AgentProfileToolConfig = ProfileMcpServerConfig;

export type AgentProfile = {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  avatarDataUrl?: string | null;
  systemPrompt?: string;
  guidelines?: string;
  properties?: Record<string, string>;
  modelConfig?: ProfileModelConfig;
  toolConfig?: AgentProfileToolConfig;
  skillsConfig?: ProfileSkillsConfig;
  connection: AgentProfileConnection;
  isStateful?: boolean;
  conversationId?: string;
  role?: AgentProfileRole;
  enabled: boolean;
  isBuiltIn?: boolean;
  isUserProfile?: boolean;
  isAgentTarget?: boolean;
  isDefault?: boolean;
  autoSpawn?: boolean;
  createdAt: number;
  updatedAt: number;
};

export type AgentProfilesData = {
  profiles: AgentProfile[];
  currentProfileId?: string;
};
