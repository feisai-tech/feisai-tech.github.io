import {execFileSync} from 'node:child_process';
import type {Author, BlogPost} from '@docusaurus/plugin-content-blog';

export async function processBlogPosts(
  {blogPosts}: {blogPosts: BlogPost[]},
  siteDir = process.cwd(),
): Promise<void> {
  const git = (...args: string[]) => execFileSync('git', args, {
    cwd: siteDir, encoding: 'utf8',
  }).trim();
  if (git('rev-parse', '--is-shallow-repository') === 'true') {
    throw new Error('Blog authors need full Git history. Run git fetch --unshallow.');
  }

  const requests = new Map<string, Promise<unknown>>();
  function github<T>(path: string): Promise<T> {
    if (!requests.has(path)) {
      requests.set(path, (async () => {
        const headers: Record<string, string> = {Accept: 'application/vnd.github+json'};
        if (process.env.GITHUB_TOKEN) {
          headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
        }
        const response = await fetch(`https://api.github.com/${path}`, {
          headers, signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) {
          throw new Error(`GitHub author lookup failed (${response.status}): ${path}`);
        }
        return response.json();
      })());
    }
    return requests.get(path) as Promise<T>;
  }

  for (const post of blogPosts) {
    const file = post.metadata.source.replace(/^@site\//, '');
    const commit = git('log', '--follow', '--diff-filter=A', '--format=%H', '--', file)
      .split('\n').at(-1);
    if (!commit) {
      throw new Error(`Cannot find the first commit for ${file}. Commit the article before previewing.`);
    }
    const info = await github<{author: {login: string} | null}>(
      `repos/feisai-tech/feisai-tech.github.io/commits/${commit}`,
    );
    if (!info.author?.login) {
      throw new Error(`The first commit for ${file} is not linked to a GitHub account. Check its author email.`);
    }
    const user = await github<{
      login: string; name: string | null; avatar_url: string; html_url: string;
    }>(`users/${encodeURIComponent(info.author.login)}`);
    const author: Author = {
      key: null, page: null,
      name: user.name || user.login,
      imageURL: user.avatar_url,
      url: user.html_url,
      socials: {github: user.html_url},
    };
    if (user.login === 'zhengsaihong') {
      author.socials!.x = 'https://x.com/Jeremy8zsh';
    }
    post.metadata = {...post.metadata, authors: [author]};
  }
}
