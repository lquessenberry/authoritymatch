'use client';

import { Render } from '@measured/puck';
import '@measured/puck/puck.css';

import {
  createFactoringDashboardPuckConfig,
} from '@/lib/factoring-dashboard-puck';
import type {
  FactoringDashboardData,
  FactoringDashboardHydration,
} from '@/lib/factoring-dashboard';

type DashboardRendererProps = {
  hydration: FactoringDashboardHydration;
  data?: FactoringDashboardData;
};

export function DashboardRenderer({
  hydration,
  data = hydration.dashboardData,
}: DashboardRendererProps) {
  return (
    <Render
      config={createFactoringDashboardPuckConfig(hydration)}
      data={data}
    />
  );
}
