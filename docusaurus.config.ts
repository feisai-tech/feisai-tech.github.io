import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import {processBlogPosts} from './scripts/git-blog-authors.mts';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Feisai',
  tagline: '一些日常，一些探索，还有慢慢积累的知识。',
  favicon: 'img/logo.svg',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  url: 'https://feisai-tech.github.io',
  baseUrl: '/',
  organizationName: 'feisai-tech',
  projectName: 'feisai-tech.github.io',

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      {
        docs: false,
        blog: {
          processBlogPosts,
          showReadingTime: true,
          blogTitle: 'Feisai Blog',
          blogDescription: '日常、想法与实践记录。',
          blogSidebarTitle: 'Recent Posts',
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    ['@docusaurus/plugin-content-docs', {
      id: 'tutorial',
      path: 'docs/tutorial',
      routeBasePath: 'tutorial',
      sidebarPath: './sidebarsTutorial.ts',
    }],
    ['@docusaurus/plugin-content-docs', {
      id: 'rule',
      path: 'docs/rule',
      routeBasePath: 'rule',
      sidebarPath: './sidebarsRule.ts',
    }],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Feisai',
      logo: {
        alt: 'Feisai',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          docsPluginId: 'tutorial',
          position: 'left',
          label: 'Tutorials',
        },
        {
          type: 'docSidebar',
          sidebarId: 'ruleSidebar',
          docsPluginId: 'rule',
          position: 'left',
          label: 'Guidelines',
        },
        {to: '/blog', label: 'Blog', position: 'left'},
        {to: '/about', label: 'About', position: 'left'},
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Read & Learn',
          items: [
            {label: 'Tutorials', to: '/tutorial/intro'},
            {label: 'Guidelines', to: '/rule/intro'},
          ],
        },
        {
          title: 'Explore',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'About Feisai',
              to: '/about',
            },
            {label: 'Sources', to: '/sources'},
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Feisai · 保持好奇，认真记录。`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
