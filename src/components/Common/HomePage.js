import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../shared/Button';
import { Card, CardBody } from '../shared/Card';

const roleCards = [
  {
    title: 'For Users',
    accent: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200',
    badge: 'User',
    description:
      'Ship goods across town or across the country. Track live, pay fairly, and get your items delivered on time.',
    actions: [
      { to: '/register/user', label: 'Create account', variant: 'primary' },
      { to: '/login/user', label: 'Login', variant: 'secondary' },
    ],
  },
  {
    title: 'For Drivers',
    accent: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500',
    badge: 'Driver',
    description:
      'Drive on your schedule. Accept bookings in your area and get paid quickly for every successful delivery.',
    actions: [
      { to: '/register/driver', label: 'Become a driver', variant: 'primary' },
      { to: '/login/driver', label: 'Login', variant: 'secondary' },
    ],
  },
  {
    title: 'For Admins',
    accent: 'bg-ink-100 text-ink-700 dark:bg-ink-700 dark:text-ink-100',
    badge: 'Admin',
    description:
      'Oversee the network. Manage drivers, vehicles, bookings, and monitor operations in real time.',
    actions: [{ to: '/login/admin', label: 'Admin login', variant: 'secondary' }],
  },
];

function HomePage() {
  const { isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && userRole) {
      switch (userRole) {
        case 'user':
          navigate('/user');
          break;
        case 'driver':
          navigate('/driver');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          break;
      }
    }
  }, [isAuthenticated, userRole, navigate]);

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-white to-ink-50 dark:from-ink-900 dark:via-ink-900 dark:to-ink-900" />
        <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(ellipse_at_top,rgba(53,112,245,0.18),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(53,112,245,0.3),transparent_60%)]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-ink-200 px-3 py-1 text-xs font-medium text-ink-700 shadow-sm dark:bg-ink-800/60 dark:border-ink-700 dark:text-ink-200">
            <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
            On-demand logistics, simplified
          </span>
          <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight text-ink-900 dark:text-ink-50">
            Move anything, anywhere, with{' '}
            <span className="text-brand-600 dark:text-brand-400">Logi</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-ink-600 dark:text-ink-300">
            Logi connects shippers with a trusted network of drivers. Book a
            delivery in seconds, follow it on the map in real time, and pay
            only for what you use.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button as={Link} to="/register/user" size="lg">
              Get started
            </Button>
            <Button as={Link} to="/register/driver" variant="secondary" size="lg">
              Drive with Logi
            </Button>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid gap-5 md:grid-cols-3">
          {roleCards.map((r) => (
            <Card key={r.title} className="flex flex-col">
              <CardBody className="flex flex-col gap-4 flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-50">{r.title}</h2>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.accent}`}
                  >
                    {r.badge}
                  </span>
                </div>
                <p className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed flex-1">
                  {r.description}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {r.actions.map((a) => (
                    <Button
                      key={a.label}
                      as={Link}
                      to={a.to}
                      variant={a.variant}
                      size="sm"
                    >
                      {a.label}
                    </Button>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
