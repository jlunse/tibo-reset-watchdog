"""Raw Codex-shaped events through the production usage collector."""
import json
import pathlib
import tempfile
import unittest
from watchdog_usage import accumulate

SINCE = '2026-09-21T00:00:00Z'
NOW = '2026-09-21T12:00:00Z'

def event(kind, payload, minute):
    return {'timestamp': f'2026-09-21T01:{minute:02}:00Z', 'type': kind, 'payload': payload}

def tokens(value, minute):
    return event('event_msg', {'type': 'token_count', 'info': {'total_token_usage': {'input_tokens': value, 'cached_input_tokens': value // 2, 'output_tokens': value // 10, 'total_tokens': value + value // 10}}}, minute)

def turn(identifier, minute, value, scheduled=True, finish=True):
    text = '<heartbeat><automation_id>test-watch</automation_id><instructions>Read public sources.</instructions></heartbeat>' if scheduled else 'Please develop the website.'
    rows = [event('event_msg', {'type': 'task_started', 'turn_id': identifier}, minute), event('response_item', {'role': 'user', 'content': [{'type': 'input_text', 'text': text}]}, minute), tokens(value, minute + 1)]
    if finish:
        rows.append(event('event_msg', {'type': 'task_complete', 'turn_id': identifier}, minute + 2))
    return rows

class UsageTests(unittest.TestCase):
    def collect(self, rows, before=None, duplicate=False):
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / 'events.jsonl'
            path.write_text('\n'.join(json.dumps(row) for row in rows) + '\n')
            return accumulate([path, path] if duplicate else [path], 'test-watch', SINCE, before, NOW)

    def test_manual_exclusion_cache_and_incomplete_turn(self):
        rows = [tokens(100, 0)] + turn('manual', 1, 200, False) + turn('scheduled', 4, 300) + turn('running', 7, 400, finish=False)
        result = self.collect(rows, duplicate=True)
        self.assertEqual(result['measuredRuns'], 1)
        self.assertEqual(result['inputTokens'], 100)
        self.assertEqual(result['cachedInputTokens'], 50)
        self.assertEqual(result['outputTokens'], 10)
        self.assertEqual(result['totalTokens'], 110)
        self.assertEqual(self.collect(rows, result), result)

    def test_incremental_collection_and_lost_response_replay(self):
        rows = [tokens(100, 0)] + turn('one', 1, 200)
        first = self.collect(rows)
        rows += turn('manual', 4, 300, False) + turn('two', 7, 400)
        result = self.collect(rows, first)
        self.assertEqual(result['measuredRuns'], 2)
        self.assertEqual(result['totalTokens'], 220)
        self.assertEqual(self.collect(rows, result), result)

    def test_missing_baseline_and_counter_reset_are_not_zero_usage(self):
        result = self.collect(turn('first', 1, 200) + turn('reset', 4, 100))
        self.assertEqual(result['measuredRuns'], 0)
        self.assertEqual(result['unmeasuredRuns'], 2)
        self.assertEqual(result['totalTokens'], 0)

    def test_manual_steering_excludes_mixed_turn(self):
        rows = [tokens(100, 0)] + turn('mixed', 1, 200, finish=False)
        rows += [event('response_item', {'role': 'user', 'content': [{'text': 'Also change the site.'}]}, 3), event('event_msg', {'type': 'task_complete', 'turn_id': 'mixed'}, 4)]
        self.assertEqual(self.collect(rows)['measuredRuns'], 0)

    def test_other_automation_excluded(self):
        rows = [tokens(100, 0)] + turn('other', 1, 200)
        rows[2]['payload']['content'][0]['text'] = '<heartbeat><automation_id>other-watch</automation_id></heartbeat>'
        self.assertEqual(self.collect(rows)['measuredRuns'], 0)

if __name__ == '__main__':
    unittest.main()
