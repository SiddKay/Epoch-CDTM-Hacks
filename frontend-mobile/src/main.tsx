import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { UploadInteractionProvider } from './contexts/UploadInteractionContext'; // Adjust path if needed

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UploadInteractionProvider>
      <App />
    </UploadInteractionProvider>
  </React.StrictMode>
);
