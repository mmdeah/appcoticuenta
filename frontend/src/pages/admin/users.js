// src/pages/admin/users.js
import { requireAuth }  from '../../lib/auth.js';
import { supabase }     from '../../lib/supabase.js';
import { toast }        from '../../components/toast.js';
import { renderSidebar, initSidebarEvents, renderTopBar, refreshButton } from '../../components/sidebar.js';

export async function renderAdminUsers() {
  const auth = await requireAuth('admin');
  if (!auth) return;

  const { data: users } = await supabase.from('users')
    .select('*, companies(*)')
    .in('status', ['active', 'suspended'])
    .order('name');

  const rows = (users || []).map(u => {
    const badge = u.status === 'active' ? '<span class="badge badge-success">Activo</span>' : '<span class="badge badge-danger">Suspendido</span>';
    return `
      <tr>
        <td><strong>${u.companies?.name || '—'}</strong><div style="font-size:11px;color:var(--c-text-3)">NIT: ${u.companies?.nit||''}</div></td>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${badge}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-outline btn-sm toggle-status" data-id="${u.id}" data-status="${u.status}">
              ${u.status === 'active' ? 'Suspender' : 'Activar'}
            </button>
            ${u.status === 'suspended' ? `<button class="btn btn-outline btn-sm archive-btn" data-id="${u.id}" style="color:var(--c-text-3)">Archivar</button>` : ''}
            <button class="btn btn-danger btn-sm delete-user-btn" data-id="${u.id}">Eliminar</button>
          </div>
        </td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="5"><div class="empty-state">No hay usuarios registrados.</div></td></tr>`;

  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      ${renderSidebar('admin', auth.profile)}
      <div class="main-content">
        ${renderTopBar('Usuarios Activos', refreshButton())}
        <div class="page-content">
          <div class="search-bar">
            <div class="search-input-wrap">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input id="u-search" type="text" class="form-control" placeholder="Buscar usuario o empresa..." />
            </div>
          </div>
          <div class="card" style="padding:0">
            <div class="table-wrap">
              <table class="table" id="users-table">
                <thead><tr><th>Empresa</th><th>Responsable</th><th>Correo</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  initSidebarEvents();

  document.getElementById('btn-refresh')?.addEventListener('click', () => renderAdminUsers());

  document.getElementById('u-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('#users-table tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  document.querySelectorAll('.toggle-status').forEach(btn => {
    btn.addEventListener('click', async () => {
      const newStatus = btn.dataset.status === 'active' ? 'suspended' : 'active';
      if(!confirm(`¿Seguro que deseas ${newStatus==='active'?'activar':'suspender'} este usuario?`)) return;
      
      btn.disabled = true;
      await supabase.from('users').update({ status: newStatus }).eq('id', btn.dataset.id);
      toast('Estado actualizado', 'success');
      renderAdminUsers();
    });
  });

  document.querySelectorAll('.archive-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if(!confirm('¿Seguro que deseas archivar este usuario permanentemente? No aparecerá en esta lista.')) return;
      btn.disabled = true;
      await supabase.from('users').update({ status: 'archived' }).eq('id', btn.dataset.id);
      toast('Usuario archivado', 'success');
      renderAdminUsers();
    });
  });

  document.querySelectorAll('.delete-user-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if(!confirm('¿Eliminar este usuario permanentemente de la aplicación? Esta acción no se puede deshacer.')) return;
      btn.disabled = true;
      const { error } = await supabase.from('users').delete().eq('id', btn.dataset.id);
      if (error) { toast('Error al eliminar. Revisa la consola.', 'error'); console.error(error); btn.disabled = false; return; }
      toast('Usuario eliminado', 'success');
      renderAdminUsers();
    });
  });
}
