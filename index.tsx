
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log("Bahia PMS: Starting system...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML = '<div style="color: red; padding: 20px; font-family: sans-serif;">Error: Root element not found.</div>';
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Bahia PMS: Application mounted.");
  } catch (error: any) {
    console.error("Mounting Error:", error);
    rootElement.innerHTML = `<div style="color: red; padding: 20px; font-family: monospace;">Mounting Error: ${error?.message || error}</div>`;
  }
}
