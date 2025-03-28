import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    tsconfigPaths(),
  ],
  define: {
    'self': 'globalThis',
    'window': 'globalThis',
    'global': 'globalThis',
    'globalThis': 'globalThis',
  },
  optimizeDeps: {
    exclude: [
      'monaco-editor',
      '@monaco-editor/react',
    ],
    include: [
      '@remix-run/react',
      'react',
      'react-dom',
    ],
    esbuildOptions: {
      target: 'esnext',
    }
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco-editor': ['monaco-editor'],
          'monaco-editor-react': ['@monaco-editor/react'],
          'vendor': [
            'react',
            'react-dom',
            '@remix-run/react'
          ]
        }
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  server: {
    fs: {
      allow: [
        'node_modules/monaco-editor/min/vs',
        'node_modules/@monaco-editor/react'
      ]
    },
    hmr: {
      overlay: false
    }
  }
});