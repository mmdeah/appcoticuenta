// src/pages/settings.js
import { requireAuth }  from '../lib/auth.js';
import { navigate }     from '../lib/router.js';
import { supabase }     from '../lib/supabase.js';
import { toast }        from '../components/toast.js';
import { renderSidebar, initSidebarEvents, renderTopBar } from '../components/sidebar.js';

export async function renderSettings() {
  const auth = await requireAuth('client');
  if (!auth) return;
  const { profile } = auth;
  const companyId = profile.company_id;

  const { data: company } = await supabase.from('companies').select('*, company_config(*)').eq('id', companyId).single();
  const conf = company?.company_config?.[0] || {};

  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      ${renderSidebar('client', profile)}
      <div class="main-content">
        ${renderTopBar('Configuración')}
        <div class="page-content">
          <div class="tabs">
            <div class="tab active" data-tab="general">Empresa e Identidad</div>
            <div class="tab" data-tab="docs">Documentos y Legal</div>
            <div class="tab" data-tab="user">Mi Perfil</div>
          </div>

          <div class="card tab-content" id="tab-general">
            <h3 style="margin-bottom:4px">Datos de la empresa</h3>
            <p class="guide-text">Esta información aparece en el encabezado de tus cotizaciones y cuentas de cobro.</p>
            <div class="form-row cols-2">
              <div class="form-group"><label class="form-label">Nombre</label><input id="s-name" class="form-control" value="${company?.name||''}" readonly /></div>
              <div class="form-group"><label class="form-label">NIT / Cédula</label><input id="s-nit" class="form-control" value="${company?.nit||''}" readonly /></div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group"><label class="form-label">Dirección</label><input id="s-address" class="form-control" value="${company?.address||''}" /></div>
              <div class="form-group"><label class="form-label">Ciudad</label><input id="s-city" class="form-control" value="${company?.city||''}" /></div>
            </div>
            <div class="form-group"><label class="form-label">Sitio web</label><input id="s-website" class="form-control" value="${company?.website||''}" /></div>

            <div class="divider"></div>
            <h3 style="margin-bottom:16px">Identidad visual</h3>
            <div class="form-group">
              <label class="form-label">Logotipo (Archivo de imagen)</label>
              <p class="form-hint" style="opacity:.7;margin-top:0;margin-bottom:6px">Sube una foto de tu logo (JPG o PNG). Se mostrará en tus documentos.</p>
              <input type="file" id="s-logo-file" class="form-control" accept="image/*" />
              <img id="s-logo-preview" src="${company?.logo_url||''}" style="max-height:80px; margin-top:10px; display:${company?.logo_url?'block':'none'}" />
            </div>
            <div class="form-row cols-2">
              <div class="form-group">
                <label class="form-label">Color principal</label>
                <div class="color-row">
                  <input type="color" id="s-c1" value="${company?.primary_color||'#1e293b'}" style="padding:0;width:40px;height:40px;border:none" />
                  <span id="s-c1-v" style="font-family:monospace">${company?.primary_color||'#1e293b'}</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Color secundario</label>
                <div class="color-row">
                  <input type="color" id="s-c2" value="${company?.secondary_color||'#3b82f6'}" style="padding:0;width:40px;height:40px;border:none" />
                  <span id="s-c2-v" style="font-family:monospace">${company?.secondary_color||'#3b82f6'}</span>
                </div>
              </div>
            </div>
            <button class="btn btn-primary" id="btn-save-general" style="margin-top:16px">Guardar Empresa</button>
          </div>

          <div class="card tab-content" id="tab-docs" style="display:none">
            <h3 style="margin-bottom:4px">Opciones de Documentos</h3>
            <p class="guide-text">Estos valores se usan por defecto al crear una nueva cotización o cuenta de cobro.</p>
            <div class="form-group" style="margin-bottom:24px">
              <div class="toggle-group" style="margin-bottom:12px">
                <label class="toggle"><input type="checkbox" id="s-iva-en" ${conf.iva_enabled?'checked':''} /><span class="toggle-slider"></span></label>
                <span class="toggle-label">Aplicar IVA por defecto</span>
              </div>
              <div id="s-iva-box" style="display:${conf.iva_enabled?'block':'none'}">
                <label class="form-label">Porcentaje de IVA (%)</label>
                <input type="number" id="s-iva-val" class="form-control" value="${conf.iva_percent||19}" style="max-width:150px" />
              </div>
            </div>
            <div class="form-row cols-2">
              <div class="form-group"><label class="form-label">Sig. Cotización</label><input type="number" id="s-next-q" class="form-control" value="${conf.next_quote||1}" /></div>
              <div class="form-group"><label class="form-label">Sig. Factura</label><input type="number" id="s-next-i" class="form-control" value="${conf.next_invoice||1}" /></div>
            </div>

            <div class="divider"></div>
            <h3 style="margin-bottom:16px">Textos por defecto</h3>
            <div class="form-group"><label class="form-label">Condiciones comerciales</label><textarea id="s-terms" class="form-control">${conf.terms||''}</textarea></div>
            <div class="form-group"><label class="form-label">Garantía</label><textarea id="s-warr" class="form-control">${conf.warranty||''}</textarea></div>
            <button class="btn btn-primary" id="btn-save-docs" style="margin-top:16px">Guardar Configuración</button>
          </div>

          <div class="card tab-content" id="tab-user" style="display:none">
             <h3 style="margin-bottom:4px">Datos personales</h3>
             <p class="guide-text">Información de tu perfil de usuario dentro de la empresa.</p>
             <div class="form-group"><label class="form-label">Nombre</label><input id="u-name" class="form-control" value="${profile.name||''}" /></div>
             <div class="form-group"><label class="form-label">Teléfono</label><input id="u-phone" class="form-control" value="${profile.phone||''}" /></div>
             <button class="btn btn-primary" id="btn-save-user" style="margin-top:16px">Actualizar perfil</button>
             
             <div class="divider"></div>
             <h3 style="margin-bottom:16px;color:var(--c-danger)">Zona de peligro</h3>
             <button class="btn btn-outline" style="color:var(--c-danger);border-color:var(--c-danger)" onclick="alert('Contacta al administrador para eliminar tu cuenta.')">Solicitar eliminación de cuenta</button>
          </div>

        </div>
      </div>
    </div>
  `;

  initSidebarEvents();

  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).style.display = 'block';
    });
  });

  // UI Colors
  const c1=document.getElementById('s-c1'), c1v=document.getElementById('s-c1-v');
  const c2=document.getElementById('s-c2'), c2v=document.getElementById('s-c2-v');
  if(c1) c1.addEventListener('input', () => c1v.textContent = c1.value);
  if(c2) c2.addEventListener('input', () => c2v.textContent = c2.value);

  const ivaEn = document.getElementById('s-iva-en'), ivaBox = document.getElementById('s-iva-box');
  if(ivaEn) ivaEn.addEventListener('change', () => ivaBox.style.display = ivaEn.checked ? 'block' : 'none');

  const logoFile = document.getElementById('s-logo-file');
  const logoPreview = document.getElementById('s-logo-preview');
  let currentLogo = company?.logo_url || '';

  if (logoFile) {
    logoFile.addEventListener('change', e => {
      const file = e.target.files[0];
      if(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          currentLogo = e.target.result;
          logoPreview.src = currentLogo;
          logoPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Guardar General
  document.getElementById('btn-save-general').addEventListener('click', async () => {
    const btn = document.getElementById('btn-save-general');
    btn.disabled=true; btn.textContent='Guardando...';
    try {
      await supabase.from('companies').update({
        address: document.getElementById('s-address').value,
        city:    document.getElementById('s-city').value,
        website: document.getElementById('s-website').value,
        logo_url: currentLogo,
        primary_color: document.getElementById('s-c1').value,
        secondary_color: document.getElementById('s-c2').value
      }).eq('id', companyId);
      toast('Datos de empresa actualizados', 'success');
    } catch(e) { toast('Error al guardar', 'error'); }
    btn.disabled=false; btn.textContent='Guardar Empresa';
  });

  // Guardar Docs
  document.getElementById('btn-save-docs').addEventListener('click', async () => {
    const btn = document.getElementById('btn-save-docs');
    btn.disabled=true; btn.textContent='Guardando...';
    try {
      const payload = {
        iva_enabled: document.getElementById('s-iva-en').checked,
        iva_percent: document.getElementById('s-iva-val').value,
        next_quote:  document.getElementById('s-next-q').value,
        next_invoice:document.getElementById('s-next-i').value,
        terms:       document.getElementById('s-terms').value,
        warranty:    document.getElementById('s-warr').value
      };
      
      const { data: exist } = await supabase.from('company_config').select('company_id').eq('company_id', companyId).single();
      if (exist) await supabase.from('company_config').update(payload).eq('company_id', companyId);
      else await supabase.from('company_config').insert({ company_id: companyId, ...payload });
      
      toast('Opciones de documentos actualizadas', 'success');
    } catch(e) { toast('Error al guardar', 'error'); }
    btn.disabled=false; btn.textContent='Guardar Configuración';
  });

  // Guardar Usuario
  document.getElementById('btn-save-user').addEventListener('click', async () => {
    const btn = document.getElementById('btn-save-user');
    btn.disabled=true; btn.textContent='Actualizando...';
    try {
      await supabase.from('users').update({
        name: document.getElementById('u-name').value,
        phone: document.getElementById('u-phone').value
      }).eq('id', profile.id);
      toast('Perfil actualizado', 'success');
    } catch(e) { toast('Error', 'error'); }
    btn.disabled=false; btn.textContent='Actualizar perfil';
  });
}
