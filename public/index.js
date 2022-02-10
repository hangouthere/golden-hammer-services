import App from './app.js';

globalThis.addEventListener('load', () => {
  const app = new App();
  app._addLog('Started!');

  globalThis.app = app;
});
