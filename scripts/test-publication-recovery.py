import copy, contextlib, importlib.util, io, json, pathlib, subprocess, sys, tempfile, unittest, urllib.error
ROOT = pathlib.Path(__file__).resolve().parent

def module(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / (name + '.py'))
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded

monitor, prepare = module('monitor-run'), module('prepare-research')

class RecoveryTests(unittest.TestCase):
    def test_31st_change_retains_unpublished_and_preserves_baseline(self):
        old = [{'at': f'2026-09-19T00:{i:02}:00Z', 'title': str(i), 'detail': str(i)} for i in range(30)]
        new = {'at': '2026-09-20T00:00:00Z', 'title': 'New', 'detail': 'New'}
        base = {'analysis': {'changes': old}}
        result = prepare.prepare({'analysis': {'changes': old + [new]}}, base)
        self.assertEqual(len(result['analysis']['changes']), 30)
        self.assertEqual(result['analysis']['changes'][0], new)
        self.assertEqual(len(base['analysis']['changes']), 30)
        with self.assertRaises(ValueError):
            prepare.prepare({'analysis': {'changes': [new]}}, base)
        with self.assertRaises(ValueError):
            prepare.prepare({'analysis': {'changes': old + [{**new, 'at': '2025-01-01T00:00:00Z'}]}}, base)

    def staff_candidate(self):
        before, after = '2026-09-21T17:04:14Z', '2026-09-21T18:02:50Z'
        base = {'checkedAt': before, 'sources': [], 'analysis': {'changes': [], 'outlooks': [
            {'kind': kind, 'asOf': before, 'sourceIds': []} for kind in ('reset', 'banked', 'any')]}}
        candidate = copy.deepcopy(base)
        candidate['checkedAt'] = after
        candidate['sources'] = [{'id': 'timing-hint', 'url': 'https://x.com/thsottiaux/status/2101920928070562029',
            'tier': 'COMMUNITY', 'access': 'unavailable', 'note': '3am on a tuesday', 'checkedAt': after}]
        candidate['analysis']['changes'] = [{'at': after, 'title': 'Timing hint', 'detail': 'Pending context.'}]
        return base, candidate

    def test_imported_staff_hint_cannot_leave_outlooks_stale(self):
        base, candidate = self.staff_candidate()
        with self.assertRaisesRegex(ValueError, 'fresh, source-linked'):
            prepare.prepare(candidate, base)
        for outlook in candidate['analysis']['outlooks']:
            outlook.update(asOf=candidate['checkedAt'], sourceIds=['timing-hint'])
        self.assertEqual(prepare.prepare(candidate, base), candidate)
        candidate['analysis']['outlooks'][0]['sourceIds'] = []
        with self.assertRaises(ValueError): prepare.prepare(candidate, base)

    def test_changed_staff_context_requires_reassessment_but_recheck_does_not(self):
        base, candidate = self.staff_candidate()
        base['sources'] = copy.deepcopy(candidate['sources'])
        base['sources'][0]['checkedAt'] = base['checkedAt']
        self.assertEqual(prepare.prepare(candidate, base), candidate)
        candidate['sources'][0]['note'] = 'Context now explicitly mentions a grant.'
        with self.assertRaises(ValueError): prepare.prepare(candidate, base)

    def test_incomplete_staff_assessment_preserves_pending_signal(self):
        base, candidate = self.staff_candidate()
        candidate['analysis']['review'] = {'at': candidate['checkedAt'], 'status': 'incomplete',
            'considered': ['timing-hint remains pending'], 'reason': 'Assessment interrupted.'}
        self.assertEqual(prepare.prepare(candidate, base), candidate)
        candidate['analysis']['review']['considered'] = ['Something else']
        with self.assertRaises(ValueError): prepare.prepare(candidate, base)

    def test_staff_guard_requires_public_explanation_and_handles_other_account(self):
        base, candidate = self.staff_candidate()
        candidate['sources'][0]['url'] = 'https://twitter.com/reach_vb/status/123?ref=copy'
        for outlook in candidate['analysis']['outlooks']:
            outlook.update(asOf=candidate['checkedAt'], sourceIds=['timing-hint'])
        self.assertEqual(prepare.prepare(candidate, base), candidate)
        candidate['analysis']['changes'] = []
        with self.assertRaisesRegex(ValueError, 'public update'): prepare.prepare(candidate, base)

    def test_publisher_rejects_unassessed_hint_before_network_or_credential_read(self):
        base, candidate = self.staff_candidate()
        base['runId'] = 'prior-report'
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            (root/'candidate.json').write_text(json.dumps(candidate))
            (root/'baseline.json').write_text(json.dumps(base))
            result = subprocess.run([sys.executable, str(ROOT/'submit-research.py'),
                str(root/'candidate.json'), str(root/'baseline.json')], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('fresh, source-linked', result.stderr)
            self.assertNotIn('Publish failed', result.stderr)

    def test_lost_post_response_is_read_back_not_reposted(self):
        saved, posts = [], []
        def transport(method, record=None, run_id=None):
            if method == 'GET': return {'runs': saved}
            posts.append(record); saved.append(record)
            raise urllib.error.URLError('connection lost after commit')
        monitor.deliver({'runId': 'check-example'}, transport, lambda _: None)
        self.assertEqual(len(posts), 1)

    def test_failure_before_post_is_bounded(self):
        calls=[]
        def transport(*args, **kwargs):
            calls.append(args); raise urllib.error.URLError('offline')
        with self.assertRaises(urllib.error.URLError):
            monitor.deliver({'runId': 'check-example'}, transport, lambda _: None)
        self.assertEqual(len(calls), 3)

    def test_permanent_conflict_is_not_retried(self):
        calls=[]
        def transport(method, **kwargs):
            calls.append(method)
            if method=='GET': return {'runs': []}
            raise urllib.error.HTTPError('test',409,'Conflict',{},None)
        with self.assertRaises(urllib.error.HTTPError):
            monitor.deliver({'runId':'check-example'},transport,lambda _:None)
        self.assertEqual(calls,['GET','POST'])

    def test_unacknowledged_terminal_is_reconciled_before_next_start(self):
        with tempfile.TemporaryDirectory() as directory, contextlib.redirect_stdout(io.StringIO()):
            root=pathlib.Path(directory)
            running={'runId':'check-old','startedAt':'2026-09-20T19:00:00Z','updatedAt':'2026-09-20T19:00:00Z','mode':'full','status':'running','detail':'Checking','channels':[]}
            monitor.save(root/'active-monitor-run.json',running)
            def fail(_): raise OSError('offline')
            with self.assertRaises(OSError): monitor.run(['finish','failed','Blocked'],root,fail,'2026-09-20T19:04:00Z')
            terminal=json.loads((root/'active-monitor-run.json').read_text())
            self.assertEqual(terminal['status'],'failed')
            with self.assertRaises(OSError): monitor.run(['start','light'],root,fail,'2026-09-20T20:00:00Z')
            self.assertEqual(json.loads((root/'active-monitor-run.json').read_text()),terminal)
            sent=[]
            monitor.run(['start','light'],root,sent.append,'2026-09-20T20:00:00Z')
            self.assertEqual(sent[0],terminal)
            self.assertEqual(sent[1]['status'],'running')

    def test_log_bound_and_symlink_protection(self):
        with tempfile.TemporaryDirectory() as directory:
            root=pathlib.Path(directory)
            (root/'run-log.jsonl').write_text(('{}\n')*900)
            monitor.record_log(root,{'runId':'latest'})
            self.assertEqual(len((root/'run-log.jsonl').read_text().splitlines()),720)
            unrelated=root/'unrelated';unrelated.write_text('keep')
            (root/'run-log.jsonl').unlink();(root/'run-log.jsonl').symlink_to(unrelated)
            with self.assertRaises(RuntimeError):monitor.record_log(root,{'runId':'latest'})
            self.assertEqual(unrelated.read_text(),'keep')

if __name__=='__main__': unittest.main()

