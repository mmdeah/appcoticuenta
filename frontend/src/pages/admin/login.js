// src/pages/admin/login.js
// Ruta oculta: /#/admin  (no linkeada en la UI pública)
import { navigate }  from '../../lib/router.js';
import { login, getUserProfile } from '../../lib/auth.js';
import { toast }     from '../../components/toast.js';

const LOGO = `<svg width="32" height="32" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="#1e293b"/><path d="M12 20h16M20 12v16" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`;

export function renderAdminLogin() {
  document.getElementById('app').innerHTML = `
    <div class="auth-page" style="background:#0f172a">
      <div class="auth-card" style="border-color:#334155">
        <div class="auth-logo">${LOGO} CotiCuenta <span class="badge badge-danger" style="font-size:10px;margin-left:4px">Admin</span></div>
        <h1 class="auth-title">Acceso Administrador</h1>
        <p class="auth-subtitle">Panel de gestión restringido</p>

        <form id="admin-login-form" novalidate>
          <div class="form-group">
            <label class="form-label" for="al-email">Correo</label>
            <input id="al-email" type="email" class="form-control" placeholder="admin@coticuenta.com" autocomplete="email" />
          </div>
          <div class="form-group">
            <label class="form-label" for="al-password">Contraseña</label>
            <input id="al-password" type="password" class="form-control" placeholder="••••••••" autocomplete="current-password" />
          </div>
          <div id="al-error" class="alert alert-danger" style="display:none"></div>
          <button type="submit" class="btn btn-primary btn-block btn-lg" id="al-btn" style="margin-top:8px">
            Ingresar al panel
          </button>
        </form>
        <div class="auth-footer" style="margin-top:16px">
          <a href="#/login" style="color:var(--c-text-3);font-size:12px">← Volver al inicio</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('al-email').value.trim();
    const password = document.getElementById('al-password').value;
    const btn      = document.getElementById('al-btn');
    const errBox   = document.getElementById('al-error');

    if (!email || !password) { errBox.textContent = 'Completa todos los campos.'; errBox.style.display = 'block'; return; }

    btn.disabled = true; btn.textContent = 'Verificando...';
    errBox.style.display = 'none';

    try {
      const { session } = await login(email, password);
      const profile = await getUserProfile(session.user.id);
      if (!profile || profile.role !== 'admin') {
        throw new Error('No tienes permisos de administrador.');
      }
      navigate('/admin/dashboard');
    } catch (err) {
      errBox.textContent = err.message || 'Credenciales incorrectas.';
      errBox.style.display = 'block';
    } finally {
      btn.disabled = false; btn.textContent = 'Ingresar al panel';
    }
  });
}
