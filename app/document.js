const { Head, Html, Main, NextScript } = require('@expo/next-adapter/document');
import React from 'react';

class CustomDocument extends React.Component {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Add Vercel Web Vitals script */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Vercel Web Vitals and Analytics
                console.log('[SCMS] Document loading...');
                window.addEventListener('load', function() {
                  console.log('[SCMS] Window loaded');
                  // Log all environment variables with EXPO_ prefix
                  Object.keys(window).forEach(key => {
                    if (key.startsWith('EXPO_') || key.startsWith('REACT_')) {
                      console.log('[SCMS ENV]', key, window[key]);
                    }
                  });
                });
                
                // Track React rendering
                const originalRender = React.createElement;
                React.createElement = function() {
                  const element = originalRender.apply(this, arguments);
                  if (arguments[0] && typeof arguments[0] === 'function' && arguments[0].name) {
                    console.log('[SCMS Render]', arguments[0].name);
                  }
                  return element;
                };
              `,
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                console.log('[SCMS] Body script executed');
                // Add error tracking
                window.onerror = function(message, source, lineno, colno, error) {
                  console.error('[SCMS ERROR]', message, 'at', source, lineno, colno, error);
                  return false;
                };
                // Track resource loading
                const observer = new PerformanceObserver((list) => {
                  list.getEntries().forEach((entry) => {
                    if (entry.initiatorType === 'script' || entry.initiatorType === 'css') {
                      console.log('[SCMS Resource]', entry.name, entry.duration + 'ms');
                    }
                  });
                });
                observer.observe({entryTypes: ['resource']});
              `,
            }}
          />
        </body>
      </Html>
    );
  }
}

export default CustomDocument;