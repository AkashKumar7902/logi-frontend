import React, { useState } from 'react';
import GeneralTab from './GeneralTab';
import VehiclesTab from './VehiclesTab';
import DriversTab from './DriversTab';
import { FaTachometerAlt, FaTruck, FaUsers } from 'react-icons/fa';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const tabs = [
  { key: 'general', label: 'Overview', icon: FaTachometerAlt, Component: GeneralTab },
  { key: 'vehicles', label: 'Vehicles', icon: FaTruck, Component: VehiclesTab },
  { key: 'drivers', label: 'Drivers', icon: FaUsers, Component: DriversTab },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('general');
  const ActiveComponent = tabs.find((t) => t.key === activeTab)?.Component || GeneralTab;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-ink-50 dark:bg-ink-900 flex flex-col md:flex-row">
      <ToastContainer position="top-right" hideProgressBar={false} closeOnClick pauseOnHover newestOnTop />

      <aside className="md:w-64 md:shrink-0 bg-white dark:bg-ink-800 md:border-r border-b md:border-b-0 border-ink-100 dark:border-ink-700">
        <div className="hidden md:block px-5 pt-6 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">
            Admin
          </p>
          <h2 className="mt-1 text-lg font-semibold text-ink-900 dark:text-ink-50">Control Panel</h2>
        </div>

        <nav className="p-3 md:p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={[
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'
                    : 'text-ink-600 hover:text-ink-900 hover:bg-ink-50 dark:text-ink-300 dark:hover:text-ink-50 dark:hover:bg-ink-700/60',
                ].join(' ')}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={isActive ? 'text-brand-600 dark:text-brand-300' : 'text-ink-400 dark:text-ink-500'} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
