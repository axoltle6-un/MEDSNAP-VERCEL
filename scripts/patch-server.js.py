#!/usr/bin/env python3
"""
Patch the standalone server.js to load .env file on startup.
Next.js standalone doesn't automatically load .env files, so we inject
a small env loader at the top of server.js.
"""
import os

server_js_path = '/home/z/my-project/.next/standalone/server.js'

with open(server_js_path, 'r') as f:
    content = f.read()

# Only patch if not already patched
if '// ENV_LOADER_PATCHED' not in content:
    env_loader = '''// ENV_LOADER_PATCHED
// Load .env file (Next.js standalone doesn't do this automatically)
(function() {
  const fs = require('fs');
  const envPath = require('path').join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      // Remove surrounding quotes if present
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      // Don't override existing env vars
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
    console.log('[env] Loaded .env file');
  }
})();
'''

    content = env_loader + content

    with open(server_js_path, 'w') as f:
        f.write(content)

    print('✓ Patched server.js with env loader')
else:
    print('✓ server.js already patched')
