import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import { theme } from './theme';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

// Add global styles
const style = document.createElement('style');
style.textContent = `
  body {
    background: ${theme.palette.background.default};
    min-height: 100vh;
    margin: 0;
    background-image: radial-gradient(at 40% 20%, rgba(124, 77, 255, 0.15) 0px, transparent 50%),
                      radial-gradient(at 80% 0%, rgba(0, 229, 255, 0.1) 0px, transparent 50%),
                      radial-gradient(at 0% 50%, rgba(124, 77, 255, 0.1) 0px, transparent 50%);
    background-attachment: fixed;
  }

  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(124, 77, 255, 0.3);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(124, 77, 255, 0.5);
  }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <App />
        </ThemeProvider>
    </React.StrictMode>
); 