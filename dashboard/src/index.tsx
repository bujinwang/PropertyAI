import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './design-system/tokens/css-variables.css';
import './i18n';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { config, isProduction } from './config/environment';
import { reportPerformance } from './utils/monitoring';

// Service worker disabled for development debugging
// if (isProduction && 'serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/service-worker.js')
//       .then((registration) => {
//         console.log('SW registered: ', registration);
//       })
//       .catch((registrationError) => {
//         console.log('SW registration failed: ', registrationError);
//       });
//   });
// }

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Add error boundary for React rendering errors
const renderApp = () => {
  try {
    root.render(
      // Temporarily remove StrictMode to debug hook issues
      // <React.StrictMode>
        <App />
      // </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to render app:', error);
    
    // Fallback UI
    document.body.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        text-align: center;
        padding: 20px;
      ">
        <h1 style="color: #d32f2f; margin-bottom: 16px;">
          Application Error
        </h1>
        <p style="color: #666; margin-bottom: 24px;">
          We're sorry, but something went wrong. Please refresh the page or try again later.
        </p>
        <button 
          onclick="window.location.reload()" 
          style="
            background: #1976d2;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
          "
        >
          Refresh Page
        </button>
      </div>
    `;
  }
};

renderApp();

// Enhanced Web Vitals reporting with monitoring integration
reportWebVitals((metric) => {
  // Report to monitoring service
  reportPerformance({
    name: metric.name,
    value: metric.value,
    unit: 'ms',
    timestamp: new Date().toISOString(),
    environment: config.environment,
    version: config.version,
    metadata: {
      id: metric.id,
      delta: metric.delta,
      rating: metric.rating,
    },
  });

  // Log in development
  if (!isProduction) {
    console.log('Web Vital:', metric);
  }
});
