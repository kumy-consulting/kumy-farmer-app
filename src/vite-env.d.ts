/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />
/// <reference types="vite-plugin-pwa/info" />

// Version de l'app et SHA du commit, injectés au build via `define` (vite.config.ts).
declare const __APP_VERSION__: string;
declare const __BUILD_SHA__: string;
