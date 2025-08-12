export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-primary mb-4">Welcome to Production Reports</h1>
        <p className="text-xl text-muted-foreground mb-8">Manage and track your production data efficiently</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Production Reports</h3>
            <p className="text-muted-foreground">View and manage production reports</p>
          </div>
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Dashboard</h3>
            <p className="text-muted-foreground">Monitor key metrics and performance</p>
          </div>
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Analytics</h3>
            <p className="text-muted-foreground">Analyze production trends and data</p>
          </div>
        </div>
      </div>
    </div>
  )
}
