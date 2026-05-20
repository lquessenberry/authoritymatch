import { DashboardCustomizer } from '@/components/dashboard/dashboard-customizer';
import { getFactoringDashboardHydration } from '@/lib/factoring-dashboard';

export default async function DashboardCustomizePage() {
  const hydration = await getFactoringDashboardHydration();

  return <DashboardCustomizer hydration={hydration} />;
}
