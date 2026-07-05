// src/pages/support.js
import { requireAuth }  from '../lib/auth.js';
import { supabase }     from '../lib/supabase.js';
import { toast }        from '../components/toast.js';
import { renderSidebar, initSidebarEvents, renderTopBar } from '../components/sidebar.js';

export async function renderSupport() {
  const auth = await requireAuth('client');
  if (!auth) return;
  const { profile } = auth;
  const companyId = profile.company_id;

  const { data: tickets } = await supabase.from('tickets').select('*').eq('company_id', companyId).order('created_at', { ascending: false });

  const rows = (tickets || []).map(t => `
    <tr style="cursor:pointer" class="ticket-row" data-id="${t.id}">
      <td><strong>${t.subject}</strong></td>
      <td>
        <span class="badge ${t.status==='open'?'badge-warning':t.status==='answered'?'badge-success':'badge-gray'}">
          ${t.status === 'open' ? 'Abierto' : t.status === 'answered' ? 'Respondido' : 'Cerrado'}
        </span>
      </td>
      <td style="color:var(--c-text-2)">${new Date(t.created_at).toLocaleDateString('es-CO')}</td>
    </tr>
  `).join('') || `<tr><td colspan="3"><div class="empty-state" style="padding:20px">Aún no has creado ningún ticket. Si tienes dudas, revisa las preguntas frecuentes arriba o crea uno nuevo.</div></td></tr>`;

  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      ${renderSidebar('client', profile)}
      <div class="main-content">
        ${renderTopBar('Centro de Soporte', `<button class="btn btn-primary" id="btn-new-ticket">Nuevo Ticket</button>`)}
        <div class="page-content">
          <p class="guide-text">Antes de crear un ticket, revisa si tu pregunta ya tiene respuesta abajo. Si no la encuentras, escríbenos y normalmente respondemos en menos de 24 horas.</p>

          <div class="card">
            <h3 style="margin-bottom:4px">Preguntas frecuentes</h3>
            <p class="form-hint" style="opacity:.7;margin-bottom:14px">Haz clic sobre una pregunta para ver la respuesta.</p>
            <details class="faq-item">
              <summary>¿Cómo creo una cotización o una cuenta de cobro?</summary>
              <p>Ve al menú lateral y elige "Nueva Cotización" o "Nueva Cuenta de Cobro". Selecciona el cliente (o "Consumidor final"), agrega tus ítems y guarda o genera el PDF directamente, sin necesidad de guardarlo primero.</p>
            </details>
            <details class="faq-item">
              <summary>¿Qué es "Consumidor final" en el selector de clientes?</summary>
              <p>Úsalo cuando el documento no es para un cliente específico registrado en tu lista de Clientes. No necesitas crear un cliente nuevo para usarlo.</p>
            </details>
            <details class="faq-item">
              <summary>¿Cómo cambio el logo o los colores de mis documentos?</summary>
              <p>Ve a Configuración → pestaña "Empresa e Identidad". Ahí puedes subir el logo (una foto) y elegir tus colores principales.</p>
            </details>
            <details class="faq-item">
              <summary>¿Puedo eliminar una cotización o cuenta de cobro?</summary>
              <p>Sí. Ve a Historial y usa el botón "Eliminar" en la fila del documento que quieras borrar. Esta acción no se puede deshacer.</p>
            </details>
            <details class="faq-item">
              <summary>¿Cuánto tarda la aprobación de mi cuenta o pago?</summary>
              <p>Normalmente menos de 24 horas después de enviar tu comprobante de pago por WhatsApp. Mientras tanto no podrás iniciar sesión.</p>
            </details>
            <details class="faq-item">
              <summary>¿Dónde veo mis ingresos y gastos?</summary>
              <p>Ve a "Estadísticas y Gastos" en el menú lateral: ahí puedes ver un resumen de tu negocio y registrar tus gastos.</p>
            </details>
          </div>

          <div class="card" style="padding:0">
            <div class="card-header" style="padding:16px 20px 0">
              <h3 class="card-title">Mis tickets</h3>
            </div>
            <p class="guide-text" style="padding:0 20px">Aquí verás el historial de tus conversaciones con nuestro equipo de soporte.</p>
            <div class="table-wrap">
              <table class="table table-hover">
                <thead><tr><th>Asunto</th><th>Estado</th><th>Fecha</th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal nuevo ticket -->
    <div class="modal-overlay" id="ticket-modal" style="display:none">
      <div class="modal">
        <div class="modal-header"><h3 class="modal-title">Crear Ticket</h3><button class="modal-close" id="tm-close">×</button></div>
        <div class="modal-body">
          <p class="form-hint" style="opacity:.7;margin-top:0">Cuéntanos claramente qué necesitas para poder ayudarte más rápido.</p>
          <div class="form-group"><label class="form-label">Asunto</label><input id="tm-sub" class="form-control" placeholder="Ej: No puedo subir mi logo" /></div>
          <div class="form-group"><label class="form-label">Mensaje</label><textarea id="tm-msg" class="form-control" style="min-height:120px" placeholder="Describe el problema o tu pregunta con el mayor detalle posible..."></textarea></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="tm-cancel">Cancelar</button>
          <button class="btn btn-primary" id="tm-save">Enviar Ticket</button>
        </div>
      </div>
    </div>

    <!-- Modal Ver Ticket -->
    <div class="modal-overlay" id="view-modal" style="display:none">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title" id="vt-sub">Ticket</h3>
          <button class="modal-close" id="vt-close">×</button>
        </div>
        <div class="modal-body" style="background:#f8fafc">
          <div class="ticket-thread" id="vt-thread"></div>
        </div>
        <div class="modal-body" style="border-top:1px solid var(--c-border);padding-top:16px" id="vt-reply-box">
          <textarea id="vt-msg" class="form-control" placeholder="Escribe tu respuesta..." style="margin-bottom:10px"></textarea>
          <button class="btn btn-primary btn-block" id="vt-send">Enviar respuesta</button>
        </div>
      </div>
    </div>
  `;

  initSidebarEvents();

  // Nuevo ticket
  document.getElementById('btn-new-ticket').addEventListener('click', () => document.getElementById('ticket-modal').style.display='flex');
  document.getElementById('tm-close').addEventListener('click', () => document.getElementById('ticket-modal').style.display='none');
  document.getElementById('tm-cancel').addEventListener('click', () => document.getElementById('ticket-modal').style.display='none');

  document.getElementById('tm-save').addEventListener('click', async () => {
    const sub = document.getElementById('tm-sub').value.trim();
    const msg = document.getElementById('tm-msg').value.trim();
    if(!sub || !msg) { toast('Completa los campos','error'); return; }

    const btn = document.getElementById('tm-save');
    btn.disabled=true; btn.textContent='Enviando...';

    const { data: ticket } = await supabase.from('tickets').insert({ company_id: companyId, user_id: profile.id, subject: sub, status: 'open' }).select().single();
    if (ticket) {
      await supabase.from('ticket_messages').insert({ ticket_id: ticket.id, sender_id: profile.id, sender_role: 'client', message: msg });
      toast('Ticket creado', 'success');
      renderSupport(); // reload
    }
  });

  // Ver ticket
  document.querySelectorAll('.ticket-row').forEach(row => {
    row.addEventListener('click', () => openTicket(row.dataset.id, companyId, profile.id, tickets));
  });
}

async function openTicket(ticketId, companyId, userId, allTickets) {
  const t = allTickets.find(x => x.id === ticketId);
  document.getElementById('vt-sub').textContent = t.subject;
  document.getElementById('view-modal').style.display='flex';
  document.getElementById('vt-close').onclick = () => document.getElementById('view-modal').style.display='none';

  const threadEl = document.getElementById('vt-thread');
  threadEl.innerHTML = '<div style="text-align:center;padding:20px"><div class="loading-spinner" style="margin:0 auto"></div></div>';

  const { data: msgs } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending:true });
  
  threadEl.innerHTML = (msgs || []).map(m => `
    <div class="ticket-msg ${m.sender_role==='admin' ? 'ticket-msg-admin' : 'ticket-msg-client'}">
      ${m.message.replace(/\n/g, '<br>')}
      <div class="ticket-msg-meta">${m.sender_role==='admin' ? 'Administrador' : 'Tú'} • ${new Date(m.created_at).toLocaleString('es-CO')}</div>
    </div>
  `).join('');

  // Scroll bottom
  const mb = document.querySelector('#view-modal .modal-body');
  mb.scrollTop = mb.scrollHeight;

  const replyBox = document.getElementById('vt-reply-box');
  if (t.status === 'closed') {
    replyBox.style.display = 'none';
  } else {
    replyBox.style.display = 'block';
    const btnSend = document.getElementById('vt-send');
    btnSend.onclick = async () => {
      const msg = document.getElementById('vt-msg').value.trim();
      if(!msg) return;
      btnSend.disabled=true;
      await supabase.from('ticket_messages').insert({ ticket_id: ticketId, sender_id: userId, sender_role: 'client', message: msg });
      await supabase.from('tickets').update({ status: 'open' }).eq('id', ticketId);
      document.getElementById('vt-msg').value = '';
      btnSend.disabled=false;
      openTicket(ticketId, companyId, userId, allTickets); // reload thread
    };
  }
}
