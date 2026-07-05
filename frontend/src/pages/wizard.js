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
        <h2 style="text-align:center; margin-bottom:8px;">¡Bienvenido${profile.name ? ', ' + profile.name : ''}!</h2>
        <p style="text-align:center; color:var(--c-text-2); margin-bottom:8px;">
          Antes de continuar debes completar la configuración inicial de tu empresa.
        </p>
        <p class="guide-text" style="text-align:center">
          Tranquilo, no necesitas experiencia previa: te explicamos para qué sirve cada campo. Son solo 4 pasos cortos y no podrás usar el resto de la plataforma hasta terminarlos.
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
          <p class="guide-text">Estos datos aparecen en el encabezado de cada cotización y cuenta de cobro que generes, para que tu cliente identifique quién le está facturando.</p>
          <div class="form-group">
            <label class="form-label">Dirección <span>*</span></label>
            <input id="w-address" class="form-control" placeholder="Av. Principal #123" />
            <p class="form-hint" style="opacity:.7">La dirección física o de correspondencia de tu negocio. Aparecerá debajo del nombre de tu empresa en los documentos.</p>
          </div>
          <div class="form-row cols-2">
            <div class="form-group">
              <label class="form-label">Ciudad <span>*</span></label>
              <input id="w-city" class="form-control" placeholder="Bogotá" />
              <p class="form-hint" style="opacity:.7">La ciudad donde opera tu empresa.</p>
            </div>
            <div class="form-group">
              <label class="form-label">Sitio web</label>
              <input id="w-website" class="form-control" placeholder="www.miempresa.com" />
              <p class="form-hint" style="opacity:.7">Opcional. Si no tienes página web, deja este campo vacío.</p>
            </div>
          </div>
        </div>

        <div id="step-2" class="wizard-content" style="display:none">
          <p class="guide-text">Esto es solo para que tus documentos se vean profesionales y con tu marca. Si no tienes logo o colores definidos, puedes saltarte este paso y dejarlo como está por ahora.</p>
          <div class="form-group">
            <label class="form-label">Logotipo <span style="font-size:12px;font-weight:400;color:var(--c-text-3)">(Opcional)</span></label>
            <input type="file" id="w-logo-file" class="form-control" accept="image/*" />
            <img id="w-logo-preview" style="max-height:80px; margin-top:10px; display:none" />
            <p class="form-hint" style="opacity:.7">Sube una foto o imagen de tu logo (JPG o PNG). Se mostrará en la parte superior de tus cotizaciones y cuentas de cobro.</p>
          </div>
          <div class="form-row cols-2">
            <div class="form-group">
              <label class="form-label">Color principal</label>
              <div class="color-row">
                <input type="color" id="w-color1" value="#1e293b" style="padding:0;width:40px;height:40px;border:none;border-radius:4px" />
                <span id="w-color1-val" style="font-family:monospace;font-size:13px">#1e293b</span>
              </div>
              <p class="form-hint" style="opacity:.7">El color principal de tu marca. Se usa en los títulos y detalles de tus documentos.</p>
            </div>
            <div class="form-group">
              <label class="form-label">Color secundario</label>
              <div class="color-row">
                <input type="color" id="w-color2" value="#3b82f6" style="padding:0;width:40px;height:40px;border:none;border-radius:4px" />
                <span id="w-color2-val" style="font-family:monospace;font-size:13px">#3b82f6</span>
              </div>
              <p class="form-hint" style="opacity:.7">Un color de apoyo, usado en detalles menores. Si no sabes cuál elegir, deja el que viene por defecto.</p>
            </div>
          </div>
        </div>

        <div id="step-3" class="wizard-content" style="display:none">
          <p class="guide-text">Ya dejamos un texto genérico para que no tengas que empezar de cero. Puedes usarlo tal cual, editarlo a tu gusto, o incluso cambiarlo cada vez que hagas una cotización o cuenta de cobro.</p>
          <div class="form-group">
            <label class="form-label">Condiciones comerciales</label>
            <textarea id="w-terms" class="form-control">Los precios incluidos en este documento pueden estar sujetos a cambios sin previo aviso. Cualquier trabajo, producto o servicio adicional no contemplado aquí será cotizado por separado. El cliente se compromete a suministrar la información y los recursos necesarios para la correcta prestación del servicio.</textarea>
            <p class="form-hint" style="opacity:.7">Son las reglas del juego con tu cliente: qué incluye el precio, qué pasa si piden cambios, etc. Aparecerá al final de tus documentos.</p>
          </div>
          <div class="form-group">
            <label class="form-label">Garantía</label>
            <textarea id="w-warranty" class="form-control">Este producto o servicio cuenta con una garantía de 30 días a partir de la fecha de entrega, la cual cubre defectos de fabricación o instalación. No cubre daños ocasionados por mal uso.</textarea>
            <p class="form-hint" style="opacity:.7">Cuánto tiempo respondes si algo sale mal después de entregar tu producto o servicio. Por defecto dejamos 30 días, puedes cambiarlo.</p>
          </div>
        </div>

        <div id="step-4" class="wizard-content" style="display:none">
          <p class="guide-text">Estas opciones controlan cómo se calculan y numeran automáticamente tus documentos. Si no estás seguro, puedes dejarlas como están y ajustarlas después en Configuración.</p>
          <div class="form-group" style="margin-bottom:24px">
            <div class="toggle-group" style="margin-bottom:12px">
              <label class="toggle"><input type="checkbox" id="w-iva-btn" /><span class="toggle-slider"></span></label>
              <span class="toggle-label">Aplicar IVA por defecto</span>
            </div>
            <p class="form-hint" style="opacity:.7;margin-top:-8px;margin-bottom:8px">El IVA es el impuesto sobre las ventas en Colombia. Actívalo si tu empresa debe cobrarlo; si no aplica en tu caso, déjalo apagado.</p>
            <div id="w-iva-box" style="display:none">
              <label class="form-label">Porcentaje de IVA (%)</label>
              <input type="number" id="w-iva-val" class="form-control" value="19" style="max-width:150px" />
              <p class="form-hint" style="opacity:.7">La tarifa general en Colombia es 19%. Cámbiala solo si tu caso es diferente.</p>
            </div>
          </div>
          <div class="form-row cols-2">
            <div class="form-group">
              <label class="form-label">Siguiente número de Cotización</label>
              <input type="number" id="w-num-q" class="form-control" value="1" />
              <p class="form-hint" style="opacity:.7">El número con el que empezará tu primera cotización (ej: COT-0001). Luego sube automáticamente con cada una que crees.</p>
            </div>
            <div class="form-group">
              <label class="form-label">Siguiente número de Factura</label>
              <input type="number" id="w-num-i" class="form-control" value="1" />
              <p class="form-hint" style="opacity:.7">El número con el que empezará tu primera cuenta de cobro (ej: CC-0001). También sube automáticamente.</p>
            </div>
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

  // Logo (archivo)
  let currentLogo = '';
  const logoFile = document.getElementById('w-logo-file');
  const logoPreview = document.getElementById('w-logo-preview');
  logoFile.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        currentLogo = ev.target.result;
        logoPreview.src = currentLogo;
        logoPreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });

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
    const col1    = c1.value;
    const col2    = c2.value;

    const terms   = document.getElementById('w-terms').value;
    const warr    = document.getElementById('w-warranty').value;

    const iva_enabled = ivaBtn.checked;
    const iva_pct     = document.getElementById('w-iva-val').value;
    const next_q      = document.getElementById('w-num-q').value;
    const next_i      = document.getElementById('w-num-i').value;

    try {
      // Update companies
      await supabase.from('companies').update({
        address, city, website: web, logo_url: currentLogo, primary_color: col1, secondary_color: col2
      }).eq('id', companyId);

      // Create/Update company_config
      const { data: existConf } = await supabase.from('company_config').select('company_id').eq('company_id', companyId).single();
      const payloadConfig = {
        iva_enabled,
        iva_percent: iva_enabled ? iva_pct : 0,
        // Almacenamos textos legales en config para simplificar
        terms, warranty: warr,
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
