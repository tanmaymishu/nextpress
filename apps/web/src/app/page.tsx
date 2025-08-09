export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">NextPress</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Sign in
              </a>
              <a
                href="/register"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Register
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 sm:text-6xl">
            <span className="block">Express + Next.js</span>
            <span className="block text-indigo-600">Monorepo Starter</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
            A production-ready fullstack template with TypeScript, authentication,
            type-safe APIs, and modern development tools.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <a
              href="https://github.com/tanmaymishu/nextpress"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-md text-lg font-medium"
            >
              View on Github
            </a>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Everything you need to build modern web apps
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Built with the latest technologies and best practices
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-indigo-600 text-xl">🚀</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Turborepo Monorepo</h3>
            <p className="mt-2 text-gray-600">
              Fast, cached builds with Express API, Next.js frontend, and shared packages.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-green-600 text-xl">🔒</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900">JWT Authentication</h3>
            <p className="mt-2 text-gray-600">
              Secure authentication with JWT tokens, Passport.js, and httpOnly cookies.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-blue-600 text-xl">⚡</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Type Safety</h3>
            <p className="mt-2 text-gray-600">
              End-to-end TypeScript with shared types between frontend and backend.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-purple-600 text-xl">🗄️</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Database Ready</h3>
            <p className="mt-2 text-gray-600">
              TypeORM with PostgreSQL, migrations, and Redis for sessions and queues.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-yellow-600 text-xl">🧪</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Testing & DevOps</h3>
            <p className="mt-2 text-gray-600">
              Jest testing, background jobs with BullMQ, and development tools included.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-red-600 text-xl">🎨</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Modern UI</h3>
            <p className="mt-2 text-gray-600">
              Next.js 14 with Tailwind CSS, responsive design, and beautiful components.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white">
              Ready to start your next project?
            </h2>
            <p className="mt-4 text-xl text-indigo-200">
              Clone NextPress to build amazing applications.
            </p>
            <div className="mt-8">
              <a
                href="https://github.com/tanmaymishu/nextpress"
                target="_blank"
                className="bg-white text-indigo-600 px-8 py-3 rounded-md text-lg font-medium hover:bg-gray-50"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2025 NextPress. Made with ❤️ by <a href="https://tanmaydas.com" className="hover:underline" target="_blank">Tanmay.</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
