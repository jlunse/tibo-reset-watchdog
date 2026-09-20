#!/usr/bin/env python3
"""Send public-safe run status; never prints the credential. Start before research.
monitor-run.py start full|light|recovery
monitor-run.py finish published|unchanged|failed 'Public explanation' [report-id]
Optional coverage: .sites-runtime/run-coverage.json [{name,status,detail}].
"""
import os
import datetime,json,pathlib,sys,urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[1]
LOCAL=ROOT/'.sites-runtime/active-monitor-run.json'
SITE_URL=os.environ.get('WATCHDOG_SITE_URL', '').rstrip('/')
if not SITE_URL:
 raise SystemExit('Set WATCHDOG_SITE_URL to your own deployment URL before publishing.')
URL=SITE_URL+'/api/watchdog/status'
def send(r):
 token=(ROOT/'.sites-runtime/ingest-token').read_text().strip()
 req=urllib.request.Request(URL,data=json.dumps(r).encode(),headers={'User-Agent':'Mozilla/5.0','Content-Type':'application/json','Authorization':'Bearer '+token},method='POST')
 with urllib.request.urlopen(req,timeout=30) as response:json.load(response)
 with urllib.request.urlopen(urllib.request.Request(URL,headers={'User-Agent':'Mozilla/5.0'}),timeout=30) as response: saved=json.load(response)
 if r not in saved['runs']:raise RuntimeError('Run status readback mismatch')
 with (ROOT/'.sites-runtime/run-log.jsonl').open('a') as f:f.write(json.dumps(r)+'\n')
now=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
if sys.argv[1]=='start':
 if LOCAL.exists():
  old=json.loads(LOCAL.read_text())
  if old['status']=='running':
   old.update(status='failed',updatedAt=now,detail='Previous research run ended without a recorded outcome. Recovery is starting.');send(old)
 r={'runId':'check-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d-%H%M%S'),'startedAt':now,'updatedAt':now,'mode':sys.argv[2],'status':'running','detail':'Checking both research watches and public sources.','channels':[]}
 coverage=ROOT/'.sites-runtime/run-coverage.json'
 if coverage.exists():coverage.unlink()
else:
 r=json.loads(LOCAL.read_text());r.update(status=sys.argv[2],updatedAt=now,detail=sys.argv[3])
 if len(sys.argv)>4:r['reportId']=sys.argv[4]
 coverage=ROOT/'.sites-runtime/run-coverage.json'
 if coverage.exists():r['channels']=json.loads(coverage.read_text())
# Save before network calls so an interrupted operation can be recovered.
LOCAL.write_text(json.dumps(r,indent=2))
try:send(r)
except Exception as e:
 print('Monitoring publication failed:',type(e).__name__,file=sys.stderr);sys.exit(1)
print(json.dumps({'ok':True,'runId':r['runId'],'status':r['status']}))
