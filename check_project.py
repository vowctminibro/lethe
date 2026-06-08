#!/usr/bin/env python3
import json, subprocess

auth = json.load(open('/Users/mini/Library/Application Support/com.vercel.cli/auth.json'))
token = auth['token']
team_id = 'team_0px83HnIdHj0ouNdT1be4Rdd'
auth_header = "Authorization: Bearer " + token

def curl_get(path):
    r = subprocess.run(
        ['curl', '-s', '-H', auth_header,
         'https://api.vercel.com' + path],
        capture_output=True, text=True, timeout=15
    )
    return json.loads(r.stdout)

# Check the current lethe project
result = curl_get('/v6/projects?teamId=' + team_id)
for p in result.get('projects', []):
    if p['name'] == 'lethe':
        print("=== lethe project ===")
        print("id:", p['id'])
        print("rootDirectory:", p.get('rootDirectory'))
        print("framework:", p.get('framework'))
        print("buildCommand:", p.get('buildCommand'))
        print("outputDirectory:", p.get('outputDirectory'))
        
        # Check latest deployment
        dep_result = curl_get('/v6/deployments?projectId=' + p['id'] + '&teamId=' + team_id + '&limit=1')
        deploys = dep_result.get('deployments', [])
        if deploys:
            d = deploys[0]
            print("\n=== Latest Deployment ===")
            print("url:", d.get('url'))
            print("state:", d.get('state'))
            print("ready?", d.get('ready'))
            print("target:", d.get('target'))
        break