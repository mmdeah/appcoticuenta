// src/pages/admin/tickets.js
import { requireAuth }  from '../../lib/auth.js';
import { supabase }     from '../../lib/supabase.js';
import { renderSidebar, initSidebarEvents, renderTopBar, refreshButton } from '../../components/sidebar.js';

export async function renderAdminTickets() {
  const auth = await requireAuth('admin');
  if (!auth) return;
  const adminId = auth.profile.id;

  const { data: tickets } = await supabase.from('tickets')
    .select('*, companies(name)')
    .order('created_at', { ascending: false });

  const rows = (tickets || []).map(t => `
    <tr style="cursor:pointer" class="ticket-row" data-id="${t.id}">
      <td><strong>${t.companies?.name || '—'}</strong></td>
      <td>${t.subject}</td>
      <td>
        <span class="badge ${t.status==='open'?'badge-warning':t.status==='answered'?'badge-success':'badge-gray'}">
          ${t.status === 'open' ? 'Abierto' : t.status === 'answered' ? 'Respondido' : 'Cerrado'}
        </span>
      </td>
      <td style="color:var(--c-text-2)">${new Date(t.created_at).toLocaleDateString('es-CO')}</td>
    </tr>
  `).join('') || `<tr><td colspan="4"><div class="empty-state">No hay tickets de soporte.</div></td></tr>`;

  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      ${renderSidebar('admin', auth.profile)}
      <div class="main-content">
        ${renderTopBar('Tickets de Soporte', refreshButton())}
        <div class="page-content">
          <div class="card" style="padding:0">
            <div class="table-wrap">
              <table class="table table-hover">
                <thead><tr><th>Empresa</th><th>Asunto</th><th>Estado</th><th>Fecha</th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>
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
          <textarea id="vt-msg" class="form-control" placeholder="Escribe tu respuesta al cliente..." style="margin-bottom:10px"></textarea>
          <div style="display:flex;gap:10px">
            <button class="btn btn-outline" id="vt-close-ticket">Marcar Cerrado</button>
            <button class="btn btn-primary" id="vt-send" style="flex:1">Enviar respuesta</button>
          </div>
        </div>
      </div>
    </div>
  `;

  initSidebarEvents();

  document.getElementById('btn-refresh')?.addEventListener('click', () => renderAdminTickets());

  document.querySelectorAll('.ticket-row').forEach(row => {
    row.addEventListener('click', () => openTicket(row.dataset.id, adminId, tickets));
  });
}

async function openTicket(ticketId, adminId, allTickets) {
  const t = allTickets.find(x => x.id === ticketId);
  document.getElementById('vt-sub').textContent = `${t.companies?.name || ''} - ${t.subject}`;
  document.getElementById('view-modal').style.display='flex';
  document.getElementById('vt-close').onclick = () => document.getElementById('view-modal').style.display='none';

  const threadEl = document.getElementById('vt-thread');
  threadEl.innerHTML = '<div style="text-align:center;padding:20px"><div class="loading-spinner" style="margin:0 auto"></div></div>';

  const { data: msgs } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending:true });
  
  threadEl.innerHTML = (msgs || []).map(m => `
    <div class="ticket-msg ${m.sender_role==='admin' ? 'ticket-msg-admin' : 'ticket-msg-client'}">
      ${m.message.replace(/\n/g, '<br>')}
      <div class="ticket-msg-meta">${m.sender_role==='admin' ? 'Tú' : 'Cliente'} • ${new Date(m.created_at).toLocaleString('es-CO')}</div>
    </div>
  `).join('');

  const mb = document.querySelector('#view-modal .modal-body');
  mb.scrollTop = mb.scrollHeight;

  const replyBox = document.getElementById('vt-reply-box');
  if (t.status === 'closed') {
    replyBox.style.display = 'none';
  } else {
    replyBox.style.display = 'block';
    const btnSend = document.getElementById('vt-send');
    const btnClose = document.getElementById('vt-close-ticket');
    
    btnSend.onclick = async () => {
      const msg = document.getElementById('vt-msg').value.trim();
      if(!msg) return;
      btnSend.disabled=true;
      await supabase.from('ticket_messages').insert({ ticket_id: ticketId, sender_id: adminId, sender_role: 'admin', message: msg });
      await supabase.from('tickets').update({ status: 'answered' }).eq('id', ticketId);
      document.getElementById('vt-msg').value = '';
      btnSend.disabled=false;
      // Reload this ticket status
      t.status = 'answered';
      openTicket(ticketId, adminId, allTickets);
    };

    btnClose.onclick = async () => {
      if(!confirm('¿Cerrar este ticket?')) return;
      await supabase.from('tickets').update({ status: 'closed' }).eq('id', ticketId);
      document.getElementById('view-modal').style.display='none';
      renderAdminTickets();
    };
  }
}
