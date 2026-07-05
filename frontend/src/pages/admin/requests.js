// src/pages/admin/requests.js
import { requireAuth }  from '../../lib/auth.js';
import { supabase }     from '../../lib/supabase.js';
import { toast }        from '../../components/toast.js';
import { renderSidebar, initSidebarEvents, renderTopBar } from '../../components/sidebar.js';

export async function renderAdminRequests() {
  const auth = await requireAuth('admin');
  if (!auth) return;

  const { data: users } = await supabase.from('users')
    .select('*, companies(*)')
    .eq('status', 'pending')
    .order('request_date', { ascending: false });

  const rows = (users || []).map(u => `
    <tr>
      <td><strong>${u.companies?.name || '—'}</strong><div style="font-size:11px;color:var(--c-text-3)">NIT: ${u.companies?.nit||''}</div></td>
      <td>${u.name}</td>
      <td>${u.email}<br><small>${u.phone}</small></td>
      <td>${u.request_date ? new Date(u.request_date).toLocaleString('es-CO') : '—'}</td>
      <td>
        <button class="btn btn-success btn-sm approve-btn" data-id="${u.id}">Aprobar</button>
        <button class="btn btn-outline btn-sm reject-btn"  data-id="${u.id}" style="color:var(--c-danger);border-color:var(--c-danger)">Rechazar</button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="5"><div class="empty-state">No hay solicitudes pendientes.</div></td></tr>`;

  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      ${renderSidebar('admin', auth.profile)}
      <div class="main-content">
        ${renderTopBar('Solicitudes Pendientes')}
        <div class="page-content">
          <div class="card" style="padding:0">
            <div class="table-wrap">
              <table class="table">
                <thead><tr><th>Empresa</th><th>Responsable</th><th>Contacto</th><th>Fecha</th><th>Acciones</th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  initSidebarEvents();

  document.querySelectorAll('.approve-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if(!confirm('¿Aprobar este cliente y activar su suscripción?')) return;
      btn.disabled = true;
      const uid = btn.dataset.id;
      
      const today  = new Date().toISOString().split('T')[0];
      const expiry = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];

      await supabase.from('users').update({ status: 'active' }).eq('id', uid);
      const { data: user } = await supabase.from('users').select('company_id').eq('id', uid).single();
      if (user?.company_id) {
        await supabase.from('payments').update({ status: 'active', activation_date: today, expiry_date: expiry, last_payment_date: today }).eq('company_id', user.company_id).eq('status', 'pending');
      }
      toast('Cliente aprobado','success');
      renderAdminRequests();
    });
  });

  document.querySelectorAll('.reject-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if(!confirm('¿Rechazar esta solicitud? El usuario no podrá acceder.')) return;
      await supabase.from('users').update({ status: 'suspended' }).eq('id', btn.dataset.id);
      toast('Solicitud rechazada','success');
      renderAdminRequests();
    });
  });
}
