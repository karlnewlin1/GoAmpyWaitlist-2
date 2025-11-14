import { createBrowserRouter } from 'react-router-dom';
import { LandingPage } from '../pages/landing/LandingPage';
import { TourPage } from '../pages/tour/TourPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { LoginPage } from '../pages/login/LoginPage';
export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/tour', element: <TourPage /> },
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/login', element: <LoginPage /> }
]);
