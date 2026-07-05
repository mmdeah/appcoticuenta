// src/pages/pending.js
const LOGO = `<svg width="32" height="32" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="#1e293b"/><path d="M12 20h16M20 12v16" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>`;

export function renderPending() {
  document.getElementById('app').innerHTML = `
    <div class="auth-page">
      <div class="auth-card pending-card">
        <div class="pending-icon">
          <svg width="32" height="32" fill="none" stroke="#d97706" stroke-width="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="auth-logo" style="justify-content:center;margin-bottom:12px">${LOGO} CotiCuenta</div>
        <h2 style="margin-bottom:8px">Solicitud en revisión</h2>
        <p style="margin-bottom:24px;font-size:14px">
          Tu comprobante de pago está siendo verificado por nuestro equipo.<br><br>
          Una vez aprobado, recibirás acceso completo a la plataforma.<br><br>
          <strong>Tiempo estimado: menos de 24 horas.</strong>
        </p>
        <div class="alert alert-warning" style="text-align:left">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
          No podrás iniciar sesión hasta que el administrador apruebe tu pago.
        </div>
        <p style="font-size:12px;color:var(--c-text-3);margin-top:16px">¿Aún no has enviado tu comprobante?</p>
        <a href="#/payment" class="btn btn-outline btn-sm" style="margin-top:8px">Ir a la pantalla de pago</a>
      </div>
    </div>
  `;
}
