// src/pages/payment.js
import { navigate }  from '../lib/router.js';
import { supabase }  from '../lib/supabase.js';
import { toast }     from '../components/toast.js';

const LOGO = `<svg width="32" height="32" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="#1e293b"/><path d="M12 20h16M20 12v16" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`;

export async function renderPayment() {
  // Cargar configuración del admin
  const { data: config } = await supabase
    .from('admin_config')
    .select('*')
    .single();

  const company   = sessionStorage.getItem('reg_company')    || 'Tu empresa';
  const email     = sessionStorage.getItem('reg_email')      || '';
  const requestId = sessionStorage.getItem('reg_request_id') || '';

  const planPrice   = config?.plan_price       || '50.000';
  const bankName    = config?.bank_name        || 'Banco ejemplo';
  const accountType = config?.account_type     || 'Ahorros';
  const accountNum  = config?.account_number   || '000-000000-00';
  const holder      = config?.account_holder   || 'CotiCuenta S.A.S.';
  const holderId    = config?.holder_id        || '900.000.000-0';
  const whatsapp    = config?.whatsapp_number  || '573000000000';

  const waMsg = encodeURIComponent(
    `Hola! Envío comprobante de pago.\n\n*Empresa:* ${company}\n*Correo:* ${email}\n*Solicitud:* ${requestId}\n\nAdjunto captura del pago.`
  );

  document.getElementById('app').innerHTML = `
    <div class="auth-page">
      <div class="payment-card">
        <div class="auth-logo" style="margin-bottom:16px">${LOGO} CotiCuenta</div>
        <h1 style="font-size:20px;margin-bottom:6px">Completa tu pago</h1>
        <p style="font-size:13px;color:var(--c-text-2);margin-bottom:20px">
          Realiza la transferencia para activar tu cuenta.
        </p>

        <div style="background:var(--c-accent-light);border:1px solid #bfdbfe;border-radius:var(--radius);padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px">
          <svg width="20" height="20" fill="none" stroke="#3b82f6" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div style="font-size:13px;color:#1e40af">
            <strong>Valor del plan:</strong>
            <span style="font-size:18px;font-weight:700;margin-left:8px">$${planPrice}<small style="font-size:12px;font-weight:400">/mes</small></span>
          </div>
        </div>

        <div class="bank-info">
          <div class="bank-row"><span class="bank-label">Banco</span><span class="bank-value">${bankName}</span></div>
          <div class="bank-row"><span class="bank-label">Tipo de cuenta</span><span class="bank-value">${accountType}</span></div>
          <div class="bank-row" id="account-row">
            <span class="bank-label">Número de cuenta</span>
            <span class="bank-value">${accountNum}
              <button id="copy-btn" class="btn btn-outline btn-sm" style="margin-left:8px">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                Copiar
              </button>
            </span>
          </div>
          <div class="bank-row"><span class="bank-label">Titular</span><span class="bank-value">${holder}</span></div>
        </div>

        <button id="done-btn" class="btn btn-outline btn-block" style="margin-bottom:12px;font-weight:600">
          Listo, ya pagué (Ir al inicio)
        </button>

        <a href="https://wa.me/${whatsapp}?text=${waMsg}" target="_blank" class="btn btn-success btn-block btn-lg" id="wa-btn" style="background:#25d366;border-color:#25d366;margin-bottom:12px">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.985-1.415A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/></svg>
          Enviar comprobante por WhatsApp
        </a>

        <div id="sent-msg" style="display:none" class="alert alert-success">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          <div>
            <strong>¡Listo!</strong> Tu solicitud está siendo revisada.<br>
            <span style="font-size:12px">Recibirás acceso una vez que el administrador la apruebe.</span>
          </div>
        </div>

        <p style="font-size:12px;color:var(--c-text-3);text-align:center;margin-top:16px">
          Solicitud #${requestId.substring(0,8).toUpperCase()}
        </p>
      </div>
    </div>
  `;

  document.getElementById('copy-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(accountNum).then(() => toast('Número de cuenta copiado', 'success'));
  });

  document.getElementById('done-btn').addEventListener('click', () => {
    navigate('/login');
  });

  document.getElementById('wa-btn').addEventListener('click', () => {
    setTimeout(() => { document.getElementById('sent-msg').style.display = 'flex'; }, 1500);
  });
}
