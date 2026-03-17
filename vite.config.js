import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [
      react({
        babel: {
          plugins: []
        }
      })
    ],
    
    root: '.',
    
    server: {
      port: 8080,
      open: true,
      host: '0.0.0.0',
      warmup: {
        clientFiles: [
          './src/main.jsx',
          './src/App.jsx'
        ]
      }
    },
    
    build: {
      outDir: 'dist',
      sourcemap: false,
      // 将大的依赖外部化，使用 CDN 加载
      rollupOptions: {
        external: ['superdoc', '@superdoc-dev/react'],
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'react-vendor'
              if (id.includes('@ai-sdk') || id.includes('ai')) return 'ai-vendor'
              return 'vendor'
            }
          },
          // 为外部依赖配置 CDN
          paths: (id) => {
            if (id === 'superdoc') {
              return 'https://esm.sh/superdoc@1.18.2'
            }

            if (id === '@superdoc-dev/react') {
              return 'https://esm.sh/@superdoc-dev/react@1.0.0-rc.2'
            }
          },
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]'
        }
      },
      chunkSizeWarningLimit: 500,
      minify: isProduction ? 'esbuild' : false,
      target: 'esnext',
      cssCodeSplit: true,
      emptyOutDir: true,
      reportCompressedSize: true
    },
    
    optimizeDeps: {
      include: [
        'react',
        'react-dom'
      ],
      exclude: [
        '@ai-sdk/openai', 
        '@ai-sdk/anthropic',
        'superdoc',
        '@superdoc-dev/react'
      ]
    },
    
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
      minify: isProduction
    },
    
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      alias: {
        '@': '/src',
        '@components': '/src/components',
        '@api': '/src/api',
        '@hooks': '/src/hooks'
      }
    },
    
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode)
    }
  }
})
