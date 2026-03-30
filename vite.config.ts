import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, unlinkSync } from 'fs'

const cachePath = './cache.json'

const FeedCacheHmr = () => ({
  name: 'feed-cache-hmr',
  enforce: 'pre' as const,
  handleHotUpdate({ file }) {
    // If the root feed list is updated, remove the cached version
    if (file.endsWith('feeds.txt') && existsSync(cachePath)) {
      unlinkSync(cachePath)
    }
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), FeedCacheHmr()],
})
