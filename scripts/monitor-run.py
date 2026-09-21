#!/usr/bin/env python3
"""Publish run status with bounded retries and durable unacknowledged completion.
start full|light|recovery; finish published|unchanged|failed DETAIL [REPORT_ID]; reconcile
"""
import datetime, fcntl, json, os, pathlib, sys, time, urllib.request, urllib.error
ROOT = pathlib.Path(__file__).resolve().parents[1]
SITE_URL = os.environ.get('WATCHDOG_SITE_URL', '').rstrip('/')
if not SITE_URL:
    raise SystemExit('Set WATCHDOG_SITE_URL to your own deployment URL before publishing.')
URL = SITE_URL + '/api/watchdog/status'


def safe_path(root, name):
    path = root / name
    if root.is_symlink() or path.is_symlink():
        raise RuntimeError('Refusing symlink in monitor state')
    return path


def save(path, value):
    temporary = path.with_suffix(path.suffix + '.tmp')
    if path.is_symlink() or temporary.is_symlink():
        raise RuntimeError('Refusing symlink in monitor state')
    with temporary.open('w') as stream:
        stream.write(json.dumps(value, indent=2))
        stream.flush()
        os.fsync(stream.fileno())
    temporary.replace(path)


def request(method, record=None, run_id=None):
    headers = {'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache'}
    data = None
    url = URL
    if method == 'POST':
        headers.update({'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (ROOT / '.sites-runtime/ingest-token').read_text().strip()})
        data = json.dumps(record).encode()
    elif run_id:
        url += '?runId=' + urllib.parse.quote(run_id, safe='')
    with urllib.request.urlopen(urllib.request.Request(url, data=data, headers=headers, method=method), timeout=15) as response:
        return json.load(response)


def deliver(record, transport=request, pause=time.sleep):
    """Read before retrying: a lost POST response may already have committed."""
    for attempt in range(3):
        try:
            if record in transport('GET', run_id=record['runId'])['runs']:
                return
            transport('POST', record=record)
            if record in transport('GET', run_id=record['runId'])['runs']:
                return
            raise RuntimeError('Run status readback mismatch')
        except urllib.error.HTTPError as error:
            if error.code not in (408, 429, 500, 502, 503, 504):
                raise
            if attempt == 2:
                raise
        except (OSError, TimeoutError):
            if attempt == 2:
                raise
        if attempt < 2:
            pause(attempt + 1)


def record_log(root, record):
    path = safe_path(root, 'run-log.jsonl')
    # Read only a bounded tail, even when migrating an older unbounded log.
    tail = b''
    if path.exists():
        with path.open('rb') as stream:
            stream.seek(max(0, path.stat().st_size - 16_000_000))
            if stream.tell():
                stream.readline()
            tail = stream.read()
    lines = [line for line in tail.splitlines() if line][-719:]
    encoded = json.dumps(record).encode()
    if not lines or lines[-1] != encoded:
        lines.append(encoded)
    temporary = safe_path(root, 'run-log.jsonl.tmp')
    with temporary.open('wb') as stream:
        stream.write(b'\n'.join(lines[-720:]) + b'\n')
        stream.flush()
        os.fsync(stream.fileno())
    temporary.replace(path)


def run(args, root=None, send=deliver, now=None):
    root = root or ROOT / '.sites-runtime'
    path = safe_path(root, 'active-monitor-run.json')
    now = now or datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    action = args[0]
    if action in ('start', 'reconcile'):
        if path.exists():
            old = json.loads(path.read_text())
            if old['status'] == 'running':
                if action == 'reconcile':
                    raise RuntimeError('Running research must be finished explicitly')
                old.update(status='failed', updatedAt=now, detail='Previous research run ended without a recorded outcome. Recovery is starting.')
                save(path, old)
            # Always replay terminal state, including a locally failed send.
            # Do not replace it with a new run until remote equality is verified.
            send(old)
            record_log(root, old)
        if action == 'reconcile':
            return
        if args[1] not in ('full', 'light', 'recovery'):
            raise ValueError('Invalid mode')
        record = {'runId': 'check-' + datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d-%H%M%S-%f'), 'startedAt': now, 'updatedAt': now, 'mode': args[1], 'status': 'running', 'detail': 'Checking both research watches and public sources.', 'channels': []}
        coverage = safe_path(root, 'run-coverage.json')
        if coverage.exists():
            coverage.unlink()
    elif action == 'finish':
        record = json.loads(path.read_text())
        if record['status'] != 'running':
            # Retry the exact terminal payload; never rewrite its timestamp.
            if record['status'] != args[1]:
                raise RuntimeError('Terminal outcome differs; reconcile saved state')
        else:
            if args[1] not in ('published', 'unchanged', 'failed'):
                raise ValueError('Invalid outcome')
            record.update(status=args[1], updatedAt=now, detail=args[2])
            if len(args) > 3:
                record['reportId'] = args[3]
            coverage = safe_path(root, 'run-coverage.json')
            if coverage.exists():
                record['channels'] = json.loads(coverage.read_text())
    else:
        raise ValueError('Invalid command')
    save(path, record)
    send(record)
    record_log(root, record)
    print(json.dumps({'ok': True, 'runId': record['runId'], 'status': record['status']}))


if __name__ == '__main__':
    try:
        lock = safe_path(ROOT / '.sites-runtime', 'monitor-command.lock')
        with lock.open('a') as stream:
            fcntl.flock(stream, fcntl.LOCK_EX | fcntl.LOCK_NB)
            if sys.argv[1:] == ['usage']:
                from watchdog_usage import collect
                collect(ROOT, request)
            else:
                run(sys.argv[1:])
                if sys.argv[1] == 'start':
                    try:
                        from watchdog_usage import collect
                        collect(ROOT, request)
                    except Exception as error:
                        # Accounting must never block the research lifecycle.
                        print('Usage measurement unavailable:', type(error).__name__, file=sys.stderr)
    except Exception as error:
        print('Monitoring publication failed:', type(error).__name__, file=sys.stderr)
        sys.exit(1)
