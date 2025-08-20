'use client';

import { useAuth } from '@/contexts/auth-context';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="border-2 border-dashed border-gray-300 rounded p-12 text-center max-w-md w-full">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Welcome, {user?.firstName} {user?.lastName}
        </h2>
        <p className="text-gray-600">
          This is your dashboard home page. You can navigate to other sections using the sidebar.
        </p>
      </div>
    </div>
  );
}
