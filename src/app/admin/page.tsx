'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Market } from '@/lib/types';
import { useMe } from '@/lib/session';
import { birr, date, num, pct } from '@/lib/format';
import { Badge, Button, Card, Input, Skeleton, Tabs, Textarea } from '@/components/ui/primitives';
import { KPI, Table, Td, useAction } from '@/components/admin/shared';
import { CreateMarket } from '@/components/admin/create-market';
import { StatusBadge } from '@/components/status-badge';

type Section = 'overview' | 'markets' | 'risk' | 'resolution' | 'users' | 'payments' | 'sports' | 'activity' | 'system';
const SECTIONS: { value: Section; label: string }[] = [
  { value: 'overview', label: 'Overview' }, { value: 'markets', label: 'Markets' }, { value: 'risk', label: 'Risk' }, { value: 'resolution', label: 'Resolution' },
  { value: 'users', label: 'Users' }, { value: 'payments', label: 'Payments' }, { value: 'sports', label: 'Sports' }, { value: 'activity', label: 'Activity' }, { value: 'system', label: 'System' },
];

function Admin() {
  const { me, isStaff, loading, requires2fa } = useMe();
  const sp = useSearchParams();
  const router = useRouter();
  const section = (sp.get('s') as Section) ?? 'overview';
  if (loading) return <Skeleton className="h-64" />;
  if (!me || !isStaff) return <div className="py-20 text-center text-muted">Staff access only.</div>;
  return (
    <div className="fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <div className="flex gap-1">{me.roles.filter((r) => r !== 'USER').map((r) => <Badge key={r} tone="brand">{r}</Badge>)}</div>
      </div>
      {requires2fa && <p className="mt-3 rounded-xl bg-no-soft p-3 text-sm text-no">Two-factor authentication is required for admin actions. <Link href="/settings" className="underline">Verify 2FA</Link>.</p>}
      <Tabs className="mt-4" value={section} onChange={(s) => router.replace(`/admin?s=${s}`)} items={SECTIONS} />
      <div className="mt-5">
        {section === 'overview' && <Overview />}
        {section === 'markets' && <Markets />}
        {section === 'risk' && <Risk />}
        {section === 'resolution' && <Resolution />}
        {section === 'users' && <Users />}
        {section === 'payments' && <Payments />}
        {section === 'sports' && <Sports />}
        {section === 'activity' && <Activity />}
        {section === 'system' && <System />}
      </div>
    </div>
  );
}

type OverviewT = {
  users: number; markets: Record<string, number>; totalVolume: string; trades24h: number; volume24h: string;
  queues: { pendingProposals: number; openDisputes: number; pendingWithdrawals: number };
  funds: { customerFunds: string; companyReserve: string; marketEscrow: string; feeRevenue: string; promotionsIssued: string };
  risk: { escrow: string; collateral: string; worstCaseLoss: string; currentExposure: string };
  clock: { now: string; offsetMs: number; demoMode: boolean };
};

function Overview() {
  const { data: o } = useSWR<OverviewT>('/admin/overview', { refreshInterval: 10000 });
  if (!o) return <Skeleton className="h-64" />;
  return (
    <div className="space-y-6" data-testid="admin-overview">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KPI label="Users" value={num(o.users, 0)} />
        <KPI label="Open markets" value={o.markets.OPEN ?? 0} />
        <KPI label="Volume (all time)" value={birr(o.totalVolume, true)} />
        <KPI label="Trades 24h" value={`${o.trades24h} · ${birr(o.volume24h, true)}`} />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium text-muted">Funds (segregated ledger accounts)</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <KPI label="Customer funds" value={birr(o.funds.customerFunds, true)} />
          <KPI label="Company liquidity reserve" value={birr(o.funds.companyReserve, true)} />
          <KPI label="Market escrow" value={birr(o.funds.marketEscrow, true)} />
          <KPI label="Fee revenue" value={birr(o.funds.feeRevenue)} tone="yes" />
          <KPI label="Bonuses issued" value={birr(o.funds.promotionsIssued, true)} />
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium text-muted">Market-maker risk</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KPI label="Collateral deployed" value={birr(o.risk.collateral, true)} />
          <KPI label="Worst-case loss (bound)" value={birr(o.risk.worstCaseLoss, true)} tone="gold" />
          <KPI label="Current exposure" value={birr(o.risk.currentExposure)} tone="no" />
          <KPI label="Escrow held" value={birr(o.risk.escrow, true)} />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <QueueCard label="Proposals to review" n={o.queues.pendingProposals} href="/admin?s=resolution" />
        <QueueCard label="Open disputes" n={o.queues.openDisputes} href="/admin?s=resolution" />
        <QueueCard label="Withdrawals to approve" n={o.queues.pendingWithdrawals} href="/admin?s=payments" />
      </div>
      <p className="text-xs text-muted">Platform clock: {date(o.clock.now)} {o.clock.offsetMs > 0 && <Badge tone="gold">simulated +{(o.clock.offsetMs / 3600e3).toFixed(1)}h</Badge>}</p>
    </div>
  );
}
function QueueCard({ label, n, href }: { label: string; n: number; href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 hover:shadow-soft">
      <span className="text-sm">{label}</span>
      <span className={`tabular grid h-7 min-w-7 place-items-center rounded-full px-2 text-sm font-semibold ${n ? 'bg-no text-white' : 'bg-surface-2 text-muted'}`}>{n}</span>
    </Link>
  );
}

