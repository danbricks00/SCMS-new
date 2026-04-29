/**
 * CryptoJS (AES) calls crypto.getRandomValues for salt/IV. React Native / Expo Go
 * does not provide it by default. This avoids needing react-native-get-random-values
 * when npm install fails (e.g. EACCES on node_modules).
 *
 * Uses Math.random — not CSPRNG; acceptable here because the AES key already ships in the app.
 */
(function installPolyfill() {
  const g = typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : {};
  if (g.crypto && typeof g.crypto.getRandomValues === 'function') {
    return;
  }
  if (!g.crypto) {
    g.crypto = {};
  }
  g.crypto.getRandomValues = (array) => {
    const len = array?.length ?? 0;
    for (let i = 0; i < len; i += 1) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  };
})();
