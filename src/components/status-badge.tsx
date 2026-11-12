import { Badge } from './ui/primitives';

export function StatusBadge({ status, halted }: { status: string; halted?: boolean }) {
  if (halted) return <Badge tone="gold">Paused</Badge>;
  const tone = status === 'OPEN' ? 'yes' : status === 'DISPUTED' ? 'no' : status === 'RESOLVED' ? 'brand' : 'neutral';
  return <Badge tone={tone}>{status.replace('_', ' ').toLowerCase()}</Badge>;
}
