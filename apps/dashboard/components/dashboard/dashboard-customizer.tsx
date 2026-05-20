'use client';

import { useState } from 'react';
import { Puck } from '@measured/puck';
import '@measured/puck/puck.css';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@authoritymatch/ui';

import { createFactoringDashboardPuckConfig } from '@/lib/factoring-dashboard-puck';
import type {
  FactoringDashboardData,
  FactoringDashboardHydration,
} from '@/lib/factoring-dashboard';

type DashboardCustomizerProps = {
  hydration: FactoringDashboardHydration;
};

export function DashboardCustomizer({ hydration }: DashboardCustomizerProps) {
  const [publishedData, setPublishedData] = useState<FactoringDashboardData>(
    hydration.dashboardData
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customize company dashboard</CardTitle>
          <CardDescription>
            This workspace is seeded automatically for each factoring company and can
            be rearranged with Puck before persisting to Drupal or another backing
            store.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Current company: {hydration.company.name} · Drupal space:{' '}
          {hydration.company.drupalSpace} · API workspace:{' '}
          {hydration.company.apiWorkspace}
        </CardContent>
      </Card>

      <Puck
        config={createFactoringDashboardPuckConfig(hydration)}
        data={publishedData}
        headerTitle={`${hydration.company.name} dashboard builder`}
        headerPath="/dashboard/customize"
        onPublish={(data) => setPublishedData(data as FactoringDashboardData)}
      />
    </div>
  );
}
