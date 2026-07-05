// src/pages/wizard.js
import { requireAuth }  from '../lib/auth.js';
import { navigate }     from '../lib/router.js';
import { supabase }     from '../lib/supabase.js';
import { toast }        from '../components/toast.js';

const LOGO = `<svg width="32" height="32" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="#1e293b"/><path d="M12 20h16M20 12v16" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`;

export async function renderWizard() {
  const auth = await requireAuth('client');
  if (!auth) return;
  const { profile } = auth;
  const companyId = profile.company_id;

  // Si ya tiene dirección, asumimos que completó el wizard
  if (profile?.companies?.address) {
    navigate('/dashboard');
    return;
  }

  let currentStep = 1;

  document.getElementById('app').innerHTML = `
    <div class="auth-page" style="background:#f1f5f9; align-items:flex-start; padding-top:60px;">
      <div class="card" style="max-width:600px; width:100%; padding:32px;">
        <div class="auth-logo" style="justify-content:center; margin-bottom:24px;">${LOGO} CotiCuenta</div>
        <h2 style="text-align:center; margin-bottom:8px;">Configuración inicial</h2>
        <p style="text-align:center; color:var(--c-text-2); margin-bottom:32px;">
          Completa estos pasos para personalizar tus documentos.
        </p>

        <div class="wizard-steps">
          <div class="wizard-step active" id="step-1-marker">
            <div class="wizard-step-num">1</div><div class="wizard-step-label">Empresa</div>
          </div>
          <div class="wizard-step" id="step-2-marker">
            <div class="wizard-step-num">2</div><div class="wizard-step-label">Identidad</div>
          </div>
          <div class="wizard-step" id="step-3-marker">
            <div class="wizard-step-num">3</div><div class="wizard-step-label">Legal</div>
          </div>
          <div class="wizard-step" id="step-4-marker">
            <div class="wizard-step-num">4</div><div class="wizard-step-label">Opciones</div>
          </div>
        </div>

        <div id="step-1" class="wizard-content">
          <div class="form-group"><label class="form-label">Dirección <span>*</span></label><input id="w-address" class="form-control" placeholder="Av. Principal #123" /></div>
          <div class="form-row cols-2">
            <div class="form-group"><label class="form-label">Ciudad <span>*</span></label><input id="w-city" class="form-control" placeholder="Bogotá" /></div>
            <div class="form-group"><label class="form-label">Sitio web</label><input id="w-website" class="form-control" placeholder="www.miempresa.com" /></div>
          </div>
        </div>

        <div id="step-2" class="wizard-content" style="display:none">
          <div class="form-group">
            <label class="form-label">Logotipo (URL) <span style="font-size:12px;font-weight:400;color:var(--c-text-3)">(Opcional)</span></label>
            <input id="w-logo" class="form-control" placeholder="https://ejemplo.com/logo.png" />
          </div>
          <div class="form-row cols-2">
            <div class="form-group">
              <label class="form-label">Color principal</label>
              <div class="color-row">
                <input type="color" id="w-color1" value="#1e293b" style="padding:0;width:40px;height:40px;border:none;border-radius:4px" />
                <span id="w-color1-val" style="font-family:monospace;font-size:13px">#1e293b</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Color secundario</label>
              <div class="color-row">
                <input type="color" id="w-color2" value="#3b82f6" style="padding:0;width:40px;height:40px;border:none;border-radius:4px" />
                <span id="w-color2-val" style="font-family:monospace;font-size:13px">#3b82f6</span>
              </div>
            </div>
          </div>
        </div>

        <div id="step-3" class="wizard-content" style="display:none">
          <div class="form-group"><label class="form-label">Condiciones comerciales</label><textarea id="w-terms" class="form-control" placeholder="Términos y condiciones..."></textarea></div>
          <div class="form-group"><label class="form-label">Garantía</label><textarea id="w-warranty" class="form-control" placeholder="Detalles de la garantía..."></textarea></div>
          <div class="form-row cols-2">
            <div class="form-group"><label class="form-label">Forma de pago</label><input id="w-paymode" class="form-control" placeholder="Ej: Contado, 50% anticipo" /></div>
            <div class="form-group"><label class="form-label">Validez de oferta</label><input id="w-validity" class="form-control" placeholder="Ej: 15 días" /></div>
          </div>
        </div>

        <div id="step-4" class="wizard-content" style="display:none">
          <div class="form-group" style="margin-bottom:24px">
            <div class="toggle-group" style="margin-bottom:12px">
              <label class="toggle"><input type="checkbox" id="w-iva-btn" /><span class="toggle-slider"></span></label>
              <span class="toggle-label">Aplicar IVA por defecto</span>
            </div>
            <div id="w-iva-box" style="display:none">
              <label class="form-label">Porcentaje de IVA (%)</label>
              <input type="number" id="w-iva-val" class="form-control" value="19" style="max-width:150px" />
            </div>
          </div>
          <div class="form-row cols-2">
            <div class="form-group"><label class="form-label">Siguiente número de Cotización</label><input type="number" id="w-num-q" class="form-control" value="1" /></div>
            <div class="form-group"><label class="form-label">Siguiente número de Factura</label><input type="number" id="w-num-i" class="form-control" value="1" /></div>
          </div>
        </div>

        <div class="divider"></div>
        
        <div style="display:flex;justify-content:space-between;align-items:center">
          <button class="btn btn-outline" id="w-prev" style="visibility:hidden">Atrás</button>
          <button class="btn btn-primary" id="w-next">Siguiente</button>
        </div>

      </div>
    </div>
  `;

  // Colores (UI)
  const c1 = document.getElementById('w-color1');
  const c1v = document.getElementById('w-color1-val');
  c1.addEventListener('input', () => c1v.textContent = c1.value);
  
  const c2 = document.getElementById('w-color2');
  const c2v = document.getElementById('w-color2-val');
  c2.addEventListener('input', () => c2v.textContent = c2.value);

  // IVA
  const ivaBtn = document.getElementById('w-iva-btn');
  const ivaBox = document.getElementById('w-iva-box');
  ivaBtn.addEventListener('change', () => ivaBox.style.display = ivaBtn.checked ? 'block' : 'none');

  // Navegación
  const btnPrev = document.getElementById('w-prev');
  const btnNext = document.getElementById('w-next');

  function updateSteps() {
    [1,2,3,4].forEach(i => {
      document.getElementById(`step-${i}`).style.display = (i === currentStep) ? 'block' : 'none';
      const marker = document.getElementById(`step-${i}-marker`);
      marker.classList.remove('active', 'done');
      if (i < currentStep) marker.classList.add('done');
      else if (i === currentStep) marker.classList.add('active');
    });
    btnPrev.style.visibility = currentStep > 1 ? 'visible' : 'hidden';
    btnNext.textContent = currentStep === 4 ? 'Finalizar' : 'Siguiente';
  }

  btnPrev.addEventListener('click', () => { if (currentStep > 1) { currentStep--; updateSteps(); } });
  
  btnNext.addEventListener('click', async () => {
    // Validaciones por paso
    if (currentStep === 1) {
      if (!document.getElementById('w-address').value || !document.getElementById('w-city').value) {
        toast('Dirección y ciudad son obligatorios', 'error'); return;
      }
    }
    
    if (currentStep < 4) {
      currentStep++; updateSteps(); return;
    }

    // Finalizar (Guardar en DB)
    btnNext.disabled = true; btnNext.textContent = 'Guardando...';

    const address = document.getElementById('w-address').value;
    const city    = document.getElementById('w-city').value;
    const web     = document.getElementById('w-website').value;
    const logo    = document.getElementById('w-logo').value;
    const col1    = c1.value;
    const col2    = c2.value;

    const terms   = document.getElementById('w-terms').value;
    const warr    = document.getElementById('w-warranty').value;
    const pmode   = document.getElementById('w-paymode').value;
    const valid   = document.getElementById('w-validity').value;

    const iva_enabled = ivaBtn.checked;
    const iva_pct     = document.getElementById('w-iva-val').value;
    const next_q      = document.getElementById('w-num-q').value;
    const next_i      = document.getElementById('w-num-i').value;

    try {
      // Update companies
      await supabase.from('companies').update({
        address, city, website: web, logo_url: logo, primary_color: col1, secondary_color: col2
      }).eq('id', companyId);

      // Create/Update company_config
      const { data: existConf } = await supabase.from('company_config').select('company_id').eq('company_id', companyId).single();
      const payloadConfig = { 
        iva_enabled, 
        iva_percent: iva_enabled ? iva_pct : 0,
        // Almacenamos textos legales en config para simplificar
        terms, warranty: warr, paymode: pmode, validity: valid,
        next_quote: next_q, next_invoice: next_i
      };

      if (existConf) {
        await supabase.from('company_config').update(payloadConfig).eq('company_id', companyId);
      } else {
        await supabase.from('company_config').insert({ company_id: companyId, ...payloadConfig });
      }

      toast('¡Configuración completada!', 'success');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      toast('Error al guardar. Intenta de nuevo.', 'error');
      btnNext.disabled = false; btnNext.textContent = 'Finalizar';
    }
  });
}
