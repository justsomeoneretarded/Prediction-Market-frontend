import { Card } from './ui/primitives';

export function AuthShell({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto mt-4 max-w-md md:mt-12">
      <Card className="p-6 md:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
        <div className="mt-6">{children}</div>
      </Card>
    </div>
  );
}
