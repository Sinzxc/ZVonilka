import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    https: {
      key: fs.readFileSync('/etc/vibecast/ssl/privkey.pem'),
      cert: fs.readFileSync('/etc/vibecast/ssl/fullchain.pem'),
    },
    host: '0.0.0.0',
    port: 443,
  },
});
