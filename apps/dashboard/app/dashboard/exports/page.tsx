import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@authoritymatch/ui';

import { ExportActions } from '@/components/dashboard/export-actions';
import { getFactoringDashboardHydration } from '@/lib/factoring-dashboard';

export default async function DashboardExportsPage() {
  const hydration = await getFactoringDashboardHydration();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Exports</h2>
        <p className="text-muted-foreground">
          Each factoring company dashboard ships with normalized exports ready for CRM,
          BI, and accounting workflows.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export-ready datasets</CardTitle>
          <CardDescription>
            Download JSON or CSV payloads generated from the same hydrated Drupal +
            API-backed dashboard state.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ExportActions
            apiConnections={hydration.apiConnections}
            company={hydration.company}
            exportTargets={hydration.exportTargets}
            leads={hydration.leads}
          />
          <div className="grid gap-3 md:grid-cols-2">
            {hydration.exportTargets.map((target) => (
              <div key={target.id} className="rounded-lg border border-border p-4">
                <p className="font-medium">{target.name}</p>
                <p className="text-sm text-muted-foreground">
                  {target.destination} · {target.cadence}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
