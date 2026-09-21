import contextlib, importlib.util, io, json, pathlib, tempfile, unittest, urllib.error
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