function Markets() {
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const { data } = useSWR<Market[]>(`/admin/markets${status ? `?status=${status}` : ''}`);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs value={status} onChange={setStatus} items={[{ value: '', label: 'All' }, ...['DRAFT', 'SCHEDULED', 'OPEN', 'CLOSED', 'AWAITING_RESOLUTION', 'DISPUTED', 'RESOLVED', 'CANCELLED'].map((s) => ({ value: s, label: s.replace('_', ' ').toLowerCase() }))]} />
        <Button onClick={() => setCreating((c) => !c)} data-testid="new-market">{creating ? 'Close' : 'New market'}</Button>
      </div>
      {creating && <CreateMarket onDone={() => setCreating(false)} />}
      <Table head={['Market', 'Status', 'YES', 'Volume', 'Closes', '']}>
        {data?.map((m) => (
          <tr key={m.id}>
            <Td className="max-w-md"><div className="line-clamp-2 font-medium">{m.question}</div>{m.isDemo && <Badge className="mt-1">demo</Badge>}</Td>
            <Td><StatusBadge status={m.status} halted={m.tradingHalted} /></Td>
            <Td>{pct(m.yesPrice, 1)}</Td>
            <Td>{birr(m.volume, true)}</Td>
            <Td className="whitespace-nowrap text-muted">{date(m.closesAt)}</Td>
            <Td><Link href={`/admin/markets/${m.id}`} className="text-brand">Manage →</Link></Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

type RiskRow = { id: string; slug: string; question: string; status: string; tradingHalted: boolean; volume: string; yesPrice: string; liquidityB: string; subsidy: string; maxLossBound: string; escrow: string; payoutIfYes: string; payoutIfNo: string; operatorPnlIfYes: string; operatorPnlIfNo: string; currentExposure: string; reserveCoverage: string };
function Risk() {
  const { data } = useSWR<{ markets: RiskRow[]; totals: Record<string, string> }>('/admin/risk', { refreshInterval: 10000 });
  if (!data) return <Skeleton className="h-64" />;
  return (
    <div className="space-y-4" data-testid="admin-risk">
      <p className="text-sm text-muted">For each funded market: escrow = collateral + net trader cash. “P&L if YES/NO” is what the operator keeps (or loses) under each outcome. Exposure can never exceed the funded bound.</p>
      <Table head={['Market', 'b', 'Collateral', 'Escrow', 'Pays YES', 'Pays NO', 'P&L if YES', 'P&L if NO', 'Exposure', 'Bound']}>
        {data.markets.map((r) => (
          <tr key={r.id}>
            <Td className="max-w-xs"><Link href={`/admin/markets/${r.id}`} className="line-clamp-2 hover:underline">{r.question}</Link></Td>
            <Td>{num(r.liquidityB, 0)}</Td><Td>{num(r.subsidy)}</Td><Td>{num(r.escrow)}</Td>
            <Td>{num(r.payoutIfYes)}</Td><Td>{num(r.payoutIfNo)}</Td>
            <Td className={Number(r.operatorPnlIfYes) < 0 ? 'text-no' : 'text-yes'}>{num(r.operatorPnlIfYes)}</Td>
            <Td className={Number(r.operatorPnlIfNo) < 0 ? 'text-no' : 'text-yes'}>{num(r.operatorPnlIfNo)}</Td>
            <Td className="font-medium">{num(r.currentExposure)}</Td><Td className="text-muted">{num(r.maxLossBound)}</Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

type ProposalRow = { id: string; outcome: string; status: string; source: string; evidenceUrl: string; evidenceNotes: string; proposedById: string | null; disputeEndsAt: string | null; createdAt: string; market: { id: string; slug: string; question: string; status: string }; disputes: { id: string; status: string; reason: string; user: { username: string } }[] };
function Resolution() {
  const [filter, setFilter] = useState('PENDING_REVIEW');
  const { data, mutate } = useSWR<ProposalRow[]>(`/admin/proposals${filter ? `?status=${filter}` : ''}`);
  const { busy, run, post } = useAction();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const note = (id: string) => notes[id] || 'Evidence checked against the official source';
  return (
    <div className="space-y-4">
      <Tabs value={filter} onChange={setFilter} items={[{ value: 'PENDING_REVIEW', label: 'To review' }, { value: 'CONFIRMED', label: 'In dispute window' }, { value: 'DISPUTED', label: 'Disputed' }, { value: 'FINALIZED', label: 'Finalized' }, { value: '', label: 'All' }]} />
      {!data?.length && <p className="text-sm text-muted">Nothing here. Markets awaiting a result are proposed from their Manage page.</p>}
      {data?.map((p) => (
        <Card key={p.id} className="space-y-3 p-4" data-testid="proposal-card">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <Link href={`/admin/markets/${p.market.id}`} className="font-medium hover:underline">{p.market.question}</Link>
            <div className="flex gap-1.5"><Badge tone={p.outcome === 'YES' ? 'yes' : p.outcome === 'NO' ? 'no' : 'neutral'}>{p.outcome}</Badge><Badge>{p.status.replace('_', ' ').toLowerCase()}</Badge><Badge>{p.source.toLowerCase()}</Badge></div>
          </div>
          <p className="text-sm text-muted">{p.evidenceNotes} <span className="break-all">({p.evidenceUrl})</span></p>
          {p.disputeEndsAt && <p className="text-xs text-muted">Dispute window ends {date(p.disputeEndsAt)}</p>}
          {p.disputes.map((d) => (
            <div key={d.id} className="rounded-xl bg-surface-2 p-3 text-sm">
              <div><b>@{d.user.username}</b> disputes: {d.reason} <Badge>{d.status.toLowerCase()}</Badge></div>
              {d.status === 'OPEN' && (
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="danger" loading={busy === d.id + 'u'} onClick={() => run(d.id + 'u', () => post(`/admin/disputes/${d.id}/resolve`, { uphold: true, note: note(p.id) }), 'Dispute upheld — proposal overturned').then(() => mutate())}>Uphold (overturn)</Button>
                  <Button size="sm" variant="secondary" loading={busy === d.id + 'r'} onClick={() => run(d.id + 'r', () => post(`/admin/disputes/${d.id}/resolve`, { uphold: false, note: note(p.id) }), 'Dispute rejected').then(() => mutate())}>Reject dispute</Button>
                </div>
              )}
            </div>
          ))}
          {['PENDING_REVIEW', 'CONFIRMED', 'DISPUTED'].includes(p.status) && (
            <Textarea placeholder="Reviewer note" className="min-h-0" rows={2} value={notes[p.id] ?? ''} onChange={(e) => setNotes((n) => ({ ...n, [p.id]: e.target.value }))} />
          )}
          <div className="flex flex-wrap gap-2">
            {p.status === 'PENDING_REVIEW' && (
              <>
                <Button size="sm" variant="yes" data-testid="approve-proposal" loading={busy === p.id + 'a'} onClick={() => run(p.id + 'a', () => post(`/admin/proposals/${p.id}/review`, { approve: true, note: note(p.id) }), 'Confirmed — dispute window started').then(() => mutate())}>Approve</Button>
                <Button size="sm" variant="danger" loading={busy === p.id + 'x'} onClick={() => run(p.id + 'x', () => post(`/admin/proposals/${p.id}/review`, { approve: false, note: note(p.id) }), 'Rejected').then(() => mutate())}>Reject</Button>
              </>
            )}
            {p.status === 'CONFIRMED' && (
              <Button size="sm" data-testid="finalize-proposal" loading={busy === p.id + 'f'} onClick={() => run(p.id + 'f', () => post(`/admin/proposals/${p.id}/finalize`), 'Finalized and settled').then(() => mutate())}>Finalize & settle</Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

type UserRow = { id: string; email: string; username: string; roles: string[]; country: string; isSuspended: boolean; balance: string; trades: number; createdAt: string };
function Users() {
  const [q, setQ] = useState('');
  const { data, mutate } = useSWR<UserRow[]>(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  const { run, post } = useAction();
  const [adj, setAdj] = useState<{ id: string; amount: string; reason: string } | null>(null);
  return (
    <div className="space-y-4">
      <Input placeholder="Search email or username" value={q} onChange={(e) => setQ(e.target.value)} />
      {adj && (
        <Card className="space-y-2 p-4">
          <div className="text-sm font-medium">Balance adjustment (audited — reason required)</div>
          <div className="grid gap-2 md:grid-cols-[160px_1fr_auto]">
            <Input placeholder="±amount" value={adj.amount} onChange={(e) => setAdj({ ...adj, amount: e.target.value })} />
            <Input placeholder="Reason (min 10 chars)" value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} />
            <Button onClick={() => run('adj', () => post(`/admin/users/${adj.id}/adjust`, { amount: adj.amount, reason: adj.reason }), 'Adjusted').then((r) => { if (r) { setAdj(null); mutate(); } })}>Apply</Button>
          </div>
        </Card>
      )}
      <Table head={['User', 'Roles', 'Country', 'Balance', 'Trades', 'Joined', '']}>
        {data?.map((u) => (
          <tr key={u.id}>
            <Td><div className="font-medium">@{u.username}</div><div className="text-xs text-muted">{u.email}</div></Td>
            <Td>{u.roles.filter((r) => r !== 'USER').join(', ') || '—'}{u.isSuspended && <Badge tone="no" className="ml-1">suspended</Badge>}</Td>
            <Td>{u.country}</Td><Td>{birr(u.balance)}</Td><Td>{u.trades}</Td><Td className="text-muted">{date(u.createdAt)}</Td>
            <Td className="whitespace-nowrap">
              <button className="mr-3 text-brand" onClick={() => setAdj({ id: u.id, amount: '', reason: '' })}>Adjust</button>
              <button className="text-muted hover:text-no" onClick={() => { const reason = prompt(u.isSuspended ? 'Reason to unsuspend' : 'Reason to suspend'); if (reason) run('s', () => post(`/admin/users/${u.id}/suspend`, { suspended: !u.isSuspended, reason }), 'Updated').then(() => mutate()); }}>{u.isSuspended ? 'Unsuspend' : 'Suspend'}</button>
            </Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function Payments() {
  const [status, setStatus] = useState('REQUIRES_APPROVAL');
  const { data, mutate } = useSWR<{ id: string; username: string; kind: string; amount: string; status: string; riskFlags: string[]; createdAt: string }[]>(`/admin/payments${status ? `?status=${status}` : ''}`);
  const { run, post } = useAction();
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Simulated payments only. Real-money providers are disabled and require licensing and an independent review.</p>
      <Tabs value={status} onChange={setStatus} items={[{ value: 'REQUIRES_APPROVAL', label: 'Awaiting approval' }, { value: 'COMPLETED', label: 'Completed' }, { value: '', label: 'All' }]} />
      <Table head={['User', 'Type', 'Amount', 'Status', 'Risk flags', 'Created', '']}>
        {data?.map((p) => (
          <tr key={p.id}>
            <Td>@{p.username}</Td><Td>{p.kind.toLowerCase()}</Td><Td>{birr(p.amount)}</Td><Td><Badge>{p.status.toLowerCase().replace('_', ' ')}</Badge></Td>
            <Td>{p.riskFlags.join(', ') || '—'}</Td><Td className="text-muted">{date(p.createdAt)}</Td>
            <Td className="whitespace-nowrap">{p.status === 'REQUIRES_APPROVAL' && (<>
              <button className="mr-3 text-yes" onClick={() => run('a', () => post(`/admin/payments/${p.id}/review`, { approve: true, note: 'Approved by admin' }), 'Approved').then(() => mutate())}>Approve</button>
              <button className="text-no" onClick={() => { const n = prompt('Reason'); if (n) run('r', () => post(`/admin/payments/${p.id}/review`, { approve: false, note: n }), 'Rejected').then(() => mutate()); }}>Reject</button>
            </>)}</Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

type Fixture = { id: string; league: string; homeTeam: string; awayTeam: string; kickoffAt: string; status: string; homeGoals: number | null; awayGoals: number | null; isDemo: boolean; markets: { id: string; type: string; status: string }[] };
function Sports() {
  const { data, mutate } = useSWR<{ provider: string; isDemo: boolean; fixtures: Fixture[] }>('/admin/sports');
  const { busy, run, post } = useAction();
  const [score, setScore] = useState<Record<string, [string, string]>>({});
  if (!data) return <Skeleton className="h-40" />;
  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-sm">Provider: <b>{data.provider}</b> {data.isDemo && <Badge tone="gold">demo fixtures — not real matches</Badge>}</div>
        <div className="flex gap-2">{(['ETH_PL', 'EPL', 'UCL', 'INTL'] as const).map((l) => <Button key={l} size="sm" variant="secondary" loading={busy === l} onClick={() => run(l, () => post('/admin/sports/sync', { league: l }), 'Synced').then(() => mutate())}>Sync {l}</Button>)}</div>
      </Card>
      <Table head={['Fixture', 'Kickoff', 'Status', 'Markets', 'Actions']}>
        {data.fixtures.map((f) => (
          <tr key={f.id}>
            <Td><div className="font-medium">{f.homeTeam} vs {f.awayTeam}</div><div className="text-xs text-muted">{f.league}{f.homeGoals != null && ` · ${f.homeGoals}–${f.awayGoals}`}</div></Td>
            <Td className="whitespace-nowrap text-muted">{date(f.kickoffAt)}</Td>
            <Td><Badge>{f.status.toLowerCase()}</Badge></Td>
            <Td>{f.markets.length ? f.markets.map((m) => <Link key={m.id} href={`/admin/markets/${m.id}`} className="block text-xs text-brand">{m.type.replace('FOOTBALL_', '').toLowerCase()} · {m.status.toLowerCase()}</Link>) : <button className="text-brand" onClick={() => run('mk', () => post(`/admin/sports/fixtures/${f.id}/markets`, {}), 'Markets created').then(() => mutate())}>Create 4 markets</button>}</Td>
            <Td>{f.isDemo && (
              <div className="flex items-center gap-1">
                <input className="h-8 w-10 rounded-lg border border-border bg-surface text-center" value={score[f.id]?.[0] ?? ''} onChange={(e) => setScore((s) => ({ ...s, [f.id]: [e.target.value, s[f.id]?.[1] ?? ''] }))} placeholder="H" />
                <input className="h-8 w-10 rounded-lg border border-border bg-surface text-center" value={score[f.id]?.[1] ?? ''} onChange={(e) => setScore((s) => ({ ...s, [f.id]: [s[f.id]?.[0] ?? '', e.target.value] }))} placeholder="A" />
                <Button size="sm" variant="secondary" onClick={() => run('fin', () => post(`/admin/sports/fixtures/${f.id}/demo-result`, { status: 'FINISHED', homeGoals: Number(score[f.id]?.[0]), awayGoals: Number(score[f.id]?.[1]) }), 'Result set — run jobs to auto-propose').then(() => mutate())}>Set FT</Button>
                <Button size="sm" variant="ghost" onClick={() => run('pp', () => post(`/admin/sports/fixtures/${f.id}/demo-result`, { status: 'POSTPONED' }), 'Postponed').then(() => mutate())}>Postpone</Button>
              </div>
            )}</Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function Activity() {
  const [view, setView] = useState<'trades' | 'ledger' | 'audit'>('trades');
  const { data: trades } = useSWR<{ id: string; username: string; question: string; side: string; outcome: string; shares: string; amount: string; fee: string; avgPrice: string; createdAt: string }[]>(view === 'trades' ? '/admin/trades' : null, { refreshInterval: 5000 });
  const { data: ledger } = useSWR<{ id: string; kind: string; memo: string; createdAt: string; lines: { account: string; amount: string }[] }[]>(view === 'ledger' ? '/admin/ledger' : null);
  const { data: audit } = useSWR<{ id: string; actorId: string | null; action: string; entityType: string; entityId: string | null; reason: string | null; createdAt: string }[]>(view === 'audit' ? '/admin/audit' : null);
  return (
    <div className="space-y-4">
      <Tabs value={view} onChange={setView} items={[{ value: 'trades', label: 'Trades' }, { value: 'ledger', label: 'Ledger' }, { value: 'audit', label: 'Audit log' }]} />
      {view === 'trades' && <Table head={['When', 'User', 'Market', 'Trade', 'Amount', 'Fee']}>{trades?.map((t) => <tr key={t.id}><Td className="whitespace-nowrap text-muted">{date(t.createdAt)}</Td><Td>@{t.username}</Td><Td className="max-w-xs truncate">{t.question}</Td><Td>{t.side} {num(t.shares)} {t.outcome} @ {pct(t.avgPrice, 1)}</Td><Td>{birr(t.amount)}</Td><Td>{birr(t.fee)}</Td></tr>)}</Table>}
      {view === 'ledger' && <Table head={['When', 'Entry', 'Lines (sum = 0)']}>{ledger?.map((e) => <tr key={e.id}><Td className="whitespace-nowrap text-muted">{date(e.createdAt)}</Td><Td><div className="font-medium">{e.kind}</div><div className="max-w-xs truncate text-xs text-muted">{e.memo}</div></Td><Td>{e.lines.map((l, i) => <div key={i} className="text-xs"><span className="text-muted">{l.account}</span> <span className={Number(l.amount) < 0 ? 'text-no' : 'text-yes'}>{l.amount}</span></div>)}</Td></tr>)}</Table>}
      {view === 'audit' && <Table head={['When', 'Action', 'Entity', 'Actor', 'Reason']}>{audit?.map((a) => <tr key={a.id}><Td className="whitespace-nowrap text-muted">{date(a.createdAt)}</Td><Td className="font-medium">{a.action}</Td><Td className="text-xs">{a.entityType} {a.entityId?.slice(0, 10)}</Td><Td className="text-xs">{a.actorId?.slice(0, 10) ?? 'system'}</Td><Td className="max-w-xs truncate">{a.reason}</Td></tr>)}</Table>}
    </div>
  );
}

function System() {
  const { data: h } = useSWR<Record<string, unknown> & { db: { latencyMs: number } }>('/admin/health', { refreshInterval: 10000 });
  const { data: r, mutate: mr } = useSWR<{ ok: boolean; sumOfBalances: string; unbalancedEntries: number; accountsWithDrift: number; marketIssues: string[]; checkedAt: string }>('/admin/reconciliation');
  const { data: clock, mutate: mc } = useSWR<{ now: string; offsetMs: number }>('/admin/clock');
  const { busy, run, post } = useAction();
  const [hours, setHours] = useState('25');
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-4">
        <div className="mb-2 text-sm font-medium">Health</div>
        {h && <div className="grid grid-cols-2 gap-2 text-sm">{Object.entries(h).map(([k, v]) => <div key={k}><span className="text-muted">{k}: </span>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>)}</div>}
      </Card>
      <Card className="p-4" data-testid="reconciliation">
        <div className="mb-2 flex items-center justify-between text-sm font-medium">Reconciliation <Button size="sm" variant="ghost" onClick={() => mr()}>Re-run</Button></div>
        {r && (
          <div className="space-y-1 text-sm">
            <div>Status: <Badge tone={r.ok ? 'yes' : 'no'}>{r.ok ? 'balanced' : 'issues found'}</Badge></div>
            <div className="text-muted">Σ all account balances: {r.sumOfBalances} · unbalanced entries: {r.unbalancedEntries} · accounts with drift: {r.accountsWithDrift}</div>
            {r.marketIssues.map((i) => <div key={i} className="text-no">{i}</div>)}
          </div>
        )}
      </Card>
      <Card className="p-4 md:col-span-2">
        <div className="text-sm font-medium">Demo clock & jobs</div>
        <p className="mt-1 text-sm text-muted">Simulate the passage of time to test closing, dispute windows and automatic finalization. Demo mode only. Current platform time: {clock && date(clock.now)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input className="w-28" value={hours} onChange={(e) => setHours(e.target.value)} />
          <Button loading={busy === 'adv'} onClick={() => run('adv', () => post('/admin/clock/advance', { hours: Number(hours) }), `Advanced ${hours}h and ran jobs`).then(() => mc())} data-testid="advance-clock">Advance hours + run jobs</Button>
          <Button variant="secondary" loading={busy === 'jobs'} onClick={() => run('jobs', () => post('/admin/jobs/run'), 'Jobs ran')}>Run jobs now</Button>
          <Button variant="ghost" onClick={() => run('rst', () => post('/admin/clock/reset'), 'Clock reset').then(() => mc())}>Reset clock</Button>
        </div>
      </Card>
    </div>
  );
}

export default function AdminPage() {
  return <Suspense><Admin /></Suspense>;
}
