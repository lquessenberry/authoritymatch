import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md px-4">
        <h1 className="text-4xl font-bold text-foreground">
          AuthorityMatch
        </h1>
        <p className="text-xl text-muted-foreground">Factor Portal</p>
        <p className="text-muted-foreground">
          Manage your lead feed, review trucker profiles, and grow your factoring
          book with newly authorized carriers.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
