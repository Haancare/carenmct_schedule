import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { RecipientList } from './components/RecipientList';
import { RecipientDetail } from './components/RecipientDetail';
import { CareWorkerList } from './components/CareWorkerList';
import { ConsultationManagement } from './components/ConsultationManagement';
import { PaymentAssignment } from './components/PaymentAssignment';
import { CopaymentConfirmation } from './components/CopaymentConfirmation';
import { CarePlanManagement } from './components/CarePlanManagement';
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboard } from './components/AdminDashboard';
import { NamingGuide } from './components/NamingGuide';
import { AnnualBenefitLimit } from './components/AnnualBenefitLimit';
import { AnnualFeeRate } from './components/AnnualFeeRate';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    HydrateFallback: () => null,
    children: [
      { index: true, Component: () => React.createElement(Navigate, { to: '/dashboard', replace: true }) },
      { path: 'dashboard',                Component: Dashboard },
      { path: 'recipients',               Component: RecipientList },
      { path: 'recipients/:id',           Component: RecipientDetail },
      { path: 'care-workers',             Component: CareWorkerList },
      { path: 'payment-assignment',       Component: PaymentAssignment },
      { path: 'care-plan',                Component: CarePlanManagement },
      { path: 'consultation',             Component: ConsultationManagement },
      { path: 'copayment-confirmation',   Component: CopaymentConfirmation },
    ],
  },
  {
    path: '/admin',
    Component: AdminLayout,
    children: [
      { index: true,                   Component: AdminDashboard },
      { path: 'naming-guide',          Component: NamingGuide },
      { path: 'annual-benefit-limit',  Component: AnnualBenefitLimit },
      { path: 'annual-fee-rate',       Component: AnnualFeeRate },
    ],
  },
  { path: '/naming-guide', Component: () => React.createElement(Navigate, { to: '/admin/naming-guide', replace: true }) },
  { path: '*',             Component: () => React.createElement(Navigate, { to: '/dashboard', replace: true }) },
]);