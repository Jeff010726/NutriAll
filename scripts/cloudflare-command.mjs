// Use the verified desktop OAuth session explicitly, without copying credentials into the repo.
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
export async function cloudflareSessionEnv() {
  const config = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData/Roaming'), 'xdg.config/.wrangler/config/default.toml');
  const source = await readFile(config, 'utf8');
  const token = source.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
  if (!token) throw new Error('No verified Cloudflare OAuth session is available.');
  return { ...process.env, CLOUDFLARE_API_TOKEN: token, WRANGLER_LOG_PATH: path.resolve(import.meta.dirname, '../.wrangler/logs/newsletter-cli.log') };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const require = createRequire(import.meta.url), environment = await cloudflareSessionEnv();
  const cli = path.join(path.dirname(require.resolve('wrangler/package.json')), 'bin/wrangler.js');
  const child = spawn(process.execPath, [cli, ...process.argv.slice(2)], { cwd: path.resolve(import.meta.dirname, '..'), env: environment, shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const output = (chunk) => process.stdout.write(String(chunk).replaceAll(environment.CLOUDFLARE_API_TOKEN, '[redacted]'));
  child.stdout.on('data', output); child.stderr.on('data', output);
  child.on('error', () => { console.error('Could not start Cloudflare command.'); process.exitCode = 1; });
  child.on('close', (code) => { process.exitCode = code || 0; });
}
