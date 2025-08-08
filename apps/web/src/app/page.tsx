import { ApiClient } from '@/lib/api';

export default async function Home() {
  let users = [];
  let error = null;

  try {
    const api = new ApiClient();
    users = await api.get('/api/v1/users');
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to fetch users';
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold">Express TS Starter - Web App</h1>
        
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">API Connection Test</h2>
          {error ? (
            <p className="text-red-600">Error: {error}</p>
          ) : (
            <div>
              <p className="text-green-600">✅ Successfully connected to API</p>
              <p className="text-sm text-gray-600 mt-2">
                Found {Array.isArray(users) ? users.length : 0} users
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="/login"
          >
            Login
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            href="/register"
          >
            Register
          </a>
        </div>
      </main>
    </div>
  );
}