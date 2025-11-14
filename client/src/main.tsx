import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { LandingPage } from './pages/landing/LandingPage';
import { ToastContainer } from './shared/ui/molecules/Toast';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

// Temporarily render LandingPage directly to ensure app works
// TODO: Integrate wouter routing after resolving React version conflicts
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <LandingPage />
    <ToastContainer />
  </React.StrictMode>
);
