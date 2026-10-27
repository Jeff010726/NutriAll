import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { cloudflareSessionEnv } from './cloudflare-command.mjs';
const root = path.resolve(import.meta.dirname, '..');
const data = JSON.parse(await readFile(path.join(root, '.kit-migration-secrets.json'), 'utf8'));
if (!data.resendKey) throw new Error('No sending credential configured.');
const require = createRequire(import.meta.url), wrangler = path.join(path.dirname(require.resolve('wrangler/package.json')), 'bin/wrangler.js');
const environment = await cloudflareSessionEnv();
await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [wrangler, 'secret', 'put', 'RESEND_API_KEY'], { cwd: root, env: environment, shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  child.stdout.on('data', () => {}); child.stderr.on('data', () => {});
  child.on('error', () => reject(new Error('Could not start secret configuration.')));
  child.on('close', (code) => code === 0 ? resolve() : reject(new Error('Secret configuration failed; sensitive output withheld.')));
  child.stdin.end(data.resendKey);
});
console.log('Configured the encrypted server-side RESEND_API_KEY secret. Value withheld. No email sent.');
