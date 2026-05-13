import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-rosa/10">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}