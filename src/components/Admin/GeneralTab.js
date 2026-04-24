import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FaClock, FaClipboardList, FaCarSide, FaUserFriends } from 'react-icons/fa';
import { Card, CardBody } from '../shared/Card';
import Skeleton from '../shared/Skeleton';

function StatCard({ icon: Icon, label, value, tone = 'brand', suffix }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
    success: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500',
    warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500',
    neutral: 'bg-ink-100 text-ink-600 dark:bg-ink-700 dark:text-ink-200',
  };
  return (
    <Card className="transition-shadow hover:shadow-pop">
      <CardBody className="flex items-start gap-4">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-ink-500 dark:text-ink-400 truncate">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900 dark:text-ink-50 tabular-nums">
            {value}
            {suffix && <span className="ml-1 text-sm font-medium text-ink-500 dark:text-ink-400">{suffix}</span>}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardBody className="flex items-start gap-4">
        <Skeleton className="h-10 w-10" rounded="lg" />
        <div className="flex-1 space-y-2">
          <Skeleton height={12} className="w-24" />
          <Skeleton height={24} className="w-16" />
        </div>
      </CardBody>
    </Card>
  );
}

const GeneralTab = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
    // eslint-disable-next-line
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/admin/statistics');
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Failed to fetch statistics.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">Overview</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Snapshot of platform activity and driver network.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : !statistics ? (
        <Card>
          <CardBody className="text-center py-10">
            <p className="text-sm text-ink-500 dark:text-ink-400">No statistics available.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={FaClock}
            label="Average trip time"
            value={(Math.round(statistics.average_trip_time * 100) / 100).toString()}
            suffix="min"
            tone="brand"
          />
          <StatCard
            icon={FaClipboardList}
            label="Total bookings"
            value={statistics.total_bookings}
            tone="success"
          />
          <StatCard
            icon={FaCarSide}
            label="Total drivers"
            value={statistics.total_drivers}
            tone="warning"
          />
          <StatCard
            icon={FaUserFriends}
            label="Total users"
            value={statistics.total_users}
            tone="neutral"
          />
        </div>
      )}
    </div>
  );
};

export default GeneralTab;
