
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log("Bahia PMS: Starting system...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML = '<div style="color: #ef4444; padding: 40px; font-family: sans-serif; text-align: center; background: #020617; height: 100vh;">Critical Error: Root element not found.</div>';
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Bahia PMS: Application mounted successfully.");
  } catch (error: any) {
    console.error("Mounting Error:", error);
    rootElement.innerHTML = `
      <div style="color: #f8fafc; padding: 40px; font-family: monospace; background: #020617; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
        <h1 style="color: #ef4444; font-size: 24px;">System Boot Failure</h1>
        <p style="margin-top: 20px; max-width: 600px; line-height: 1.6;">${error?.message || error}</p>
        <button onclick="window.location.reload()" style="margin-top: 30px; padding: 12px 24px; background: #0ea5e9; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Reload System</button>
      </div>
    `;
  }
}
