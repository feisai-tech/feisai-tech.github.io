import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, writeFileSync, renameSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';

test('attributes a renamed post to its first GitHub author, not its latest editor', async () => {
  const {processBlogPosts} = await import('./git-blog-authors.mts');
  const directory = mkdtempSync(join(tmpdir(), 'feisai-authors-'));
  const git = (...args) => execFileSync('git', args, {
    cwd: directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  git('init', '-q');
  mkdirSync(join(directory, 'blog'));
  writeFileSync(join(directory, 'blog/original.md'), '# Original\n');
  git('add', '.');
  git('-c', 'user.name=Original Writer', '-c', 'user.email=writer@example.com', 'commit', '-qm', 'Add article');
  const firstCommit = git('rev-parse', 'HEAD');
  renameSync(join(directory, 'blog/original.md'), join(directory, 'blog/renamed.md'));
  git('add', '.');
  git('-c', 'user.name=Later Editor', '-c', 'user.email=editor@example.com', 'commit', '-qm', 'Rename article');
  const originalFetch = globalThis.fetch;
  // Only the external GitHub API is mocked; Git history and renames are real.
  globalThis.fetch = async (url) => {
    if (url === `https://api.github.com/repos/feisai-tech/feisai-tech.github.io/commits/${firstCommit}`) {
      return Response.json({author: {login: 'zhengsaihong'}});
    }
    if (url === 'https://api.github.com/users/zhengsaihong') {
      return Response.json({login: 'zhengsaihong', name: 'Cheng Sai Hong',
        avatar_url: 'https://avatars.githubusercontent.com/u/114077750',
        html_url: 'https://github.com/zhengsaihong'});
    }
    throw new Error(`Unexpected GitHub request: ${url}`);
  };
  try {
    const post = {metadata: {source: '@site/blog/renamed.md', authors: []}};
    await processBlogPosts({blogPosts: [post]}, directory);
    assert.equal(post.metadata.authors[0].name, 'Cheng Sai Hong');
    assert.equal(post.metadata.authors[0].title, undefined);
    assert.equal(post.metadata.authors[0].imageURL, 'https://avatars.githubusercontent.com/u/114077750');
    assert.equal(post.metadata.authors[0].socials.github, 'https://github.com/zhengsaihong');
    assert.equal(post.metadata.authors[0].socials.x, 'https://x.com/Jeremy8zsh');
    globalThis.fetch = async (url) => url.includes('/commits/')
      ? Response.json({author: {login: 'another-writer'}})
      : Response.json({login: 'another-writer', name: 'Another Writer',
        avatar_url: 'https://avatars.githubusercontent.com/u/2',
        html_url: 'https://github.com/another-writer'});
    await processBlogPosts({blogPosts: [post]}, directory);
    assert.equal(post.metadata.authors[0].name, 'Another Writer');
    assert.equal(post.metadata.authors[0].socials.github, 'https://github.com/another-writer');
    assert.equal(post.metadata.authors[0].socials.x, undefined);
    const shallow = join(directory, 'shallow');
    git('clone', '--depth=1', `file://${directory}`, shallow);
    await assert.rejects(processBlogPosts({blogPosts: [post]}, shallow), /full Git history/);
    writeFileSync(join(directory, 'blog/uncommitted.md'), '# Draft\n');
    await assert.rejects(processBlogPosts({blogPosts: [{metadata: {
      source: '@site/blog/uncommitted.md', authors: [],
    }}]}, directory), /first commit/i);
    globalThis.fetch = async () => Response.json({author: null});
    await assert.rejects(processBlogPosts({blogPosts: [post]}, directory), /GitHub account/i);
    globalThis.fetch = async () => new Response('Rate limited', {status: 403});
    await assert.rejects(processBlogPosts({blogPosts: [post]}, directory), /403/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
