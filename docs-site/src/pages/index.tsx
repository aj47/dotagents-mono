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
        delegate tasks to each other via the Agent Client Protocol (ACP).
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
    title: 'Skills & Memory',
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
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">
          {siteConfig.tagline} Your assistant. Your machine. Your rules.
        </p>
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
            Install
          </Link>
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
              <QuickLink to="/getting-started/first-agent" label="First Agent" description="Create your first AI agent" />
              <QuickLink to="/tools/mcp" label="Add Tools" description="Connect MCP tool servers" />
              <QuickLink to="/mobile/overview" label="Mobile App" description="Agents on iOS & Android" />
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
