// src/pages/admin/config.js
import { requireAuth }  from '../../lib/auth.js';
import { supabase }     from '../../lib/supabase.js';
import { toast }        from '../../components/toast.js';
import { renderSidebar, initSidebarEvents, renderTopBar } from '../../components/sidebar.js';

export async function renderAdminConfig() {
  const auth = await requireAuth('admin');
  if (!auth) return;

  const { data: config } = await supabase.from('admin_config').select('*').single();
  const c = config || {};

  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      ${renderSidebar('admin', auth.profile)}
      <div class="main-content">
        ${renderTopBar('Configuración del Sistema')}
        <div class="page-content">
          <div class="card" style="max-width:600px">
            <h3 style="margin-bottom:16px">Datos para Pagos</h3>
            <div class="form-group">
              <label class="form-label">Precio del Plan Mensual (COP)</label>
              <input id="ac-price" class="form-control" value="${c.plan_price||''}" placeholder="50.000" />
            </div>
            <div class="form-row cols-2">
              <div class="form-group"><label class="form-label">Banco</label><input id="ac-bank" class="form-control" value="${c.bank_name||''}" /></div>
              <div class="form-group"><label class="form-label">Tipo de cuenta</label><input id="ac-type" class="form-control" value="${c.account_type||''}" /></div>
            </div>
            <div class="form-group"><label class="form-label">Número de cuenta</label><input id="ac-acc" class="form-control" value="${c.account_number||''}" /></div>
            <div class="form-row cols-2">
              <div class="form-group"><label class="form-label">Titular</label><input id="ac-holder" class="form-control" value="${c.account_holder||''}" /></div>
              <div class="form-group"><label class="form-label">Documento titular</label><input id="ac-doc" class="form-control" value="${c.holder_id||''}" /></div>
            </div>
            <div class="divider"></div>
            <h3 style="margin-bottom:16px">Contacto y Soporte</h3>
            <div class="form-group">
              <label class="form-label">WhatsApp de atención (formato internacional ej: 57300...)</label>
              <input id="ac-wa" class="form-control" value="${c.whatsapp_number||''}" />
            </div>
            <button class="btn btn-primary" id="btn-save-config" style="margin-top:16px">Guardar configuración</button>
          </div>
        </div>
      </div>
    </div>
  `;

  initSidebarEvents();

  document.getElementById('btn-save-config').addEventListener('click', async () => {
    const btn = document.getElementById('btn-save-config');
    btn.disabled=true; btn.textContent='Guardando...';
    try {
      const payload = {
        plan_price: document.getElementById('ac-price').value,
        bank_name: document.getElementById('ac-bank').value,
        account_type: document.getElementById('ac-type').value,
        account_number: document.getElementById('ac-acc').value,
        account_holder: document.getElementById('ac-holder').value,
        holder_id: document.getElementById('ac-doc').value,
        whatsapp_number: document.getElementById('ac-wa').value
      };
      
      const { data: exist } = await supabase.from('admin_config').select('id').single();
      if (exist) {
        await supabase.from('admin_config').update(payload).eq('id', exist.id);
      } else {
        await supabase.from('admin_config').insert(payload);
      }
      toast('Configuración guardada', 'success');
    } catch(err) {
      console.error(err);
      toast('Error al guardar', 'error');
    }
    btn.disabled=false; btn.textContent='Guardar configuración';
  });
}
