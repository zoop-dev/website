import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';




function emitProjectsHtml() {
  return {
    name: 'emit-projects-html',
    closeBundle() {
      const dist = path.resolve('dist');
      const idx = path.join(dist, 'index.html');
      if (fs.existsSync(idx)) fs.copyFileSync(idx, path.join(dist, 'projects.html'));
    },
  };
}

export default defineConfig({
  server: { host: true, port: 5173 },
  build: { target: 'esnext', assetsInlineLimit: 0 },
  plugins: [emitProjectsHtml()],
});
