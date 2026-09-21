import type { Research } from '@/lib/research';

type Changes = NonNullable<Research['analysis']>['changes'];

export function ExplanationText({ text }: { text: string }) {
  return <div className="explanation-text">{text.split(/\n\s*\n/).filter(part => part.trim()).map((part, index) => <p key={index}>{part}</p>)}</div>;
}

export function UpdateExplanation({ changes, fresh }: { changes: Changes; fresh: boolean }) {
  const latest = [...changes].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0];
  if (!latest) return null;
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Stockholm', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  }).format(new Date(latest.at));

  return <section className="update-explanation" aria-labelledby="update-explanation-title">
    <div className="eyebrow">THE LATEST UPDATE, EXPLAINED</div>
    <h2 id="update-explanation-title">{latest.title}</h2>
    <p className="fine"><time dateTime={latest.at}>{time}</time></p>
    {!fresh && <p className="notice">Saved explanation · a fresh check is needed.</p>}
    <ExplanationText text={latest.detail}/>
    <a className="earlier-explanations" href="#updates">Earlier updates and explanations ↓</a>
  </section>;
}
