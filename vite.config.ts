import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 443,
    https: {
      key: fs.readFileSync('/etc/vibecast/ssl/privkey.pem'),
      cert: fs.readFileSync('/etc/vibecast/ssl/fullchain.pem'),
    },
    host: true, // чтобы был доступен извне, если нужно
  },
});
