"""Aggregate completed scheduled turns; no transcripts or account limits leave the host."""
import copy
import datetime
import json
import pathlib
import tomllib
import xml.etree.ElementTree as ET

FIELDS = ('input_tokens', 'cached_input_tokens', 'output_tokens', 'total_tokens')
PUBLIC_FIELDS = ('inputTokens', 'cachedInputTokens', 'outputTokens', 'totalTokens')


def timestamp(value):
    return datetime.datetime.fromisoformat(value.replace('Z', '+00:00'))


def is_scheduled(text, automation_id):
    try:
        heartbeat = ET.fromstring(text.strip())
        return heartbeat.tag == 'heartbeat' and heartbeat.findtext('automation_id') == automation_id
    except ET.ParseError:
        return False


def completed_turns(path, automation_id):
    previous = None
    current = None
    with path.open() as stream:
        for line in stream:
            try:
                event = json.loads(line)
            except ValueError:
                # A partially written final line must not complete a turn.
                continue
            payload = event.get('payload', {})
            kind = payload.get('type') if event.get('type') == 'event_msg' else None
            if kind == 'task_started':
                current = {'id': payload.get('turn_id'), 'start': event['timestamp'], 'baseline': previous, 'last': None, 'users': [], 'invalid': False}
            elif event.get('type') == 'response_item' and payload.get('role') == 'user' and current:
                text = '\n'.join(item.get('text', '') for item in payload.get('content', []) if isinstance(item, dict))
                current['users'].append(is_scheduled(text, automation_id))
            elif kind == 'token_count':
                total = (payload.get('info') or {}).get('total_token_usage')
                if total and all(isinstance(total.get(k), int) and not isinstance(total[k], bool) and total[k] >= 0 for k in FIELDS):
                    if current:
                        if previous and any(total[k] < previous[k] for k in FIELDS):
                            current['invalid'] = True
                        current['last'] = total
                    previous = total
            elif kind == 'task_complete' and current:
                if payload.get('turn_id') != current['id']:
                    continue
                if current['users'] == [True]:
                    delta = None
                    if current['baseline'] and current['last'] and not current['invalid']:
                        candidate = {public: current['last'][raw] - current['baseline'][raw] for raw, public in zip(FIELDS, PUBLIC_FIELDS)}
                        if all(x >= 0 for x in candidate.values()) and candidate['cachedInputTokens'] <= candidate['inputTokens'] and candidate['totalTokens'] == candidate['inputTokens'] + candidate['outputTokens']:
                            delta = candidate
                    yield {'id': current['id'], 'start': current['start'], 'end': event['timestamp'], 'tokens': delta}
                current = None


def accumulate(paths, automation_id, since, baseline, now):
    result = copy.deepcopy(baseline) if baseline else dict(since=since, through=since, updatedAt=now, measuredRuns=0, unmeasuredRuns=0, inputTokens=0, cachedInputTokens=0, outputTokens=0, totalTokens=0)
    if result['since'] != since:
        raise ValueError('Measurement start differs from published total')
    turns = {}
    for path in paths:
        for turn in completed_turns(path, automation_id):
            if timestamp(turn['start']) < timestamp(since) or timestamp(turn['end']) <= timestamp(result['through']):
                continue
            if turn['id'] in turns and turns[turn['id']] != turn:
                raise ValueError('Conflicting duplicate turn')
            turns[turn['id']] = turn
    for turn in sorted(turns.values(), key=lambda item: timestamp(item['end'])):
        if timestamp(turn['end']) > timestamp(now):
            raise ValueError('Completion is in the future')
        result['through'] = turn['end']
        if turn['tokens'] is None:
            result['unmeasuredRuns'] += 1
        else:
            result['measuredRuns'] += 1
            for key in PUBLIC_FIELDS:
                result[key] += turn['tokens'][key]
    if turns or not baseline:
        result['updatedAt'] = now
    return result


def collect(root, transport):
    config_path = root / '.sites-runtime/usage-config.json'
    if not config_path.exists():
        return
    if config_path.is_symlink():
        raise ValueError('Usage configuration must not be a symlink')
    config = json.loads(config_path.read_text())
    automation_path = pathlib.Path(config['automationFile'])
    automation = tomllib.loads(automation_path.read_text())
    thread = automation['target_thread_id']
    sessions = pathlib.Path(config['sessionsDirectory'])
    paths = sorted(sessions.glob('????/??/??/rollout-*' + thread + '*.jsonl'))
    if not paths:
        raise ValueError('Scheduled-run telemetry unavailable')
    before = transport('GET').get('usage')
    now = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')
    after = accumulate(paths, automation['id'], config['since'], before, now)
    if after == before:
        return
    transport('POST', {'kind': 'usage', 'baselineUpdatedAt': before['updatedAt'] if before else None, 'usage': after})
    if transport('GET').get('usage') != after:
        raise RuntimeError('Usage readback mismatch')
    print(json.dumps({'usageMeasuredRuns': after['measuredRuns'], 'usageUnmeasuredRuns': after['unmeasuredRuns'], 'usageTotalTokens': after['totalTokens']}))
