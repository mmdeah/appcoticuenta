// src/main.js
import './styles.css';
import { route, initRouter, navigate } from './lib/router.js';

// Pages - Auth
import { renderLogin }    from './pages/login.js';
import { renderRegister } from './pages/register.js';
import { renderPayment }  from './pages/payment.js';

// Pages - Client
import { renderDashboard }   from './pages/dashboard.js';
import { renderClients }     from './pages/clients.js';
import { renderQuoteNew }    from './pages/quotes-new.js';
import { renderInvoiceNew }  from './pages/invoices-new.js';
import { renderHistory }     from './pages/history.js';
import { renderSettings }    from './pages/settings.js';
import { renderSupport }     from './pages/support.js';
import { renderWizard }      from './pages/wizard.js';

// Pages - Admin
import { renderAdminLogin }     from './pages/admin/login.js';
import { renderAdminDashboard } from './pages/admin/dashboard.js';
import { renderAdminRequests }  from './pages/admin/requests.js';
import { renderAdminUsers }     from './pages/admin/users.js';
import { renderAdminConfig }    from './pages/admin/config.js';
import { renderAdminTickets }   from './pages/admin/tickets.js';

// ─── Rutas públicas ─────────────────────────────────────────
route('/login',     renderLogin);
route('/register',  renderRegister);
route('/payment',   renderPayment);

// ─── Rutas del cliente ───────────────────────────────────────
route('/dashboard',    renderDashboard);
route('/wizard',       renderWizard);
route('/clients',      renderClients);
route('/quotes/new',   renderQuoteNew);
route('/invoices/new', renderInvoiceNew);
route('/history',      renderHistory);
route('/settings',     renderSettings);
route('/support',      renderSupport);

// ─── Rutas del admin (ocultas) ───────────────────────────────
route('/admin',            renderAdminLogin);
route('/admin/dashboard',  renderAdminDashboard);
route('/admin/requests',   renderAdminRequests);
route('/admin/users',      renderAdminUsers);
route('/admin/config',     renderAdminConfig);
route('/admin/tickets',    renderAdminTickets);

// ─── Iniciar ─────────────────────────────────────────────────
initRouter();
