
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("WEKEMS: Menghidupkan enjin aplikasi...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("WEKEMS: Elemen 'root' tidak dijumpai!");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("WEKEMS: Aplikasi berjaya dipaparkan.");
  } catch (error) {
    console.error("WEKEMS: Ralat semasa rendering:", error);
    rootElement.innerHTML = `
      <div style="height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif; text-align: center; padding: 20px;">
        <div>
          <h1 style="color: #e11d48;">Ralat Sistem</h1>
          <p>Gagal memuatkan aplikasi. Sila semak konsol browser untuk maklumat lanjut.</p>
          <pre style="background: #f1f5f9; padding: 10px; border-radius: 8px; font-size: 12px; margin-top: 20px; overflow: auto;">${error}</pre>
        </div>
      </div>
    `;
  }
}
