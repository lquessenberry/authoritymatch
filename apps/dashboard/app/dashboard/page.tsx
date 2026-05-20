import { DashboardRenderer } from '@/components/dashboard/dashboard-renderer';
import { getFactoringDashboardHydration } from '@/lib/factoring-dashboard';

export default async function DashboardPage() {
  const hydration = await getFactoringDashboardHydration();

  return (
    <div className="space-y-6">
      <DashboardRenderer hydration={hydration} />
    </div>
  );
}
