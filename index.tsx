
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log("System booting...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Fatal: Root element #root not found in HTML.");
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("React application mounted successfully.");
  } catch (err) {
    console.error("React mounting failed:", err);
  }
}
