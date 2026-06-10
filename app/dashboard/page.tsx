export const metadata = {
  title: 'Dashboard | Latimore OS',
}

export default function DashboardHome() {
  return (
    <div className="min-h-screen bg-[#0B0F17] p-6 md:p-8">
      <h1 className="text-xl font-semibold text-white">Dashboard</h1>
      <p className="mt-2 text-sm text-[#A9B1BE]">
        System-wide overview of Latimore OS performance and activity.
      </p>
    </div>
  )
}
