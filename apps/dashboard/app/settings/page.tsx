export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure the company profile, dashboard seed data, and downstream export
          defaults that power each factoring workspace.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4 max-w-2xl">
        <h3 className="text-lg font-medium">Factor Profile</h3>
        <div className="grid gap-4">
          <Field label="Company Name" placeholder="e.g. Sunbelt Freight Funding" />
          <Field label="Contact Email" type="email" placeholder="contact@example.com" />
          <Field label="Contact Phone" placeholder="(555) 000-0000" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Min Advance Rate (%)" type="number" placeholder="80" />
            <Field label="Max Advance Rate (%)" type="number" placeholder="95" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Min Monthly Volume ($)"
              type="number"
              placeholder="5000"
            />
            <Field
              label="Max Monthly Volume ($)"
              type="number"
              placeholder="500000"
            />
          </div>
          <Field
            label="Drupal Space"
            placeholder="e.g. factor/sunbelt-freight-funding"
          />
          <Field
            label="Primary API Workspace"
            placeholder="e.g. salesforce-primary"
          />
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Save Profile
        </button>
        <p className="text-xs text-muted-foreground">
          Saving here will eventually persist the Puck dashboard schema, Drupal
          hydration context, and export defaults for each factoring company signup.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  type = 'text',
  placeholder,
}: {
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
