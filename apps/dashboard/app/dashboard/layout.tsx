import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/dashboard" className="text-lg font-semibold text-foreground">
            AuthorityMatch
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavItem href="/dashboard" label="Overview" />
          <NavItem href="/leads" label="Lead Feed" />
          <NavItem href="/settings" label="Settings" />
        </nav>
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground">Factor Portal v0.1</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="h-16 border-b border-border flex items-center px-6">
          <h1 className="text-sm font-medium text-muted-foreground">
            Factor Dashboard
          </h1>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      {label}
    </Link>
  );
}
