// src/pages/admin/dashboard.js
import { requireAuth }  from '../../lib/auth.js';
import { navigate }     from '../../lib/router.js';
import { supabase }     from '../../lib/supabase.js';
import { renderSidebar, initSidebarEvents, renderTopBar, refreshButton } from '../../components/sidebar.js';

export async function renderAdminDashboard() {
  const auth = await requireAuth('admin');
  if (!auth) return;
  const { profile } = auth;

  // Obtener KPIs
  const today = new Date().toISOString().split('T')[0];
  const in7   = new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [
    { count: activeUsers },
    { count: pendingReqs },
    { count: nearExpiry  },
    { count: expired     },
    { count: openTickets },
    { data: recentReqs   },
    { data: monthPayments}
  ] = await Promise.all([
    supabase.from('users').select('*', { count:'exact', head:true }).eq('status','active'),
    supabase.from('users').select('*', { count:'exact', head:true }).eq('status','pending'),
    supabase.from('payments').select('*', { count:'exact', head:true }).gte('expiry_date', today).lte('expiry_date', in7).eq('status','active'),
    supabase.from('payments').select('*', { count:'exact', head:true }).lt('expiry_date', today).eq('status','active'),
    supabase.from('tickets').select('*', { count:'exact', head:true }).eq('status','open'),
    supabase.from('users').select('*, companies(*)').eq('status','pending').order('request_date', { ascending:false }).limit(5),
    supabase.from('payments').select('amount').eq('status','active').gte('last_payment_date', monthStart),
  ]);

  const monthRevenue = (monthPayments || []).reduce((s, p) => s + (p.amount || 0), 0);

  const reqRows = (recentReqs || []).map(u => `
    <tr>
      <td><strong>${u.companies?.name || '—'}</strong></td>
      <td>${u.name || '—'}</td>
      <td>${u.email}</td>
      <td>${u.request_date ? new Date(u.request_date).toLocaleDateString('es-CO') : '—'}</td>
      <td><span class="badge badge-warning">Pendiente</span></td>
      <td>
        <div class="table-actions">
          <button class="btn btn-success btn-sm approve-btn" data-id="${u.id}">Aprobar</button>
          <button class="btn btn-outline btn-sm view-btn"    data-id="${u.id}">Ver</button>
        </div>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="6"><div class="empty-state" style="padding:24px">Sin solicitudes pendientes</div></td></tr>`;

  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      ${renderSidebar('admin', profile)}
      <div class="main-content">
        ${renderTopBar('Panel de Administración', refreshButton())}
        <div class="page-content">

          <div class="kpi-grid">
            ${kpiCard('Usuarios activos',    activeUsers ?? 0, '#eff6ff', blueIcon)}
            ${kpiCard('Solicitudes pend.',   pendingReqs ?? 0, '#fffbeb', warnIcon)}
            ${kpiCard('Próx. a vencer',      nearExpiry  ?? 0, '#fff7ed', orangeIcon)}
            ${kpiCard('Vencidos',            expired     ?? 0, '#fef2f2', redIcon)}
            ${kpiCard('Ingresos del mes',    '$' + monthRevenue.toLocaleString('es-CO'), '#f0fdf4', greenIcon)}
            ${kpiCard('Tickets abiertos',    openTickets ?? 0, '#fdf4ff', purpleIcon)}
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Solicitudes recientes</h3>
              <button class="btn btn-outline btn-sm" onclick="navigate('/admin/requests')">Ver todas</button>
            </div>
            <div class="table-wrap">
              <table class="table">
                <thead>
                  <tr>
                    <th>Empresa</th><th>Responsable</th><th>Correo</th>
                    <th>Fecha solicitud</th><th>Estado</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody id="req-tbody">${reqRows}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  initSidebarEvents();

  document.getElementById('btn-refresh')?.addEventListener('click', () => renderAdminDashboard());

  // Botones aprobar
  document.querySelectorAll('.approve-btn').forEach(btn => {
    btn.addEventListener('click', () => approveUser(btn.dataset.id));
  });
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate('/admin/requests'));
  });
}

async function approveUser(userId) {
  const today  = new Date().toISOString().split('T')[0];
  const expiry = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];

  const { error } = await supabase.from('users').update({ status: 'active' }).eq('id', userId);
  if (error) { alert('Error al aprobar'); return; }

  // Actualizar pago
  const { data: user } = await supabase.from('users').select('company_id').eq('id', userId).single();
  if (user?.company_id) {
    await supabase.from('payments')
      .update({ status: 'active', activation_date: today, expiry_date: expiry, last_payment_date: today })
      .eq('company_id', user.company_id)
      .eq('status', 'pending');
  }

  renderAdminDashboard();
}

function kpiCard(label, value, bg, iconSvg) {
  return `
    <div class="kpi-card">
      <div class="kpi-icon" style="background:${bg}">${iconSvg}</div>
      <div class="kpi-label">${label}</div>
      <div class="kpi-value">${value}</div>
    </div>
  `;
}

const blueIcon   = `<svg width="18" height="18" fill="none" stroke="#3b82f6" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`;
const warnIcon   = `<svg width="18" height="18" fill="none" stroke="#d97706" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>`;
const orangeIcon = `<svg width="18" height="18" fill="none" stroke="#ea580c" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
const redIcon    = `<svg width="18" height="18" fill="none" stroke="#dc2626" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
const greenIcon  = `<svg width="18" height="18" fill="none" stroke="#16a34a" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>`;
const purpleIcon = `<svg width="18" height="18" fill="none" stroke="#a855f7" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`;
