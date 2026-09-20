export type Kind = 'reset' | 'banked' | 'boost' | 'promo' | 'tease';
export type Signal = { id: string; kind: Kind; at: string; sourceUrl: string; account: string; text: string; scope: string; eligible: boolean; note: string };
export type Snapshot = { checkedAt: string; feedUpdatedAt: string | null; signals: Signal[] };
export type Payload = Snapshot & { state: 'fresh' | 'stale' | 'unavailable'; message?: string; persisted: boolean };
const DAY = 86400000;
export function normalizeFeed(input: unknown, now = Date.now()): Snapshot {
  if (!input || typeof input !== 'object' || !Array.isArray((input as {events?:unknown}).events)) throw new Error('Invalid feed');
  const data = input as {events: Record<string,unknown>[]; updatedAt?: string};
  const seen = new Set<string>();
  const signals: Signal[] = [];
  for (const row of data.events.slice(0,500)) {
    if (!row || typeof row !== 'object') continue;
    const at = typeof row.announcedAt === 'string' ? row.announcedAt : '';
    const kind = row.kind as Kind;
    if (row.provider !== 'codex' || !['reset','banked','boost','promo','tease'].includes(kind) || !Number.isFinite(Date.parse(at)) || Date.parse(at) > now + 300000) continue;
    let url: URL;
    try { url = new URL(String(row.sourceUrl)); } catch { continue; }
    if (url.protocol !== 'https:' || !['x.com','twitter.com','www.x.com'].includes(url.hostname) || !/^\/[a-zA-Z0-9_]+\/status\/\d+\/?$/.test(url.pathname)) continue;
    const id = url.pathname.split('/').filter(Boolean).at(-1)!;
    if (seen.has(id)) continue;
    seen.add(id);
    const text = String(row.summary ?? '').slice(0,2500);
    const targeted = /affected (time window|users)|who used one|some Plus and Business|referr/i.test(text);
    const unclear = (kind === 'reset' || kind === 'banked') && !/reset|usage|100%|limit|it is done/i.test(text);
    const scope = targeted ? 'Limited audience' : row.scope === 'global' ? 'Broad audience · feed classification' : 'Scope not independently checked';
    signals.push({id,kind,at:new Date(at).toISOString(),sourceUrl:url.href,account:'@'+url.pathname.split('/')[1],text,scope,eligible:!targeted && !unclear,note:targeted?'Targeted or replacement offer; excluded from the forecast.':unclear?'The excerpt is too vague to count; excluded from the forecast.':''});
  }
  if (data.events.length && !signals.length) throw new Error('No usable feed entries');
  return {checkedAt:new Date(now).toISOString(),feedUpdatedAt:data.updatedAt && Number.isFinite(Date.parse(data.updatedAt)) ? new Date(data.updatedAt).toISOString() : null,signals:signals.sort((a,b)=>Date.parse(b.at)-Date.parse(a.at))};
}
export function clusters(signals: Signal[], kind: 'reset'|'banked', now = Date.now()) {
  const rows = signals.filter(s=>s.kind===kind && s.eligible && Date.parse(s.at)<=now && Date.parse(s.at)>=now-180*DAY).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
  const groups: Signal[][] = [];
  for (const s of rows) { const last=groups.at(-1); if(last && Date.parse(s.at)-Date.parse(last[0].at)<DAY) last.push(s); else groups.push([s]); }
  return groups;
}
export function forecast(signals: Signal[], kind: 'reset'|'banked', horizon: number, now = Date.now()) {
  const groups=clusters(signals,kind,now);
  const dates=groups.map(g=>Date.parse(g[0].at));
  const gaps=dates.slice(1).map((d,i)=>(d-dates[i])/DAY);
  const age=dates.length ? (now-dates[dates.length-1])/DAY : null;
  const remaining=gaps.filter(g=>age!==null && g>age);
  const hits=remaining.filter(g=>g<=(age??0)+horizon).length;
  const pct=remaining.length>=3 ? Math.round(100*(hits+1)/(remaining.length+2)) : null;
  const sorted=[...gaps].sort((a,b)=>a-b);
  const median=sorted.length ? (sorted[Math.floor((sorted.length-1)/2)]+sorted[Math.floor(sorted.length/2)])/2 : null;
  return {pct,age,median,groups:groups.length,gaps,comparable:remaining.length,hits,last:groups.at(-1)?.at(-1)??null};
}
export function signalTitle(s: Signal) {
  if(s.note.startsWith('Targeted')) return s.kind==='banked' ? 'A banked reset for a limited group' : 'A reset offer for a limited group';
  if(s.note) return 'A signal without enough context';
  if(s.kind==='banked') return 'A banked reset enters the conversation';
  if(s.kind==='reset') return /propagat|all reset|it is done|have now reset|I.ve reset/i.test(s.text) ? 'Reset reported as rolled out' : 'An automatic reset signal';
  return s.kind==='boost'?'A change to usage limits':s.kind==='promo'?'A promotional signal':'A hint, not a promise';
}
