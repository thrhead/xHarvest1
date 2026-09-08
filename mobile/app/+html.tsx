import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <ScrollViewStyleReset />
        <title>Ekim-Hasat</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root { height: 100%; min-height: 100%; margin: 0; padding: 0; }
              body { background: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; -webkit-tap-highlight-color: transparent; }
              #app-global-error {
                display: none;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 24px;
                box-sizing: border-box;
                text-align: center;
                background-color: #f8fafc;
                color: #0f172a;
              }
              #app-global-error h2 { font-size: 20px; margin: 0 0 12px 0; color: #064e3b; font-weight: 700; }
              #app-global-error p { font-size: 14px; color: #475569; margin: 0 0 20px 0; max-width: 400px; line-height: 1.5; }
              #app-global-error button {
                background-color: #047857;
                color: #ffffff;
                border: none;
                padding: 12px 24px;
                font-size: 14px;
                font-weight: 600;
                border-radius: 10px;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function showError(msg) {
                  var root = document.getElementById('root');
                  var errBox = document.getElementById('app-global-error');
                  if (errBox) {
                    var desc = document.getElementById('app-global-error-msg');
                    if (desc && msg) desc.textContent = msg;
                    errBox.style.display = 'flex';
                  }
                }
                window.addEventListener('error', function(e) {
                  console.error('Global window error:', e);
                  showError(e.message || 'Sayfa yüklenirken bir hata oluştu.');
                });
                window.addEventListener('unhandledrejection', function(e) {
                  console.error('Global unhandled rejection:', e);
                  var reason = e.reason ? (e.reason.message || String(e.reason)) : '';
                  showError(reason || 'Sayfa yüklenirken beklenmeyen bir durum oluştu.');
                });
              })();
            `,
          }}
        />
      </head>
      <body>
        <div id="app-global-error">
          <h2>🌾 Ekim-Hasat Mobil</h2>
          <p id="app-global-error-msg">Sayfa yüklenirken bir aksaklık meydana geldi.</p>
          <button onclick="window.location.reload()">Yeniden Yükle</button>
        </div>
        {children}
      </body>
    </html>
  );
}
