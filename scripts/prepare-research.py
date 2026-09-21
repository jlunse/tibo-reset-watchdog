#!/usr/bin/env python3
"""Bound the front-page changelog; drop only entries preserved in the live baseline.
Usage: prepare-research.py CANDIDATE LIVE_BASELINE OUTPUT
LIVE_BASELINE is the saved response from GET /api/watchdog.
"""
import copy, datetime, json, pathlib, re, sys
from urllib.parse import urlsplit


def require_staff_reassessment(candidate, baseline):
    """New or changed staff evidence must reach the assessments, including copies."""
    old = baseline.get('research', baseline)
    def post(source):
        url = urlsplit(source.get('url', ''))
        if url.hostname in ('x.com', 'twitter.com') and re.fullmatch(r'/(thsottiaux|reach_vb)/status/\d+/?', url.path):
            return url.path.rstrip('/')
    def evidence(source):
        return tuple(source.get(key) for key in ('title', 'tier', 'access', 'note', 'provenance', 'importNote'))
    previous = {post(s): s for s in old.get('sources', []) if post(s)}
    changed = [s for s in candidate.get('sources', []) if post(s) and
               (post(s) not in previous or evidence(s) != evidence(previous[post(s)]))]
    if not changed:
        return
    stamp = lambda value: datetime.datetime.fromisoformat(value.replace('Z', '+00:00'))
    if not any(stamp(c['at']) > stamp(old['checkedAt']) for c in candidate.get('analysis', {}).get('changes', [])):
        raise ValueError('Changed staff evidence requires a public update explanation')
    review = candidate.get('analysis', {}).get('review', {})
    if (review.get('status') == 'incomplete' and
        stamp(old['checkedAt']) < stamp(review['at']) <= stamp(candidate['checkedAt']) and
        all(any(s['id'] in item for item in review.get('considered', [])) for s in changed)):
        return  # Publish pending evidence visibly; do not invent completed assessments.
    outlooks = candidate.get('analysis', {}).get('outlooks', [])
    prior = {o['kind']: o for o in old.get('analysis', {}).get('outlooks', [])}
    if {o['kind'] for o in outlooks} != {'reset', 'banked', 'any'}:
        raise ValueError('Changed staff evidence requires all three outlook assessments')
    for source in changed:
        for outlook in outlooks:
            if (source['id'] not in outlook.get('sourceIds', []) or
                stamp(outlook['asOf']) < stamp(source['checkedAt']) or
                stamp(outlook['asOf']) > stamp(candidate['checkedAt']) or
                (outlook['kind'] in prior and stamp(outlook['asOf']) <= stamp(prior[outlook['kind']]['asOf']))):
                raise ValueError('Changed staff evidence requires a fresh, source-linked assessment for every outlook')


def prepare(candidate, baseline):
    require_staff_reassessment(candidate, baseline)
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

