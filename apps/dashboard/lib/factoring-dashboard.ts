import type { Data } from '@measured/puck';

export type DashboardRootProps = {
  title: string;
  subtitle: string;
};

export type HeroBannerProps = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

export type MetricStripProps = {
  title: string;
  columns: number;
};

export type LeadFeedProps = {
  title: string;
  maxItems: number;
};

export type DrupalBriefsProps = {
  title: string;
  intro: string;
  maxItems: number;
};

export type ApiConnectionsProps = {
  title: string;
  description: string;
};

export type ExportCenterProps = {
  title: string;
  description: string;
  preferredFormat: 'json' | 'csv';
};

export type DashboardComponents = {
  HeroBanner: HeroBannerProps;
  MetricStrip: MetricStripProps;
  LeadFeed: LeadFeedProps;
  DrupalBriefs: DrupalBriefsProps;
  ApiConnections: ApiConnectionsProps;
  ExportCenter: ExportCenterProps;
};

export type FactoringDashboardData = Data<DashboardComponents, DashboardRootProps>;

export type DashboardMetric = {
  key: string;
  label: string;
  value: string;
  description: string;
};

export type LeadRecord = {
  id: string;
  companyName: string;
  dotNumber: string;
  equipmentType: string;
  status: 'new' | 'reviewed' | 'claimed';
  score: number;
  monthlyVolume: number;
  state: string;
};

export type DrupalBrief = {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
};

export type ApiConnection = {
  id: string;
  name: string;
  system: string;
  status: 'healthy' | 'syncing' | 'attention';
  lastSync: string;
  destination: string;
};

export type ExportTarget = {
  id: string;
  name: string;
  format: 'json' | 'csv';
  destination: string;
  cadence: string;
};

export type FactoringCompanyProfile = {
  id: string;
  slug: string;
  name: string;
  dashboardTitle: string;
  dashboardSubtitle: string;
  brandColor: string;
  drupalSpace: string;
  apiWorkspace: string;
};

export type FactoringDashboardHydration = {
  company: FactoringCompanyProfile;
  metrics: DashboardMetric[];
  leads: LeadRecord[];
  drupalBriefs: DrupalBrief[];
  apiConnections: ApiConnection[];
  exportTargets: ExportTarget[];
  dashboardData: FactoringDashboardData;
};

function buildDefaultDashboardData(
  company: FactoringCompanyProfile
): FactoringDashboardData {
  return {
    root: {
      props: {
        title: company.dashboardTitle,
        subtitle: company.dashboardSubtitle,
      },
    },
    content: [
      {
        type: 'HeroBanner',
        props: {
          id: 'hero-banner',
          eyebrow: 'Auto-provisioned factoring workspace',
          title: `${company.name} dashboard`,
          description:
            'Every factoring signup gets a Puck-powered workspace seeded with Drupal content, API connectivity, and export-ready lead data.',
          ctaLabel: 'Customize dashboard',
          ctaHref: '/dashboard/customize',
        },
      },
      {
        type: 'MetricStrip',
        props: {
          id: 'metric-strip',
          title: 'Pipeline snapshot',
          columns: 4,
        },
      },
      {
        type: 'LeadFeed',
        props: {
          id: 'lead-feed',
          title: 'Matched carriers',
          maxItems: 4,
        },
      },
      {
        type: 'DrupalBriefs',
        props: {
          id: 'drupal-briefs',
          title: 'Drupal-authored briefs',
          intro:
            'Operational updates, onboarding instructions, and sales guidance hydrate directly from Drupal-managed content.',
          maxItems: 3,
        },
      },
      {
        type: 'ApiConnections',
        props: {
          id: 'api-connections',
          title: 'Connected systems',
          description:
            'CRM, underwriting, and accounting connectors are hydrated into the dashboard state so teams can act without re-entering data.',
        },
      },
      {
        type: 'ExportCenter',
        props: {
          id: 'export-center',
          title: 'Export center',
          description:
            'Push normalized carrier and pipeline data into downstream systems with JSON or CSV-ready exports.',
          preferredFormat: 'json',
        },
      },
    ],
  };
}

