export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-muted via-background to-muted/50">
      {/* Navigation */}
      <nav className="bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-foreground">NextPress</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/login"
                className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium"
              >
                Sign in
              </a>
              <a
                href="/register"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
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
          <h1 className="text-5xl font-extrabold text-foreground sm:text-6xl">
            <span className="block">Express + Next.js</span>
            <span className="block text-primary">Monorepo Starter</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-muted-foreground">
            A production-ready fullstack template with TypeScript, authentication,
            type-safe APIs, and modern development tools.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <a
              href="https://github.com/tanmaymishu/nextpress"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-md text-lg font-medium"
            >
              View on Github
            </a>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-foreground">
            Everything you need to build modern web apps
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Built with the latest technologies and best practices
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <div className="bg-card rounded-lg shadow-md p-6 border border-border">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-primary text-xl">🚀</span>
            </div>
            <h3 className="text-lg font-medium text-card-foreground">Turborepo Monorepo</h3>
            <p className="mt-2 text-muted-foreground">
              Fast, cached builds with Express API, Next.js frontend, and shared packages.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-card rounded-lg shadow-md p-6 border border-border">
            <div className="h-12 w-12 bg-chart-2/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-chart-2 text-xl">🔒</span>
            </div>
            <h3 className="text-lg font-medium text-card-foreground">JWT Authentication</h3>
            <p className="mt-2 text-muted-foreground">
              Secure authentication with JWT tokens, Passport.js, and httpOnly cookies.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-card rounded-lg shadow-md p-6 border border-border">
            <div className="h-12 w-12 bg-chart-3/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-chart-3 text-xl">⚡</span>
            </div>
            <h3 className="text-lg font-medium text-card-foreground">Type Safety</h3>
            <p className="mt-2 text-muted-foreground">
              End-to-end TypeScript with shared types between frontend and backend.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-card rounded-lg shadow-md p-6 border border-border">
            <div className="h-12 w-12 bg-chart-4/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-chart-4 text-xl">🗄️</span>
            </div>
            <h3 className="text-lg font-medium text-card-foreground">Database Ready</h3>
            <p className="mt-2 text-muted-foreground">
              TypeORM with PostgreSQL, migrations, and Redis for sessions and queues.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-card rounded-lg shadow-md p-6 border border-border">
            <div className="h-12 w-12 bg-chart-5/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-chart-5 text-xl">🧪</span>
            </div>
            <h3 className="text-lg font-medium text-card-foreground">Testing & DevOps</h3>
            <p className="mt-2 text-muted-foreground">
              Jest testing, background jobs with BullMQ, and development tools included.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-card rounded-lg shadow-md p-6 border border-border">
            <div className="h-12 w-12 bg-chart-1/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-chart-1 text-xl">🎨</span>
            </div>
            <h3 className="text-lg font-medium text-card-foreground">Modern UI</h3>
            <p className="mt-2 text-muted-foreground">
              Next.js 14 with Tailwind CSS, responsive design, and beautiful components.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-primary-foreground">
              Ready to start your next project?
            </h2>
            <p className="mt-4 text-xl text-primary-foreground/80">
              Clone NextPress to build amazing applications.
            </p>
            <div className="mt-8">
              <a
                href="https://github.com/tanmaymishu/nextpress"
                target="_blank"
                className="bg-primary-foreground text-primary px-8 py-3 rounded-md text-lg font-medium hover:bg-primary-foreground/90"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-secondary-foreground/80">
              © 2025 NextPress. Made with ❤️ by <a href="https://tanmaydas.com" className="hover:underline" target="_blank">Tanmay.</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
