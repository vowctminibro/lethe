#!/usr/bin/env python3
"""Bulk-upsert non-empty vars from apps/web/.env.local into Vercel (prod/preview/dev)."""
import json, urllib.request, urllib.error

auth = json.load(open('/Users/mini/Library/Application Support/com.vercel.cli/auth.json'))
token = auth['token']
team_id = 'team_0px83HnIdHj0ouNdT1be4Rdd'
project_id = 'prj_xIpuDiBKb59y3t5CBIpZftLl98RY'

vars_to_set, skipped = [], []
with open('apps/web/.env.local') as f:
    for raw in f:
        line = raw.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, val = (s.strip() for s in line.split('=', 1))
        (vars_to_set if val else skipped).append((key, val) if val else key)

body = [{"key": k, "value": v, "type": "encrypted",
         "target": ["production", "preview", "development"]} for k, v in vars_to_set]

url = f'https://api.vercel.com/v10/projects/{project_id}/env?teamId={team_id}&upsert=true'
req = urllib.request.Request(url, data=json.dumps(body).encode(), method='POST',
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
try:
    resp = json.load(urllib.request.urlopen(req, timeout=30))
except urllib.error.HTTPError as e:
    print("HTTP ERROR", e.code, e.read().decode()); raise SystemExit(1)

print(f"submitted {len(vars_to_set)} (skipped empty: {skipped})")
print("created/upserted:", len(resp.get('created', [])))
if resp.get('failed'):
    for e in resp['failed']: print("  FAIL:", json.dumps(e)[:300])
    raise SystemExit(1)
print("===ALL ENV VARS SYNCED===")