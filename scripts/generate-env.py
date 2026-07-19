#!/usr/bin/env python3
"""
Generate the production .env file for the standalone build.
Reads the service account JSON and writes everything as inline env vars
so the standalone server has access without needing external files.
"""
import json
import os
from pathlib import Path

# Load .env.local if it exists (for local dev)
env_local = Path('/home/z/my-project/.env.local')
if env_local.exists():
    for line in env_local.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if '=' in line:
            key, val = line.split('=', 1)
            key = key.strip()
            val = val.strip()
            # Don't override existing env vars
            if key not in os.environ:
                os.environ[key] = val

# Read the actual service account JSON file
with open('/home/z/my-project/firebase-service-account.json', 'r') as f:
    sa = json.load(f)

# Convert to single-line minified JSON
sa_one_line = json.dumps(sa, separators=(',', ':'))

# Read current SMTP settings from .env.local (if it exists)
# Default: empty (must be set via env vars or .env.local)
smtp_host = os.environ.get('SMTP_HOST', '')
smtp_port = os.environ.get('SMTP_PORT', '587')
smtp_secure = os.environ.get('SMTP_SECURE', 'false')
smtp_user = os.environ.get('SMTP_USER', '')
smtp_pass = os.environ.get('SMTP_PASS', '')
smtp_from = os.environ.get('SMTP_FROM', '')

# Read Firebase config from .env.local
firebase_api_key = os.environ.get('NEXT_PUBLIC_FIREBASE_API_KEY', '')
firebase_auth_domain = os.environ.get('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', '')
firebase_project_id = os.environ.get('NEXT_PUBLIC_FIREBASE_PROJECT_ID', '')
firebase_storage_bucket = os.environ.get('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', '')
firebase_sender_id = os.environ.get('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', '')
firebase_app_id = os.environ.get('NEXT_PUBLIC_FIREBASE_APP_ID', '')
firebase_measurement_id = os.environ.get('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID', '')

# Read AI keys from env
llm7_key = os.environ.get('LLM7_API_KEY', '')
mistral_key = os.environ.get('MISTRAL_API_KEY', '')

# Build the .env content
env_content = f"""DATABASE_URL=file:/home/z/my-project/db/custom.db

# Firebase client config (public)
NEXT_PUBLIC_FIREBASE_API_KEY={firebase_api_key}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN={firebase_auth_domain}
NEXT_PUBLIC_FIREBASE_PROJECT_ID={firebase_project_id}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET={firebase_storage_bucket}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID={firebase_sender_id}
NEXT_PUBLIC_FIREBASE_APP_ID={firebase_app_id}
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID={firebase_measurement_id}

# Firebase Admin SDK — inline JSON (no file dependency)
FIREBASE_SERVICE_ACCOUNT={sa_one_line}

# SMTP credentials
SMTP_HOST={smtp_host}
SMTP_PORT={smtp_port}
SMTP_SECURE={smtp_secure}
SMTP_USER={smtp_user}
SMTP_PASS={smtp_pass}
SMTP_FROM={smtp_from}

# AI API Keys
LLM7_API_KEY={llm7_key}
MISTRAL_API_KEY={mistral_key}
"""

# Write to the main .env file (this is what the standalone build copies)
with open('/home/z/my-project/.env', 'w') as f:
    f.write(env_content)

print(f"✓ Wrote /home/z/my-project/.env ({len(env_content)} bytes)")
print(f"✓ Service account JSON: {len(sa_one_line)} chars, inline")
print(f"✓ SMTP configured: {smtp_from}")

# Verify the JSON is valid
try:
    json.loads(sa_one_line)
    print("✓ Service account JSON is valid")
except Exception as e:
    print(f"✗ Service account JSON is INVALID: {e}")
