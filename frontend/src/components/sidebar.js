// src/components/sidebar.js
import { navigate } from '../lib/router.js';
import { logout }   from '../lib/auth.js';
import { toast }    from './toast.js';

const icon = {
  home:     `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  doc:      `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  invoice:  `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  clients:  `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
  history:  `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  settings: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
  support:  `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`,
  logout:   `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  users:    `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
  requests: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>`,
  config:   `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
};

const LOGO_SVG = `
<svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="10" fill="white" fill-opacity="0.15"/>
  <path d="M12 20h16M20 12v16" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;

export function renderSidebar(role = 'client', profile = {}) {
  const companyName = profile?.companies?.name || 'Mi empresa';
  const userName    = profile?.name || profile?.email || '';

  const clientLinks = `
    <a class="sidebar-link" data-route="/dashboard">${icon.home}Dashboard</a>
    <div class="sidebar-section">Documentos</div>
    <a class="sidebar-link" data-route="/quotes/new">${icon.doc}Nueva Cotización</a>
    <a class="sidebar-link" data-route="/invoices/new">${icon.invoice}Nueva Cuenta de Cobro</a>
    <a class="sidebar-link" data-route="/history">${icon.history}Historial</a>
    <div class="sidebar-section">Gestión</div>
    <a class="sidebar-link" data-route="/clients">${icon.clients}Clientes</a>
    <a class="sidebar-link" data-route="/settings">${icon.settings}Configuración</a>
    <div class="sidebar-section">Soporte</div>
    <a class="sidebar-link" data-route="/support">${icon.support}Centro de Soporte</a>
  `;

  const adminLinks = `
    <a class="sidebar-link" data-route="/admin/dashboard">${icon.home}Dashboard</a>
    <div class="sidebar-section">Gestión</div>
    <a class="sidebar-link" data-route="/admin/requests">${icon.requests}Solicitudes</a>
    <a class="sidebar-link" data-route="/admin/users">${icon.users}Usuarios</a>
    <a class="sidebar-link" data-route="/admin/tickets">${icon.support}Tickets</a>
    <div class="sidebar-section">Sistema</div>
    <a class="sidebar-link" data-route="/admin/config">${icon.config}Configuración</a>
  `;

  const html = `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        ${LOGO_SVG}
        <span class="sidebar-brand-text">CotiCuenta</span>
      </div>
      <nav class="sidebar-nav">
        ${role === 'admin' ? adminLinks : clientLinks}
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">${userName}</div>
        <div class="sidebar-company">${companyName}</div>
        <button class="btn btn-ghost btn-sm" id="btn-logout" style="color:rgba(255,255,255,.6);padding-left:0">
          ${icon.logout} Cerrar sesión
        </button>
      </div>
    </aside>
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
  `;

  return html;
}

export function initSidebarEvents() {
  // Navegación
  document.querySelectorAll('.sidebar-link[data-route]').forEach(link => {
    link.addEventListener('click', () => {
      const route = link.dataset.route;
      closeMobileSidebar();
      navigate(route);
    });
  });

  // Marcar enlace activo
  function markActive() {
    const path = window.location.hash.replace('#', '') || '/dashboard';
    document.querySelectorAll('.sidebar-link').forEach(l => {
      l.classList.toggle('active', l.dataset.route === path);
    });
  }
  markActive();
  window.addEventListener('hashchange', markActive);

  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await logout();
    toast('Sesión cerrada', 'default');
    navigate('/login');
  });

  // Hamburger
  document.getElementById('hamburger')?.addEventListener('click', openMobileSidebar);
  document.getElementById('sidebar-overlay')?.addEventListener('click', closeMobileSidebar);
}

function openMobileSidebar() {
  document.getElementById('sidebar')?.classList.add('open');
  document.getElementById('sidebar-overlay')?.classList.add('visible');
}
function closeMobileSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('visible');
}

export function renderTopBar(title, extra = '') {
  return `
    <div class="top-bar">
      <div class="top-bar-left">
        <button class="hamburger" id="hamburger">
          <span></span><span></span><span></span>
        </button>
        <h2 class="top-bar-title">${title}</h2>
      </div>
      <div class="top-bar-right">${extra}</div>
    </div>
  `;
}