export async function getFactoringDashboardHydration(
  companySlug = 'sunbelt-freight-funding'
): Promise<FactoringDashboardHydration> {
  const company: FactoringCompanyProfile = {
    id: 'factor-001',
    slug: companySlug,
    name: 'Sunbelt Freight Funding',
    dashboardTitle: 'Sunbelt Freight Funding Command Center',
    dashboardSubtitle:
      'Puck-powered, Drupal-hydrated dashboard for sales, operations, and exports',
    brandColor: '#2563eb',
    drupalSpace: 'factor/sunbelt-freight-funding',
    apiWorkspace: 'sunbelt-primary',
  };

  const metrics: DashboardMetric[] = [
    {
      key: 'new-leads',
      label: 'New leads',
      value: '24',
      description: 'Freshly matched in the last 7 days',
    },
    {
      key: 'qualified',
      label: 'Qualified carriers',
      value: '18',
      description: 'Meet your underwriting and volume thresholds',
    },
    {
      key: 'sync-health',
      label: 'API health',
      value: '98%',
      description: 'Successful sync rate across connected systems',
    },
    {
      key: 'exports',
      label: 'Exports sent',
      value: '12',
      description: 'Delivered to CRM, BI, and accounting destinations',
    },
  ];

  const leads: LeadRecord[] = [
    {
      id: 'lead-1001',
      companyName: 'Ozark Dedicated Haul',
      dotNumber: '4123456',
      equipmentType: 'Dry Van',
      status: 'new',
      score: 96,
      monthlyVolume: 92000,
      state: 'AR',
    },
    {
      id: 'lead-1002',
      companyName: 'Delta River Transport',
      dotNumber: '4231452',
      equipmentType: 'Flatbed',
      status: 'reviewed',
      score: 91,
      monthlyVolume: 120000,
      state: 'TN',
    },
    {
      id: 'lead-1003',
      companyName: 'MidSouth Reefer Lines',
      dotNumber: '4012838',
      equipmentType: 'Reefer',
      status: 'claimed',
      score: 88,
      monthlyVolume: 76000,
      state: 'MS',
    },
    {
      id: 'lead-1004',
      companyName: 'Natural State Freight',
      dotNumber: '4345120',
      equipmentType: 'Power Only',
      status: 'new',
      score: 84,
      monthlyVolume: 68000,
      state: 'AR',
    },
    {
      id: 'lead-1005',
      companyName: 'Blue Ribbon Logistics',
      dotNumber: '4251981',
      equipmentType: 'Hotshot',
      status: 'reviewed',
      score: 82,
      monthlyVolume: 54000,
      state: 'MO',
    },
  ];

  const drupalBriefs: DrupalBrief[] = [
    {
      id: 'brief-001',
      title: 'Pilot onboarding sequence',
      body: 'Drupal maintains the onboarding checklist, CTA copy, and partner-facing notes for newly activated factoring teams.',
      updatedAt: '2026-05-18',
    },
    {
      id: 'brief-002',
      title: 'Lead scoring playbook',
      body: 'Editorial content and campaign guidance stay in Drupal so growth teams can revise workflows without redeploying the dashboard.',
      updatedAt: '2026-05-16',
    },
    {
      id: 'brief-003',
      title: 'Compliance export notes',
      body: 'Export payload documentation and downstream mapping notes are kept alongside the dashboard content model.',
      updatedAt: '2026-05-14',
    },
  ];

  const apiConnections: ApiConnection[] = [
    {
      id: 'api-001',
      name: 'Salesforce pipeline sync',
      system: 'Salesforce',
      status: 'healthy',
      lastSync: '5 minutes ago',
      destination: 'Opportunity pipeline',
    },
    {
      id: 'api-002',
      name: 'HubSpot nurturing sync',
      system: 'HubSpot',
      status: 'syncing',
      lastSync: 'Sync in progress',
      destination: 'Lifecycle campaigns',
    },
    {
      id: 'api-003',
      name: 'NetSuite export connector',
      system: 'NetSuite',
      status: 'healthy',
      lastSync: '12 minutes ago',
      destination: 'Invoice and settlement queue',
    },
  ];

  const exportTargets: ExportTarget[] = [
    {
      id: 'export-001',
      name: 'CRM lead export',
      format: 'json',
      destination: 'Salesforce',
      cadence: 'Realtime webhook-ready',
    },
    {
      id: 'export-002',
      name: 'Finance reconciliation',
      format: 'csv',
      destination: 'NetSuite / BI warehouse',
      cadence: 'Daily scheduled export',
    },
  ];

  return {
    company,
    metrics,
    leads,
    drupalBriefs,
    apiConnections,
    exportTargets,
    dashboardData: buildDefaultDashboardData(company),
  };
}

export function buildLeadExportCsv(leads: LeadRecord[]) {
  const header = [
    'id',
    'companyName',
    'dotNumber',
    'equipmentType',
    'status',
    'score',
    'monthlyVolume',
    'state',
  ];

  const rows = leads.map((lead) =>
    [
      lead.id,
      lead.companyName,
      lead.dotNumber,
      lead.equipmentType,
      lead.status,
      lead.score,
      lead.monthlyVolume,
      lead.state,
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(',')
  );

  return [header.join(','), ...rows].join('\n');
}
