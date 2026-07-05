// src/pages/dashboard.js
import { requireAuth, getDaysRemaining } from '../lib/auth.js';
import { navigate }  from '../lib/router.js';
import { supabase }  from '../lib/supabase.js';
import { renderSidebar, initSidebarEvents, renderTopBar } from '../components/sidebar.js';

export async function renderDashboard() {
  const auth = await requireAuth('client');
  if (!auth) return;
  const { profile } = auth;

  // Obtener datos resumidos
  const companyId = profile.company_id;
  const [{ count: clientCount }, { count: quoteCount }, { count: invoiceCount }, { count: ticketCount }] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('type', 'quote'),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('type', 'invoice'),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'open'),
  ]);

  // Días restantes de suscripción
  const { data: payment } = await supabase
    .from('payments')
    .select('expiry_date')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .order('expiry_date', { ascending: false })
    .limit(1)
    .single();

  const daysLeft = getDaysRemaining(payment?.expiry_date);

  let subsAlert = '';
  if (daysLeft !== null && daysLeft <= 7 && daysLeft > 3) {
    subsAlert = `<div class="subs-alert subs-alert-warning">
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      Tu suscripción vence en <strong>${daysLeft} días</strong>. Realiza tu pago para no perder el acceso.
    </div>`;
  } else if (daysLeft !== null && daysLeft <= 3) {
    subsAlert = `<div class="subs-alert subs-alert-danger">
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      ⚠️ Tu suscripción vence en <strong>${daysLeft} días</strong>. Contacta al administrador urgente.
    </div>`;
  }

  const actionCards = [
    { icon: docIcon,     label: 'Nueva Cotización',     route: '/quotes/new'   },
    { icon: invoiceIcon, label: 'Nueva Cuenta de Cobro', route: '/invoices/new' },
    { icon: clientsIcon, label: 'Clientes',              route: '/clients'      },
    { icon: historyIcon, label: 'Historial',             route: '/history'      },
    { icon: configIcon,  label: 'Configuración',         route: '/settings'     },
    { icon: supportIcon, label: 'Centro de Soporte',     route: '/support'      },
  ];

  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      ${renderSidebar('client', profile)}
      <div class="main-content">
        ${renderTopBar('Dashboard')}
        <div class="page-content">
          <p class="guide-text">Resumen de tu actividad. Usa los accesos rápidos para crear cotizaciones, cuentas de cobro o gestionar tus clientes.</p>
          ${subsAlert}

          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-icon" style="background:#eff6ff">${clientsIcon}</div>
              <div class="kpi-label">Clientes</div>
              <div class="kpi-value">${clientCount ?? 0}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon" style="background:#f0fdf4">${docIcon}</div>
              <div class="kpi-label">Cotizaciones</div>
              <div class="kpi-value">${quoteCount ?? 0}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon" style="background:#fdf4ff">${invoiceIcon}</div>
              <div class="kpi-label">Cuentas de Cobro</div>
              <div class="kpi-value">${invoiceCount ?? 0}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon" style="background:#fffbeb">${supportIcon}</div>
              <div class="kpi-label">Tickets abiertos</div>
              <div class="kpi-value">${ticketCount ?? 0}</div>
            </div>
            ${daysLeft !== null ? `
            <div class="kpi-card">
              <div class="kpi-icon" style="background:${daysLeft <= 3 ? 'var(--c-danger-bg)' : daysLeft <= 7 ? 'var(--c-warning-bg)' : 'var(--c-success-bg)'}">
                ${calIcon}
              </div>
              <div class="kpi-label">Días de suscripción</div>
              <div class="kpi-value" style="color:${daysLeft <= 3 ? 'var(--c-danger)' : daysLeft <= 7 ? 'var(--c-warning)' : 'var(--c-success)'}">${daysLeft}</div>
            </div>` : ''}
          </div>

          <h3 style="margin-bottom:14px">Accesos rápidos</h3>
          <div class="actions-grid">
            ${actionCards.map(a => `
              <div class="action-card" data-route="${a.route}">
                <div class="action-icon">${a.icon}</div>
                <div class="action-label">${a.label}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  initSidebarEvents();

  document.querySelectorAll('.action-card[data-route]').forEach(card => {
    card.addEventListener('click', () => navigate(card.dataset.route));
  });
}

// Icons
const docIcon     = `<svg width="18" height="18" fill="none" stroke="#3b82f6" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
const invoiceIcon = `<svg width="18" height="18" fill="none" stroke="#a855f7" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
const clientsIcon = `<svg width="18" height="18" fill="none" stroke="#3b82f6" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`;
const historyIcon = `<svg width="18" height="18" fill="none" stroke="#16a34a" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const configIcon  = `<svg width="18" height="18" fill="none" stroke="#0284c7" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`;
const supportIcon = `<svg width="18" height="18" fill="none" stroke="#d97706" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`;
const calIcon     = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
