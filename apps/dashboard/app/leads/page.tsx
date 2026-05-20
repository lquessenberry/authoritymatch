import Link from 'next/link';

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lead Feed</h2>
          <p className="text-muted-foreground">
            Newly matched truckers based on your factor profile criteria.
          </p>
        </div>
      </div>

      {/* Filters placeholder */}
      <div className="flex gap-3 flex-wrap">
        <select className="rounded-md border border-input bg-background px-3 py-1 text-sm">
          <option value="">Equipment Type: All</option>
          <option value="dry_van">Dry Van</option>
          <option value="flatbed">Flatbed</option>
          <option value="reefer">Reefer</option>
          <option value="tanker">Tanker</option>
        </select>
        <select className="rounded-md border border-input bg-background px-3 py-1 text-sm">
          <option value="">Status: All</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="claimed">Claimed</option>
        </select>
      </div>

      {/* Leads table placeholder */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-6 border-b border-border">
          <h3 className="text-sm font-medium">Available Leads</h3>
        </div>
        <div className="p-6">
          <p className="text-muted-foreground text-sm text-center py-8">
            No leads available yet.{' '}
            <Link href="/settings" className="text-primary underline">
              Update your factor profile
            </Link>{' '}
            to receive matched leads.
          </p>
        </div>
      </div>
    </div>
  );
}
