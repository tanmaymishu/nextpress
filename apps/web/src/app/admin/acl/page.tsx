'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ACLManagementPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new dashboard structure
    router.replace('/dashboard/admin/users');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  );
}