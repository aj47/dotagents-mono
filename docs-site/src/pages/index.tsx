import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

type DocPath = {
  title: string;
  description: string;
  to: string;
};

type QuickStep = {
  step: string;
  title: string;
  command?: string;
  description: string;
  to: string;
};

const startPaths: DocPath[] = [
  {
    title: 'New to DotAgents',
    description: 'Start with the guided setup, install the desktop app, and send the first message.',
    to: '/getting-started/quickstart',
  },
  {
    title: 'Ready to install',
    description: 'Use the release downloads or one-line scripts for macOS, Windows, and Linux.',
    to: '/getting-started/installation',
  },
  {
    title: 'Pairing mobile',
    description: 'Enable the desktop remote server, scan the QR code, and connect the mobile app.',
    to: '/desktop/remote-server',
  },
  {
    title: 'Configuring agents',
    description: 'Define agent files, tools, skills, model overrides, and delegation targets.',
    to: '/agents/profiles',
  },
  {
    title: 'Adding integrations',
    description: 'Connect MCP servers, WhatsApp, Discord, providers, and observability.',
    to: '/tools/mcp',
  },
  {
    title: 'Contributing',
    description: 'Build the monorepo, run checks, and understand desktop/mobile boundaries.',
    to: '/development/setup',
  },
];

const quickSteps: QuickStep[] = [
  {
    step: '01',
    title: 'Install DotAgents',
    command: 'curl -fsSL https://raw.githubusercontent.com/aj47/dotagents-mono/main/scripts/install.sh | bash',
    description: 'Install from source or download a signed release build.',
    to: '/getting-started/installation',
  },
  {
    step: '02',
    title: 'Run setup',
    description: 'Choose providers, configure the desktop runtime, and verify the app can talk to an agent.',
    to: '/getting-started/quickstart',
  },
  {
    step: '03',
    title: 'Create an agent',
    description: 'Give it a system prompt, tools, skills, and optional model overrides.',
    to: '/getting-started/first-agent',
  },
  {
    step: '04',
    title: 'Connect tools and surfaces',
    description: 'Add MCP servers, pair mobile, and route trusted WhatsApp or Discord messages.',
    to: '/tools/mcp',
  },
];

const systemHubs: DocPath[] = [
  {
    title: 'Desktop Runtime',
    description: 'Electron main process, renderer, panel, sessions, updater, and remote API.',
    to: '/desktop/overview',
  },
  {
    title: 'Mobile App',
    description: 'Expo app, QR pairing, voice UX, operator dashboard, and mobile settings.',
    to: '/mobile/overview',
  },
  {
    title: '.agents Protocol',
    description: 'Layered file-based config for agents, skills, tasks, notes, MCP, and models.',
    to: '/concepts/dot-agents-protocol',
  },
  {
    title: 'Agent Delegation',
    description: 'Use acpx and ACP-compatible agents for multi-agent work and handoffs.',
    to: '/agents/delegation',
  },
  {
    title: 'Remote API',
    description: 'HTTP routes used by mobile, external clients, push, TTS, assets, and operators.',
    to: '/reference/api',
  },
  {
    title: 'Build and Release',
    description: 'Desktop packaging, signing, docs builds, website deploys, and release checks.',
    to: '/development/build-release-deploy',
  },
];

const capabilityRows = [
  ['Voice', 'Hold-to-talk, hands-free mode, STT, TTS, and language controls.'],
  ['Tools', 'MCP server configuration, approvals, runtime tools, and scoped access.'],
  ['Agents', 'File-backed agents with prompts, roles, model overrides, skills, and tool access.'],
  ['Channels', 'Trusted WhatsApp and Discord entry points for selected agents.'],
  ['Operations', 'Remote server status, Cloudflare/Tailscale paths, logs, health, and updater actions.'],
  ['Privacy', 'Local-first storage, explicit pairing, API keys, and integration allowlists.'],
];

function StartPath({title, description, to}: DocPath) {
  return (
    <Link to={to} className={styles.pathRow}>
      <span>{title}</span>
      <p>{description}</p>
    </Link>
  );
}

