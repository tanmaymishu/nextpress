'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLogout } from '@/hooks/api/useAuth';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isLoading, error } = useAuth();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    logoutMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full">
          <div className="bg-destructive/15 border border-destructive/20 text-destructive px-4 py-3 rounded mb-4">
            {error.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card shadow border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-foreground"><Link href="/">NextPress</Link></h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-foreground">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {/* User Profile Card */}
            <div className="bg-card overflow-hidden shadow rounded-lg border border-border">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground font-medium">
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-card-foreground">Profile</h3>
                    <p className="text-sm text-muted-foreground">Your account information</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Name:</span>
                    <span className="ml-2 text-sm text-card-foreground">
                      {user?.firstName} {user?.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Email:</span>
                    <span className="ml-2 text-sm text-card-foreground">{user?.email}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">User ID:</span>
                    <span className="ml-2 text-sm text-card-foreground">{user?.id}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Member since:</span>
                    <span className="ml-2 text-sm text-card-foreground">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* API Status Card */}
            <div className="bg-card overflow-hidden shadow rounded-lg border border-border">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-chart-2 rounded-full flex items-center justify-center">
                      <span className="text-white">✓</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-card-foreground">API Status</h3>
                    <p className="text-sm text-muted-foreground">Connection to backend</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-chart-2">✅ Successfully connected to API</p>
                  <p className="text-xs text-muted-foreground mt-1">Authentication working properly</p>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-card overflow-hidden shadow rounded-lg border border-border">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-chart-3 rounded-full flex items-center justify-center">
                      <span className="text-white">⚡</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-card-foreground">Quick Actions</h3>
                    <p className="text-sm text-muted-foreground">Common tasks</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <button className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded">
                    Update Profile
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded">
                    Change Password
                  </button>
                  <Link 
                    href="/admin/acl" 
                    className="block w-full text-left px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded"
                  >
                    Admin Panel (ACL)
                  </Link>
                  <button className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded">
                    Account Settings
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Additional Content Area */}
          <div className="mt-8">
            <div className="bg-card shadow rounded-lg border border-border">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-card-foreground mb-4">Welcome to NextPress!</h3>
                <p className="text-muted-foreground mb-4">
                  This is your dashboard where you can manage your account and access various features
                  of the application. The dashboard is successfully communicating with the Express.js
                  backend API using JWT authentication.
                </p>
                <div className="bg-chart-3/10 border border-chart-3/20 rounded p-4">
                  <h4 className="font-medium text-chart-3 mb-2">Technical Details:</h4>
                  <ul className="text-sm text-chart-3/90 space-y-1">
                    <li>• Frontend: Next.js 14 with TypeScript and Tailwind CSS</li>
                    <li>• Backend: Express.js with TypeORM and PostgreSQL</li>
                    <li>• Authentication: JWT tokens with secure httpOnly cookies</li>
                    <li>• API: RESTful endpoints with type-safe contracts</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
