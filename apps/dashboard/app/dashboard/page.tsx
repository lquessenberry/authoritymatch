export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">
          Welcome to your AuthorityMatch factor dashboard.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="New Leads" value="—" description="Last 7 days" />
        <StatCard title="Active Leads" value="—" description="In your pipeline" />
        <StatCard title="Claimed" value="—" description="Leads claimed this month" />
        <StatCard title="Match Rate" value="—" description="Avg. score for your criteria" />
      </div>

      {/* Recent leads placeholder */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-medium mb-4">Recent Leads</h3>
        <p className="text-muted-foreground text-sm">
          No leads yet. Configure your factor profile to start receiving matched
          trucker leads.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