function QuickStepCard({step, title, command, description, to}: QuickStep) {
  return (
    <Link to={to} className={styles.stepCard}>
      <span className={styles.stepNumber}>{step}</span>
      <div>
        <Heading as="h3">{title}</Heading>
        {command ? <code>{command}</code> : null}
        <p>{description}</p>
      </div>
    </Link>
  );
}

function HubCard({title, description, to}: DocPath) {
  return (
    <Link to={to} className={styles.hubCard}>
      <Heading as="h3">{title}</Heading>
      <p>{description}</p>
    </Link>
  );
}

export default function Home(): ReactNode {
  const releasesUrl = 'https://github.com/aj47/dotagents-mono/releases/latest';

  return (
    <Layout
      title="Documentation"
      description="DotAgents documentation for desktop, mobile, agents, MCP tools, remote API, and the .agents protocol.">
      <main className={styles.pageShell}>
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroGrid}>
              <div className={styles.heroCopy}>
                <span className={styles.kicker}>DotAgents Documentation</span>
                <Heading as="h1">Run agents from your desktop, phone, and chat tools.</Heading>
                <p>
                  DotAgents is a desktop-first agent runtime with mobile control, voice input,
                  file-backed agent config, MCP tools, and acpx delegation. These docs are organized
                  around the jobs operators actually need to finish.
                </p>
                <div className={styles.heroActions}>
                  <Link className={clsx('button button--primary button--lg', styles.primaryAction)} to="/getting-started/quickstart">
                    Start quick setup
                  </Link>
                  <Link className={clsx('button button--secondary button--lg', styles.secondaryAction)} to={releasesUrl}>
                    Download release
                  </Link>
                </div>
              </div>

              <div className={styles.commandPanel} aria-label="Install commands">
                <div className={styles.panelHeader}>
                  <span>Install</span>
                  <Link to="/getting-started/installation">Full guide</Link>
                </div>
                <div className={styles.commandBlock}>
                  <span>macOS / Linux</span>
                  <code>curl -fsSL https://raw.githubusercontent.com/aj47/dotagents-mono/main/scripts/install.sh | bash</code>
                </div>
                <div className={styles.commandBlock}>
                  <span>Windows PowerShell</span>
                  <code>irm https://raw.githubusercontent.com/aj47/dotagents-mono/main/scripts/install.ps1 | iex</code>
                </div>
                <dl className={styles.runtimeFacts}>
                  <div>
                    <dt>Runtime</dt>
                    <dd>Electron desktop app with local agent services</dd>
                  </div>
                  <div>
                    <dt>Mobile</dt>
                    <dd>Expo client paired through the desktop remote server</dd>
                  </div>
                  <div>
                    <dt>Config</dt>
                    <dd>Layered global and workspace <code>.agents</code> files</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.startSection}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <span>Start here</span>
              <Heading as="h2">Choose the path that matches what you are trying to do.</Heading>
            </div>
            <div className={styles.pathsGrid}>
              {startPaths.map((path) => (
                <StartPath key={path.title} {...path} />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.stepsSection}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <span>Quick setup</span>
              <Heading as="h2">A practical first run in four steps.</Heading>
            </div>
            <div className={styles.stepsGrid}>
              {quickSteps.map((step) => (
                <QuickStepCard key={step.step} {...step} />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.systemSection}>
          <div className="container">
            <div className={styles.systemLayout}>
              <div>
                <div className={styles.sectionHeader}>
                  <span>Docs hubs</span>
                  <Heading as="h2">Everything is grouped by operational surface.</Heading>
                </div>
                <div className={styles.hubsGrid}>
                  {systemHubs.map((hub) => (
                    <HubCard key={hub.title} {...hub} />
                  ))}
                </div>
              </div>
              <aside className={styles.capabilityTable}>
                <div className={styles.panelHeader}>
                  <span>What is covered</span>
                  <Link to="/intro">All docs</Link>
                </div>
                {capabilityRows.map(([label, description]) => (
                  <div key={label} className={styles.capabilityRow}>
                    <strong>{label}</strong>
                    <p>{description}</p>
                  </div>
                ))}
              </aside>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
