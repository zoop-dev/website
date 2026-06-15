import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';




function emitProjectsHtml() {
  return {
    name: 'emit-projects-html',
    closeBundle() {
      const dist = path.resolve('dist');
      const idx = path.join(dist, 'index.html');
      if (!fs.existsSync(idx)) return;
      
      const html = fs.readFileSync(idx, 'utf8')
        .replace('href="https://zachy.cc/"', 'href="https://zachy.cc/projects"')
        .replace('<title>zoop — creative developer · real-time WebGL & motion</title>', '<title>All work · zoop</title>')
        .replace('<meta property="og:url" content="https://zachy.cc/" />', '<meta property="og:url" content="https://zachy.cc/projects" />');
      fs.writeFileSync(path.join(dist, 'projects.html'), html);
    },
  };
}

export default defineConfig({
  server: { host: true, port: 5173 },
  build: { target: 'esnext', assetsInlineLimit: 0 },
  plugins: [emitProjectsHtml()],
});
