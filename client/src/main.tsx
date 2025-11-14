import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { LandingPage } from './pages/landing/LandingPage';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

// Temporarily simplify the app to test if basic React works
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <LandingPage />
  </React.StrictMode>
);
