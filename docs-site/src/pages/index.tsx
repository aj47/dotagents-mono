import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

type FeatureItem = {
  title: string;
  emoji: string;
  description: ReactNode;
  link: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Voice-First Interface',
    emoji: '\uD83C\uDF99\uFE0F',
    description: (
      <>
        Hold to speak, release to act. Your agents listen, think, and execute
        tools &mdash; all triggered by your voice. 30+ languages supported.
      </>
    ),
    link: '/voice/overview',
  },
  {
    title: 'MCP Tools',
    emoji: '\uD83D\uDD27',
    description: (
      <>
        Connect to any tool via the Model Context Protocol. GitHub, filesystem,
        web search, databases &mdash; if there&apos;s an MCP server, your agent can use it.
      </>
    ),
    link: '/tools/mcp',
  },
  {
    title: 'Multi-Agent Orchestration',
    emoji: '\uD83E\uDD16',
    description: (
      <>
        Create specialized agents with distinct skills and tools. Agents can
        delegate tasks to each other through `acpx`, which runs ACP-compatible agents.
      </>
    ),
    link: '/agents/profiles',
  },
  {
    title: 'The .agents Protocol',
    emoji: '\uD83D\uDCC1',
    description: (
      <>
        An open standard for agent configuration. Define skills once in{' '}
        <code>.agents/</code>, and they work across Claude Code, Cursor, and
        every tool adopting the protocol.
      </>
    ),
    link: '/concepts/dot-agents-protocol',
  },
  {
    title: 'Desktop & Mobile',
    emoji: '\uD83D\uDCF1',
    description: (
      <>
        Full-featured Electron desktop app for macOS, Windows, and Linux. Plus a
        React Native mobile app for iOS, Android, and web.
      </>
    ),
    link: '/desktop/overview',
  },
  {
    title: 'Skills & Knowledge',
    emoji: '\uD83E\uDDE0',
    description: (
      <>
        Agents learn with portable skills and remember context across sessions.
        Export, share, and import agent bundles with your team.
      </>
    ),
    link: '/agents/skills',
  },
];

function Feature({title, emoji, description, link}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <Link to={link} className={styles.featureCard}>
        <div className="text--center padding-horiz--md">
          <div style={{fontSize: '2.5rem', marginBottom: '0.5rem'}}>{emoji}</div>
          <Heading as="h3">{title}</Heading>
          <p>{description}</p>
        </div>
      </Link>
    </div>
  );
}

function QuickLink({to, label, description}: {to: string; label: string; description: string}) {
  return (
    <Link to={to} className={styles.quickLink}>
      <strong>{label}</strong>
      <span>{description}</span>
    </Link>
  );
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  const releasesUrl = 'https://github.com/aj47/dotagents-mono/releases/latest';

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <div className={styles.eyebrowRow}>
          <span className={styles.eyebrow}>{siteConfig.title}</span>
          <span className={styles.eyebrowDetail}>Desktop and mobile agent runtime</span>
        </div>
        <Heading as="h1" className={clsx('hero__title', styles.heroTitle)}>
          Agents that do real work in the background.
        </Heading>
        <p className={clsx('hero__subtitle', styles.heroSubtitle)}>
          Free, transparent, and works with any agent provider.
        </p>
        <p className={styles.heroBody}>
          Talk to agents naturally, give them tools and context, and let them keep
          going without babysitting every step.
        </p>
        <div className={styles.installPanel}>
          <span className={styles.installLabel}>Install in one line</span>
          <code className={styles.installCommand}>curl -fsSL https://raw.githubusercontent.com/aj47/dotagents-mono/main/scripts/install.sh | bash</code>
          <span className={styles.installSubtext}>Windows PowerShell: <code>irm https://raw.githubusercontent.com/aj47/dotagents-mono/main/scripts/install.ps1 | iex</code></span>
          <div className={styles.releaseLinks}>
            <Link to={releasesUrl}>Download for macOS</Link>
            <Link to={releasesUrl}>Download for Windows</Link>
            <Link to={releasesUrl}>Download for Linux</Link>
          </div>
        </div>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/getting-started/quickstart">
            Get Started
          </Link>
          <Link
            className="button button--outline button--lg"
            style={{color: 'white', borderColor: 'rgba(255,255,255,0.4)', marginLeft: '1rem'}}
            to="/getting-started/installation">
            Install guide
          </Link>
        </div>
        <div className={styles.signalGrid}>
          <div className={styles.signalCard}>
            <strong>Free to use</strong>
            <span>Bring your own providers, tools, and local workflows.</span>
          </div>
          <div className={styles.signalCard}>
            <strong>Transparent by default</strong>
            <span>See agent progress, tool calls, artifacts, and handoffs as they happen.</span>
          </div>
          <div className={styles.signalCard}>
            <strong>Provider-agnostic</strong>
            <span>Open standards like <code>.agents</code>, MCP, ACP, and `acpx` keep you out of lock-in.</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Documentation"
      description="DotAgents documentation — voice-first AI agent orchestrator with MCP tools, multi-agent delegation, and the .agents open standard.">
      <HomepageHeader />
      <main>
        {/* Quick Links */}
        <section className={styles.quickLinks}>
          <div className="container">
            <div className={styles.quickLinksGrid}>
              <QuickLink to="/getting-started/quickstart" label="Quick Start" description="Up and running in 5 minutes" />
              <QuickLink to="/getting-started/installation" label="Install" description="One-line install or releases" />
              <QuickLink to="/getting-started/first-agent" label="First Agent" description="Create your first AI agent" />
              <QuickLink to="/tools/mcp" label="Add Tools" description="Connect MCP tool servers" />
              <QuickLink to="/desktop/remote-server" label="Mobile Pairing" description="Remote server and QR setup" />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              {FeatureList.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
