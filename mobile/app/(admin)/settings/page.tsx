// app/(admin)/settings/page.tsx
import SettingsScreen from '../../../src/components/SettingsScreen';
import { useRbac } from '../../../src/lib/rbacClient';

export default function AdminSettingsPage() {
  const { rbac } = useRbac();
  const settingsRole: 'admin' | 'staff' =
    rbac?.role === 'admin' ? 'admin' : 'staff';

  return <SettingsScreen role={settingsRole} />;
}