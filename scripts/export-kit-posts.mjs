import { readFile, writeFile } from 'node:fs/promises';
import { setTimeout as pause } from 'node:timers/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..'), directory = path.join(root, 'tmp/kit-private');
const credentials = JSON.parse(await readFile(path.join(root, '.kit-migration-secrets.json'), 'utf8'));
const posts = JSON.parse(await readFile(path.join(directory, 'v4-posts.json'), 'utf8'));
let completed = 0;
for (const item of posts) {
  await pause(650);
  const response = await fetch(`https://api.kit.com/v4/posts/${encodeURIComponent(item.id)}`, { headers: { 'X-Kit-Api-Key': credentials.v4Key }, redirect: 'error', signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`KIT post read failed (${response.status}); sensitive details withheld.`);
  const data = await response.json();
  if (!data.post) throw new Error('Unexpected KIT post detail response.');
  Object.assign(item, data.post);
  completed++;
  if (completed % 10 === 0) console.log(JSON.stringify({ postsRead: completed, total: posts.length }));
}
await writeFile(path.join(directory, 'v4-posts.json'), JSON.stringify(posts));
console.log(JSON.stringify({ exportedPostDetails: completed, withContent: posts.filter((item) => item.content).length }));
