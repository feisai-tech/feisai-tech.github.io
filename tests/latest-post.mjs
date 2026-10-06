import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import jiti from 'jiti';

const config = jiti(fileURLToPath(import.meta.url), {interopDefault: true})('../docusaurus.config.ts');
assert.ok(config.plugins?.length, 'The homepage needs latest article data');
const plugin = config.plugins[0]();
let latest;
await plugin.allContentLoaded({
  allContent: {
    'docusaurus-plugin-content-blog': {
      default: {
        blogPosts: [
          {metadata: {title: 'Private draft', unlisted: true}},
          {metadata: {title: 'Newest article', unlisted: false, permalink: '/blog/newest'}},
          {metadata: {title: 'Older article', unlisted: false}},
        ],
      },
    },
  },
  actions: {setGlobalData: (data) => {latest = data;}},
});
assert.deepEqual(latest, [{title: 'Newest article', unlisted: false, permalink: '/blog/newest'}]);
console.log('Latest article check passed.');
