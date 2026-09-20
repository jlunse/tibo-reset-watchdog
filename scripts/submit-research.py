#!/usr/bin/env python3
"""Publish a reviewed public research report, then verify identical readback.
Secrets are read from the ignored local file and never printed.
Usage: python3 scripts/submit-research.py research/latest.json
"""
import os
import json, pathlib, sys, urllib.request, urllib.error
ROOT=pathlib.Path(__file__).resolve().parents[1]
SITE_URL=os.environ.get('WATCHDOG_SITE_URL', '').rstrip('/')
if not SITE_URL:
 raise SystemExit('Set WATCHDOG_SITE_URL to your own deployment URL before publishing.')
URL=SITE_URL+'/api/watchdog'
report=json.loads(pathlib.Path(sys.argv[1]).read_text())
token=(ROOT/'.sites-runtime/ingest-token').read_text().strip()
headers={'Content-Type':'application/json','User-Agent':'Mozilla/5.0 TiboWatchdogResearch/2','Authorization':'Bearer '+token}
try:
    req=urllib.request.Request(URL,data=json.dumps(report).encode(),headers=headers,method='POST')
    with urllib.request.urlopen(req,timeout=45) as response: result=json.load(response)
    req=urllib.request.Request(URL,headers={'User-Agent':headers['User-Agent'],'Cache-Control':'no-cache'})
    with urllib.request.urlopen(req,timeout=45) as response: saved=json.load(response)
    if saved.get('research')!=report: raise RuntimeError('Public readback differs; inspect before retrying')
    print(json.dumps({'ok':True,'runId':result['runId'],'state':saved['state']}))
except urllib.error.HTTPError as exc:
    print('Publish failed: HTTP',exc.code,exc.read(3000).decode(),file=sys.stderr)
    sys.exit(1)
