import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className={styles.heroInner}>
        <div>
          <p className={styles.eyebrow}>FEISAI / PERSONAL SPACE</p>
          <Heading as="h1" className={styles.title}>
            记录生活，<br />也整理自己<span>。</span>
          </Heading>
          <p className={styles.subtitle}>{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link className="button button--primary button--lg" to="/blog">
              Read the Blog <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <p className={styles.footnote}>不必事事有答案，先把值得记住的留下。</p>
        </div>
        <div className={styles.notebook} aria-hidden="true">
          <div className={styles.paper}>
            <span className={styles.paperLabel}>A LITTLE SPACE FOR MY THOUGHTS</span>
            <span className={styles.paperMark}>f.</span>
            <p>保持好奇。<br />认真记录。</p>
            <div className={styles.paperBottom}>
              <span>FEISAI · BLOG & LIFE</span><span>✳</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Home"
      description={siteConfig.tagline}>
      <main>
        <HomepageHeader />
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
