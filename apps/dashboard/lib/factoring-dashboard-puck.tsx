import type { Config } from '@measured/puck';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@authoritymatch/ui';
import Link from 'next/link';

import { ExportActions } from '@/components/dashboard/export-actions';
import type {
  DashboardComponents,
  DashboardRootProps,
  DrupalBriefsProps,
  ExportCenterProps,
  FactoringDashboardHydration,
  HeroBannerProps,
  LeadFeedProps,
  MetricStripProps,
  ApiConnectionsProps,
} from '@/lib/factoring-dashboard';

function statusClasses(status: 'healthy' | 'syncing' | 'attention') {
  switch (status) {
    case 'healthy':
      return 'bg-emerald-100 text-emerald-700';
    case 'syncing':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-rose-100 text-rose-700';
  }
}

function HeroBanner({
  hydration,
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaHref,
}: HeroBannerProps & { hydration: FactoringDashboardHydration }) {
  return (
    <section
      className="rounded-xl border border-border px-6 py-8 text-primary-foreground"
      style={{ background: hydration.company.brandColor }}
    >
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-foreground/80">
          {eyebrow}
        </p>
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
          <p className="max-w-3xl text-sm text-primary-foreground/90">{description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={ctaHref}
            className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-100"
          >
            {ctaLabel}
          </Link>
          <div className="inline-flex items-center rounded-md border border-white/30 px-4 py-2 text-sm text-primary-foreground/90">
            Drupal space: {hydration.company.drupalSpace}
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricStrip({
  hydration,
  title,
  columns,
}: MetricStripProps & { hydration: FactoringDashboardHydration }) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">
          Hydrated from AuthorityMatch matching signals plus connected factor systems.
        </p>
      </div>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${Math.max(columns, 1)}, minmax(0, 1fr))` }}
      >
        {hydration.metrics.map((metric) => (
          <Card key={metric.key}>
            <CardHeader className="pb-2">
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-3xl">{metric.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {metric.description}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function LeadFeed({
  hydration,
  title,
  maxItems,
}: LeadFeedProps & { hydration: FactoringDashboardHydration }) {
  const leads = hydration.leads.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Each company starts with a ready-to-work lead feed that can be rearranged in Puck.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="flex flex-col gap-3 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="space-y-1">
              <p className="font-medium">{lead.companyName}</p>
              <p className="text-sm text-muted-foreground">
                DOT {lead.dotNumber} · {lead.equipmentType} · {lead.state}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="rounded-full bg-secondary px-2.5 py-1 font-medium text-secondary-foreground">
                {lead.status}
              </span>
              <span className="text-muted-foreground">Score {lead.score}</span>
              <span className="text-muted-foreground">
                ${lead.monthlyVolume.toLocaleString()}/mo
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DrupalBriefs({
  hydration,
  title,
  intro,
  maxItems,
}: DrupalBriefsProps & { hydration: FactoringDashboardHydration }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{intro}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-3">
        {hydration.drupalBriefs.slice(0, maxItems).map((brief) => (
          <div key={brief.id} className="rounded-lg border border-border p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Updated {brief.updatedAt}
            </p>
            <h4 className="mt-2 font-semibold">{brief.title}</h4>
            <p className="mt-2 text-sm text-muted-foreground">{brief.body}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ApiConnections({
  hydration,
  title,
  description,
}: ApiConnectionsProps & { hydration: FactoringDashboardHydration }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {hydration.apiConnections.map((connection) => (
          <div
            key={connection.id}
            className="flex flex-col gap-3 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-medium">{connection.name}</p>
              <p className="text-sm text-muted-foreground">
                {connection.system} → {connection.destination}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span
                className={`rounded-full px-2.5 py-1 font-medium ${statusClasses(connection.status)}`}
              >
                {connection.status}
              </span>
              <span className="text-muted-foreground">{connection.lastSync}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ExportCenter({
  hydration,
  title,
  description,
  preferredFormat,
}: ExportCenterProps & { hydration: FactoringDashboardHydration }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-2">
          {hydration.exportTargets.map((target) => (
            <div key={target.id} className="rounded-lg border border-border p-4">
              <p className="font-medium">{target.name}</p>
              <p className="text-sm text-muted-foreground">
                {target.destination} · {target.cadence}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {target.format}
              </p>
            </div>
          ))}
        </div>
        <ExportActions
          apiConnections={hydration.apiConnections}
          company={hydration.company}
          exportTargets={hydration.exportTargets}
          leads={hydration.leads}
          preferredFormat={preferredFormat}
        />
      </CardContent>
    </Card>
  );
}

export function createFactoringDashboardPuckConfig(
  hydration: FactoringDashboardHydration
): Config<DashboardComponents, DashboardRootProps> {
  return {
    root: {
      fields: {
        title: { type: 'text' },
        subtitle: { type: 'textarea' },
      },
      render: ({ title, subtitle, children }) => (
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {hydration.company.name}
            </p>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="space-y-6">{children}</div>
        </div>
      ),
    },
    categories: {
      overview: {
        title: 'Overview widgets',
        components: ['HeroBanner', 'MetricStrip', 'LeadFeed'],
      },
      integrations: {
        title: 'Drupal + API widgets',
        components: ['DrupalBriefs', 'ApiConnections', 'ExportCenter'],
      },
    },
    components: {
      HeroBanner: {
        label: 'Hero banner',
        fields: {
          eyebrow: { type: 'text' },
          title: { type: 'text' },
          description: { type: 'textarea' },
          ctaLabel: { type: 'text' },
          ctaHref: { type: 'text' },
        },
        defaultProps: hydration.dashboardData.content.find(
          (item) => item.type === 'HeroBanner'
        )?.props as HeroBannerProps,
        render: (props) => <HeroBanner {...props} hydration={hydration} />,
      },
      MetricStrip: {
        label: 'Metric strip',
        fields: {
          title: { type: 'text' },
          columns: { type: 'number', min: 1, max: 4 },
        },
        defaultProps: {
          title: 'Pipeline snapshot',
          columns: 4,
        },
        render: (props) => <MetricStrip {...props} hydration={hydration} />,
      },
      LeadFeed: {
        label: 'Lead feed',
        fields: {
          title: { type: 'text' },
          maxItems: { type: 'number', min: 1, max: 10 },
        },
        defaultProps: {
          title: 'Matched carriers',
          maxItems: 4,
        },
        render: (props) => <LeadFeed {...props} hydration={hydration} />,
      },
      DrupalBriefs: {
        label: 'Drupal briefs',
        fields: {
          title: { type: 'text' },
          intro: { type: 'textarea' },
          maxItems: { type: 'number', min: 1, max: 6 },
        },
        defaultProps: {
          title: 'Drupal-authored briefs',
          intro:
            'Operational updates, onboarding instructions, and sales guidance hydrate directly from Drupal-managed content.',
          maxItems: 3,
        },
        render: (props) => <DrupalBriefs {...props} hydration={hydration} />,
      },
      ApiConnections: {
        label: 'API connections',
        fields: {
          title: { type: 'text' },
          description: { type: 'textarea' },
        },
        defaultProps: {
          title: 'Connected systems',
          description:
            'CRM, underwriting, and accounting connectors are hydrated into the dashboard state so teams can act without re-entering data.',
        },
        render: (props) => <ApiConnections {...props} hydration={hydration} />,
      },
      ExportCenter: {
        label: 'Export center',
        fields: {
          title: { type: 'text' },
          description: { type: 'textarea' },
          preferredFormat: {
            type: 'radio',
            options: [
              { label: 'JSON', value: 'json' },
              { label: 'CSV', value: 'csv' },
            ],
          },
        },
        defaultProps: {
          title: 'Export center',
          description:
            'Push normalized carrier and pipeline data into downstream systems with JSON or CSV-ready exports.',
          preferredFormat: 'json',
        },
        render: (props) => <ExportCenter {...props} hydration={hydration} />,
      },
    },
  };
}
