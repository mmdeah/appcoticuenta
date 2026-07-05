// src/pages/login.js
import { navigate }  from '../lib/router.js';
import { login, logout, getSession, getUserProfile } from '../lib/auth.js';
import { toast }     from '../components/toast.js';

const LOGO = `<svg width="32" height="32" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="#1e293b"/><path d="M12 20h16M20 12v16" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`;

export async function renderLogin() {
  // Si ya hay sesión, redirigir
  const session = await getSession();
  if (session) {
    const profile = await getUserProfile(session.user.id);
    if (profile?.role === 'admin') { navigate('/admin/dashboard'); return; }
    if (profile?.status === 'active') { navigate('/dashboard'); return; }
    if (profile?.status === 'pending' || profile?.status === 'suspended') {
      // No puede acceder todavía: cerramos la sesión y lo dejamos en el login
      await logout();
    }
  }

  document.getElementById('app').innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">${LOGO} CotiCuenta</div>
        <h1 class="auth-title">Iniciar sesión</h1>
        <p class="auth-subtitle">Accede a tu cuenta para continuar</p>

        <form id="login-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="login-email">Correo electrónico <span>*</span></label>
            <input id="login-email" type="email" class="form-control" placeholder="empresa@correo.com" autocomplete="email" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="login-password">Contraseña <span>*</span></label>
            <input id="login-password" type="password" class="form-control" placeholder="••••••••" autocomplete="current-password" required />
          </div>
          <div id="login-error" class="alert alert-danger" style="display:none"></div>
          <button type="submit" class="btn btn-primary btn-block btn-lg" id="login-btn" style="margin-top:8px">
            Ingresar
          </button>
        </form>

        <div class="auth-footer">
          ¿No tienes cuenta? <a href="#" id="go-register">Crear cuenta</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('go-register').addEventListener('click', (e) => {
    e.preventDefault(); navigate('/register');
  });

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn      = document.getElementById('login-btn');
    const errBox   = document.getElementById('login-error');

    if (!email || !password) {
      showError(errBox, 'Por favor completa todos los campos.');
      return;
    }

    btn.disabled = true;
    btn.classList.add('btn-loading');
    btn.textContent = '';
    errBox.style.display = 'none';

    try {
      const { session } = await login(email, password);
      const profile = await getUserProfile(session.user.id);

      if (!profile) { showError(errBox, 'No se encontró el perfil. Contacta soporte.'); return; }
      if (profile.status === 'pending') {
        await logout();
        toast('Tu cuenta aún está en revisión. Te notificaremos cuando sea aprobada. No podrás ingresar hasta que sea aprobada.', 'warning', 6000);
        return;
      } else if (profile.status === 'suspended') {
        await logout();
        showError(errBox, 'Tu cuenta está suspendida. Contacta al administrador.');
        return;
      }
      if (profile.role === 'admin')       { navigate('/admin/dashboard'); return; }

      // Verificar si completó el wizard
      if (!profile?.companies?.address) {
        navigate('/wizard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      showError(errBox, 'Correo o contraseña incorrectos.');
    } finally {
      btn.disabled = false;
      btn.classList.remove('btn-loading');
      btn.textContent = 'Ingresar';
    }
  });
}

function showError(el, msg) {
  el.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> ${msg}`;
  el.style.display = 'flex';
  el.style.gap = '8px';
  el.style.alignItems = 'center';
}
