import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'DotAgents',
  tagline: 'One dot. Every agent.',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://docs.dotagents.app',
  baseUrl: '/',

  organizationName: 'aj47',
  projectName: 'dotagents-mono',

  onBrokenLinks: 'warn',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl:
            'https://github.com/aj47/dotagents-mono/tree/main/docs-site/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/dotagents-social-card.png',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'DotAgents',
      logo: {
        alt: 'DotAgents Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://dotagents.app',
          label: 'Website',
          position: 'left',
        },
        {
          href: 'https://discord.gg/cK9WeQ7jPq',
          label: 'Discord',
          position: 'right',
        },
        {
          href: 'https://github.com/aj47/dotagents-mono',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/getting-started/installation',
            },
            {
              label: 'Desktop App',
              to: '/desktop/overview',
            },
            {
              label: 'Mobile App',
              to: '/mobile/overview',
            },
          ],
        },
        {
          title: 'Learn',
          items: [
            {
              label: 'Core Concepts',
              to: '/concepts/architecture',
            },
            {
              label: 'Agent System',
              to: '/agents/profiles',
            },
            {
              label: 'MCP Tools',
              to: '/tools/mcp',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/cK9WeQ7jPq',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/aj47/dotagents-mono',
            },
            {
              label: 'Website',
              href: 'https://dotagents.app',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} DotAgents. Built with Docusaurus. Licensed under AGPL-3.0.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript', 'markdown'],
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
