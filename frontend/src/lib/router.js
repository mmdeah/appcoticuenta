// src/lib/router.js
// Router SPA basado en hash (#/ruta)

const routes = new Map();
let currentPath = null;

export function route(path, handler) {
  routes.set(path, handler);
}

export function navigate(path) {
  window.location.hash = path;
}

export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

export function getCurrentPath() {
  return currentPath;
}

function handleRoute() {
  const raw   = window.location.hash.replace('#', '') || '/login';
  const path  = raw.split('?')[0];
  currentPath = path;

  // Buscar ruta exacta
  let handler = routes.get(path);

  // Buscar ruta con parámetro (ej: /quotes/:id)
  if (!handler) {
    for (const [pattern, fn] of routes) {
      const regex = new RegExp('^' + pattern.replace(/:\w+/g, '([^/]+)') + '$');
      const match = path.match(regex);
      if (match) {
        const paramNames = (pattern.match(/:\w+/g) || []).map(p => p.slice(1));
        const params = {};
        paramNames.forEach((name, i) => { params[name] = match[i + 1]; });
        handler = () => fn(params);
        break;
      }
    }
  }

  if (handler) {
    handler();
  } else {
    navigate('/login');
  }
}
