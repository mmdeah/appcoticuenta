// src/pages/history.js
import { requireAuth }  from '../lib/auth.js';
import { supabase }     from '../lib/supabase.js';
import { renderSidebar, initSidebarEvents, renderTopBar } from '../components/sidebar.js';

export async function renderHistory() {
  const auth = await requireAuth('client');
  if (!auth) return;
  const { profile } = auth;
  const companyId = profile.company_id;

  const { data: docs } = await supabase.from('documents')
    .select('*, clients(name)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  const rows = (docs || []).map(d => `
    <tr>
      <td><span class="badge ${d.type==='quote'?'badge-info':'badge-success'}">${d.type==='quote'?'Cotización':'Cuenta de Cobro'}</span></td>
      <td><strong>${d.type==='quote'?'COT':'CC'}-${String(d.number).padStart(4,'0')}</strong></td>
      <td>${d.clients?.name || '—'}</td>
      <td>${new Date(d.issue_date).toLocaleDateString('es-CO')}</td>
      <td style="font-weight:600">$${(d.grand_total || 0).toLocaleString('es-CO')}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="alert('Generación de PDF en progreso...')">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Descargar PDF
        </button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="6"><div class="empty-state" style="padding:20px">No hay documentos generados.</div></td></tr>`;

  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      ${renderSidebar('client', profile)}
      <div class="main-content">
        ${renderTopBar('Historial de Documentos')}
        <div class="page-content">
          <div class="card" style="padding:0">
            <div class="table-wrap">
              <table class="table">
                <thead><tr><th>Tipo</th><th>Número</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Acciones</th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  initSidebarEvents();
}
