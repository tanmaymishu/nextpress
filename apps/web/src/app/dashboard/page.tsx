'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api';
import { MeResponse } from '@repo/shared';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const api = new ApiClient();
        const userData = await api.me();
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user data');
        // Redirect to login if unauthorized
        if (err instanceof Error && err.message.includes('401')) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      const api = new ApiClient();
      await api.logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      // Still redirect even if logout fails
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium"
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
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Profile</h3>
                    <p className="text-sm text-gray-500">Your account information</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Name:</span>
                    <span className="ml-2 text-sm text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Email:</span>
                    <span className="ml-2 text-sm text-gray-900">{user?.email}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">User ID:</span>
                    <span className="ml-2 text-sm text-gray-900">{user?.id}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Member since:</span>
                    <span className="ml-2 text-sm text-gray-900">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* API Status Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white">✓</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">API Status</h3>
                    <p className="text-sm text-gray-500">Connection to backend</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-green-600">✅ Successfully connected to API</p>
                  <p className="text-xs text-gray-500 mt-1">Authentication working properly</p>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white">⚡</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                    <p className="text-sm text-gray-500">Common tasks</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <button className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded">
                    Update Profile
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded">
                    Change Password
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded">
                    Account Settings
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Additional Content Area */}
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Welcome to NextPress!</h3>
                <p className="text-gray-600 mb-4">
                  This is your dashboard where you can manage your account and access various features 
                  of the application. The dashboard is successfully communicating with the Express.js 
                  backend API using JWT authentication.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Technical Details:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
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