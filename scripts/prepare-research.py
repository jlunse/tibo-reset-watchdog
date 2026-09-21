#!/usr/bin/env python3
"""Bound the front-page changelog; drop only entries preserved in the live baseline.
Usage: prepare-research.py CANDIDATE LIVE_BASELINE OUTPUT
LIVE_BASELINE is the saved response from GET /api/watchdog.
"""
import copy, datetime, json, pathlib, sys


def prepare(candidate, baseline):
    result = copy.deepcopy(candidate)
    old = baseline.get('research', baseline)
    previous = old.get('analysis', {}).get('changes', [])
    entries = result.get('analysis', {}).get('changes', [])
    key = lambda entry: json.dumps(entry, sort_keys=True)
    # Keep every previous change until it ages out of the rolling front-page list.
    if not {key(x) for x in previous}.issubset({key(x) for x in entries}):
        raise ValueError('Candidate omits prior changes; merge live history before preparing')
    entries = sorted(entries, key=lambda item: datetime.datetime.fromisoformat(item['at'].replace('Z', '+00:00')), reverse=True)
    if any(key(entry) not in {key(x) for x in previous} for entry in entries[30:]):
        raise ValueError('More new changes than fit; do not silently discard unpublished history')
    if 'analysis' in result:
        result['analysis']['changes'] = entries[:30]
    return result


if __name__ == '__main__':
    source, baseline, output = map(pathlib.Path, sys.argv[1:])
    result = prepare(json.loads(source.read_text()), json.loads(baseline.read_text()))
    output.write_text(json.dumps(result, indent=2) + '\n')
    print('Prepared report; older changes remain in the report archive')
