// https://github.com/pinojs/real-require/blob/main/src/index.js
const importFn = new Function('modulePath', 'return import(modulePath)')
importFn('./import-map')

// 👇 Works
// import('./import-map')
