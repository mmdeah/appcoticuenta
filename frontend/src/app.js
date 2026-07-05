// src/app.js
// Inicializa la aplicación y gestiona la navegación básica
export function createApp() {
  const appDiv = document.getElementById('app');
  if (!appDiv) return;
  // Placeholder: muestra pantalla de carga y luego redirige al login
  appDiv.innerHTML = `<h1>Plataforma de Cotizaciones</h1><p>Cargando...</p>`;

  // Simular carga breve y mostrar enlace de inicio de sesión
  setTimeout(() => {
    appDiv.innerHTML = `
      <h1>Plataforma de Cotizaciones</h1>
      <a href="/login.html" class="btn-primary">Iniciar Sesión</a> <a href="/register.html" class="btn-secondary">Crear Cuenta</a>
    `;
  }, 1000);
}
