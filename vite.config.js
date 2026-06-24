import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';




function emitStaticRoutes() {
  return {
    name: 'emit-static-routes',
    closeBundle() {
      const dist = path.resolve('dist');
      const idx = path.join(dist, 'index.html');
      if (!fs.existsSync(idx)) return;
      
      
      const projectsHtml = fs.readFileSync(idx, 'utf8')
        .replace('href="https://zachy.cc/"', 'href="https://zachy.cc/projects"')
        .replace('<title>zoop — creative developer · real-time WebGL & motion</title>', '<title>All work · zoop</title>')
        .replace('<meta property="og:url" content="https://zachy.cc/" />', '<meta property="og:url" content="https://zachy.cc/projects" />');
      fs.writeFileSync(path.join(dist, 'projects.html'), projectsHtml);

      
      const changelogHtml = fs.readFileSync(idx, 'utf8')
        .replace('href="https://zachy.cc/"', 'href="https://zachy.cc/changelog"')
        .replace('<title>zoop — creative developer · real-time WebGL & motion</title>', '<title>Changelog · zoop</title>')
        .replace('<meta property="og:url" content="https://zachy.cc/" />', '<meta property="og:url" content="https://zachy.cc/changelog" />');
      fs.writeFileSync(path.join(dist, 'changelog.html'), changelogHtml);

      
      const githubHtml = fs.readFileSync(idx, 'utf8')
        .replace('href="https://zachy.cc/"', 'href="https://zachy.cc/github"')
        .replace('<title>zoop — creative developer · real-time WebGL & motion</title>', '<title>Open source · zoop</title>')
        .replace('<meta property="og:url" content="https://zachy.cc/" />', '<meta property="og:url" content="https://zachy.cc/github" />');
      fs.writeFileSync(path.join(dist, 'github.html'), githubHtml);
    },
  };
}

export default defineConfig({
  server: { host: true, port: 5173 },
  build: { target: 'esnext', assetsInlineLimit: 0 },
  plugins: [emitStaticRoutes()],
});
