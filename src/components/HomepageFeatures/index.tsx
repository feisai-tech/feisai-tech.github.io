import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import {usePluginData} from '@docusaurus/useGlobalData';
import styles from './styles.module.css';

const entries = [
  {number: '01', label: 'BLOG', title: 'The Journal', to: '/blog', description: '日常的片段、突然的想法，以及做一件事的过程。还没想清楚的，也可以先记下来。', action: 'Read the Blog'},
  {number: '02', label: 'ABOUT', title: 'About Feisai', to: '/about', description: '这里是一个持续生长的个人空间。关于为什么记录，以及这个小站想留下什么。', action: 'Get to Know Me'},
];

export default function HomepageFeatures(): ReactNode {
  const latest = usePluginData('latest-post') as {
    title: string;
    description: string;
    permalink: string;
    date: string;
  }[];
  return (
    <section className={styles.features} aria-labelledby="explore-title">
      {latest.map((post) => (
        <div className={styles.latest} key={post.permalink}>
          <div className={styles.latestLabel}>
            <span className={styles.label}>FROM THE JOURNAL</span>
            <Heading as="h2">Latest Post</Heading>
            <Link to="/blog">All Posts <span aria-hidden="true">↗</span></Link>
          </div>
          <Link to={post.permalink} className={styles.latestPost}>
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString('zh-CN', {timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit'})}
            </time>
            <Heading as="h3">{post.title}<span aria-hidden="true">↗</span></Heading>
            <p>{post.description}</p>
          </Link>
        </div>
      ))}
      <div className={styles.sectionHeading}>
        <Heading as="h2" id="explore-title">Explore the Space</Heading>
        <span>文字慢慢积累，生活继续向前。</span>
      </div>
      <div className={styles.grid}>
        {entries.map((entry) => (
          <Link className={styles.card} to={entry.to} key={entry.to}>
            <div className={styles.cardTop}><span>{entry.number}</span><span>{entry.label}</span></div>
            <Heading as="h3">{entry.title}</Heading>
            <p>{entry.description}</p>
            <span className={styles.action}>{entry.action} <span aria-hidden="true">↗</span></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
