#!/usr/bin/env python3
import json, subprocess

auth_file = '/Users/mini/Library/Application Support/com.vercel.cli/auth.json'
with open(auth_file) as f:
    auth = json.load(f)
token = auth['token']
team_id = 'team_0px83HnIdHj0ouNdT1be4Rdd'
project_id = 'prj_xIpuDiBKb59y3t5CBIpZftLl98RY'

def curl(method, path, body=None):
    cmd = [
        'curl', '-s', '-X', method,
        '-H', f'Authorization: Bearer ***',
        '-H', 'Content-Type: application/json'
    ]
    if body:
        cmd += ['-d', json.dumps(body)]
    cmd.append('https://api.vercel.com' + path)
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
    return json.loads(r.stdout)

# Verify the project has rootDirectory set
p = curl('GET', f'/v6/projects/{project_id}?teamId={team_id}')
print("=== Project Config ===")
print("name:", p.get('name'))
print("id:", p.get('id'))
print("rootDirectory:", p.get('rootDirectory'))
print("framework:", p.get('framework'))
print("buildCommand:", p.get('buildCommand'))
print("outputDirectory:", p.get('outputDirectory'))
print()

# Now link the GitHub repo to this project
print("=== Updating gitSource to link GitHub repo ===")
update = curl('PATCH', f'/v6/projects/{project_id}?teamId={team_id}', {
    "gitSource": {
        "type": "github",
        "repo": "vowctminibro/lethe",
        "repoId": "R_kgDOJvE5PQ",
        "defaultBranch": "main"
    }
})
print(json.dumps(update, indent=2)[:600])