// src/pages/clients.js
import { requireAuth }  from '../lib/auth.js';
import { navigate }     from '../lib/router.js';
import { supabase }     from '../lib/supabase.js';
import { toast }        from '../components/toast.js';
import { renderSidebar, initSidebarEvents, renderTopBar } from '../components/sidebar.js';

export async function renderClients() {
  const auth = await requireAuth('client');
  if (!auth) return;
  const { profile } = auth;
  const companyId = profile.company_id;

  const { data: clients } = await supabase.from('clients').select('*').eq('company_id', companyId).order('name');

  const rows = (clients || []).map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.company || '—'}</td>
      <td>${c.nit || '—'}</td>
      <td>${c.phone || '—'}</td>
      <td>${c.email || '—'}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-outline btn-sm edit-client" data-id="${c.id}">Editar</button>
          <button class="btn btn-danger btn-sm delete-client" data-id="${c.id}">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="6"><div class="empty-state" style="padding:20px">No hay clientes. ¡Agrega el primero!</div></td></tr>`;

  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      ${renderSidebar('client', profile)}
      <div class="main-content">
        ${renderTopBar('Clientes', `<button class="btn btn-primary" id="btn-new-client">+ Nuevo cliente</button>`)}
        <div class="page-content">
          <p class="guide-text">Aquí administras tus clientes registrados. Al crear una cotización o cuenta de cobro también puedes usar "Consumidor final" si no requieres un cliente específico.</p>
          <div class="search-bar">
            <div class="search-input-wrap">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input id="client-search" type="text" class="form-control" placeholder="Buscar cliente..." />
            </div>
          </div>
          <div class="card" style="padding:0">
            <div class="table-wrap">
              <table class="table" id="clients-table">
                <thead><tr><th>Nombre</th><th>Empresa</th><th>NIT</th><th>Teléfono</th><th>Correo</th><th>Acciones</th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal nuevo/editar cliente -->
    <div class="modal-overlay" id="client-modal" style="display:none">
      <div class="modal" style="max-width:500px">
        <div class="modal-header">
          <h3 class="modal-title" id="modal-title">Nuevo cliente</h3>
          <button class="modal-close" id="modal-close">×</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="c-id" />
          <div class="form-row cols-2">
            <div class="form-group"><label class="form-label">Nombre <span>*</span></label><input id="c-name"    class="form-control" placeholder="Juan Pérez" /></div>
            <div class="form-group"><label class="form-label">Empresa</label><input id="c-company" class="form-control" placeholder="Empresa S.A.S." /></div>
          </div>
          <div class="form-row cols-2">
            <div class="form-group"><label class="form-label">NIT / Cédula</label><input id="c-nit"    class="form-control" placeholder="900123456-7" /></div>
            <div class="form-group"><label class="form-label">Teléfono</label><input id="c-phone"  class="form-control" placeholder="3001234567" /></div>
          </div>
          <div class="form-group"><label class="form-label">Correo</label><input id="c-email" type="email" class="form-control" placeholder="cliente@correo.com" /></div>
          <div class="form-row cols-2">
            <div class="form-group"><label class="form-label">Dirección</label><input id="c-address" class="form-control" /></div>
            <div class="form-group"><label class="form-label">Ciudad</label><input id="c-city"    class="form-control" /></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="modal-cancel">Cancelar</button>
          <button class="btn btn-primary" id="modal-save">Guardar</button>
        </div>
      </div>
    </div>
  `;

  initSidebarEvents();
  initClientModal(companyId);
  initClientSearch();

  document.querySelectorAll('.edit-client').forEach(btn => {
    btn.addEventListener('click', () => openEditClient(btn.dataset.id, clients));
  });
  document.querySelectorAll('.delete-client').forEach(btn => {
    btn.addEventListener('click', () => deleteClient(btn.dataset.id));
  });
}

function initClientSearch() {
  document.getElementById('client-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('#clients-table tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}

function openModal() { document.getElementById('client-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('client-modal').style.display = 'none'; }

function initClientModal(companyId) {
  document.getElementById('btn-new-client').addEventListener('click', () => {
    document.getElementById('modal-title').textContent = 'Nuevo cliente';
    ['c-id','c-name','c-company','c-nit','c-phone','c-email','c-address','c-city'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    openModal();
  });
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);

  document.getElementById('modal-save').addEventListener('click', async () => {
    const id      = document.getElementById('c-id').value;
    const name    = document.getElementById('c-name').value.trim();
    const company = document.getElementById('c-company').value.trim();
    const nit     = document.getElementById('c-nit').value.trim();
    const phone   = document.getElementById('c-phone').value.trim();
    const email   = document.getElementById('c-email').value.trim();
    const address = document.getElementById('c-address').value.trim();
    const city    = document.getElementById('c-city').value.trim();

    if (!name) { toast('El nombre es obligatorio', 'error'); return; }

    const payload = { name, company, nit, phone, email, address, city, company_id: companyId };

    if (id) {
      await supabase.from('clients').update(payload).eq('id', id);
      toast('Cliente actualizado', 'success');
    } else {
      await supabase.from('clients').insert(payload);
      toast('Cliente creado', 'success');
    }
    closeModal();
    renderClients();
  });
}

function openEditClient(id, clients) {
  const c = clients.find(x => x.id === id);
  if (!c) return;
  document.getElementById('modal-title').textContent = 'Editar cliente';
  document.getElementById('c-id').value      = c.id;
  document.getElementById('c-name').value    = c.name    || '';
  document.getElementById('c-company').value = c.company || '';
  document.getElementById('c-nit').value     = c.nit     || '';
  document.getElementById('c-phone').value   = c.phone   || '';
  document.getElementById('c-email').value   = c.email   || '';
  document.getElementById('c-address').value = c.address || '';
  document.getElementById('c-city').value    = c.city    || '';
  openModal();
}

async function deleteClient(id) {
  if (!confirm('¿Eliminar este cliente?')) return;
  await supabase.from('clients').delete().eq('id', id);
  toast('Cliente eliminado', 'success');
  renderClients();
}
