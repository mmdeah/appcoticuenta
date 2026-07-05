// src/pages/register.js
import { navigate }  from '../lib/router.js';
import { register }  from '../lib/auth.js';
import { supabase }  from '../lib/supabase.js';
import { toast }     from '../components/toast.js';

const LOGO = `<svg width="32" height="32" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="#1e293b"/><path d="M12 20h16M20 12v16" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`;

export function renderRegister() {
  document.getElementById('app').innerHTML = `
    <div class="auth-page">
      <div class="auth-card" style="max-width:480px">
        <div class="auth-logo">${LOGO} CotiCuenta</div>
        <h1 class="auth-title">Crear cuenta</h1>
        <p class="auth-subtitle">Regístrate y empieza a emitir documentos profesionales</p>

        <form id="register-form" novalidate>
          <div class="form-row cols-2">
            <div class="form-group">
              <label class="form-label" for="r-company">Nombre de la empresa <span>*</span></label>
              <input id="r-company" type="text" class="form-control" placeholder="Mi Empresa S.A.S." required />
            </div>
            <div class="form-group">
              <label class="form-label" for="r-nit">NIT / CC <span>*</span></label>
              <input id="r-nit" type="text" class="form-control" placeholder="900123456-7" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="r-name">Nombre del responsable <span>*</span></label>
            <input id="r-name" type="text" class="form-control" placeholder="Juan Pérez" required />
          </div>
          <div class="form-row cols-2">
            <div class="form-group">
              <label class="form-label" for="r-email">Correo electrónico <span>*</span></label>
              <input id="r-email" type="email" class="form-control" placeholder="correo@empresa.com" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="r-phone">Teléfono <span>*</span></label>
              <input id="r-phone" type="tel" class="form-control" placeholder="3001234567" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="r-password">Contraseña <span>*</span></label>
            <input id="r-password" type="password" class="form-control" placeholder="Mínimo 8 caracteres" minlength="8" required />
          </div>
          <div id="register-error" class="alert alert-danger" style="display:none"></div>
          <button type="submit" class="btn btn-primary btn-block btn-lg" id="register-btn" style="margin-top:8px">
            Crear cuenta
          </button>
        </form>

        <div class="auth-footer">
          ¿Ya tienes cuenta? <a href="#" id="go-login">Iniciar sesión</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('go-login').addEventListener('click', e => { e.preventDefault(); navigate('/login'); });

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const company  = document.getElementById('r-company').value.trim();
    const nit      = document.getElementById('r-nit').value.trim();
    const name     = document.getElementById('r-name').value.trim();
    const email    = document.getElementById('r-email').value.trim();
    const phone    = document.getElementById('r-phone').value.trim();
    const password = document.getElementById('r-password').value;
    const errBox   = document.getElementById('register-error');
    const btn      = document.getElementById('register-btn');

    if (!company || !nit || !name || !email || !phone || !password) {
      showError(errBox, 'Por favor completa todos los campos.'); return;
    }
    if (password.length < 8) {
      showError(errBox, 'La contraseña debe tener al menos 8 caracteres.'); return;
    }

    btn.disabled = true; btn.textContent = 'Creando cuenta...';
    errBox.style.display = 'none';

    try {
      // 1. Crear usuario en Supabase Auth
      const { user } = await register(email, password);
      const userId = user?.id;
      if (!userId) throw new Error('No se pudo crear el usuario.');

      // 2. Crear empresa
      const { data: companyData, error: companyErr } = await supabase
        .from('companies')
        .insert({ name: company, nit })
        .select()
        .single();
      if (companyErr) throw companyErr;

      // 3. Crear perfil de usuario
      const requestId = crypto.randomUUID();
      await supabase.from('users').insert({
        id: userId,
        email,
        name,
        phone,
        role: 'client',
        company_id: companyData.id,
        status: 'pending',
        request_id: requestId,
        request_date: new Date().toISOString(),
      });

      // 4. Crear registro de pago inicial
      await supabase.from('payments').insert({
        company_id: companyData.id,
        request_date: new Date().toISOString(),
        status: 'pending',
      });

      // Guardar datos temporales para la página de pago
      sessionStorage.setItem('reg_company',    company);
      sessionStorage.setItem('reg_email',      email);
      sessionStorage.setItem('reg_request_id', requestId);

      navigate('/payment');
    } catch (err) {
      console.error(err);
      showError(errBox, err.message || 'Error al crear la cuenta. Intenta de nuevo.');
    } finally {
      btn.disabled = false; btn.textContent = 'Crear cuenta';
    }
  });
}

function showError(el, msg) {
  el.innerHTML = msg;
  el.style.display = 'block';
}
