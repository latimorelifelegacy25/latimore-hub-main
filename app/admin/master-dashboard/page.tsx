import React from 'react';
// Import the components from the other two dashboard folders
import DailyBrief from '../dashboard/DailyBrief';
import EngagementDashboardClient from '../engagement-dashboard/EngagementDashboardClient';

export default function MasterDashboardPage() {
  return (
    <div className="flex flex-col gap-8 p-6 w-full max-w-7xl mx-auto">

      {/* Header Section */}
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Master Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          A comprehensive overview of your daily operations and user engagement.
        </p>
      </header>

      {/* Dashboard 1: Daily Operations (From /dashboard) */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100">
          Daily Brief & Operations
        </h2>
        <DailyBrief />
      </section>

      {/* Dashboard 2: Engagement Analytics (From /engagement-dashboard) */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100">
          Engagement Metrics
        </h2>
        <EngagementDashboardClient />
      </section>

    </div>
  );
}
