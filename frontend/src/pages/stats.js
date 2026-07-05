// src/pages/stats.js
import { requireAuth }  from '../lib/auth.js';
import { supabase }     from '../lib/supabase.js';
import { toast }        from '../components/toast.js';
import { renderSidebar, initSidebarEvents, renderTopBar } from '../components/sidebar.js';

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const CATEGORIES  = ['Materiales', 'Transporte', 'Servicios', 'Arriendo', 'Nómina', 'Impuestos', 'Otros'];

function fmt(n) { return '$' + Number(n || 0).toLocaleString('es-CO'); }
function formatCOP(n) { return Number(n || 0).toLocaleString('es-CO'); }
function monthKey(dateStr) { const d = new Date(dateStr); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
function monthLabel(key) { const [y, m] = key.split('-'); return `${MONTH_NAMES[Number(m) - 1]} ${y}`; }

export async function renderStats() {
  const auth = await requireAuth('client');
  if (!auth) return;
  const { profile } = auth;
  const companyId = profile.company_id;

  const [{ data: docs }, { data: expenses }] = await Promise.all([
    supabase.from('documents').select('type, grand_total, issue_date').eq('company_id', companyId),
    supabase.from('expenses').select('*').eq('company_id', companyId).order('date', { ascending: false }),
  ]);

  const quotesTotal    = (docs || []).filter(d => d.type === 'quote').reduce((s, d) => s + (d.grand_total || 0), 0);
  const invoicesTotal  = (docs || []).filter(d => d.type === 'invoice').reduce((s, d) => s + (d.grand_total || 0), 0);
  const expensesTotal  = (expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
  const netProfit      = invoicesTotal - expensesTotal;
  const quotesCount    = (docs || []).filter(d => d.type === 'quote').length;
  const invoicesCount  = (docs || []).filter(d => d.type === 'invoice').length;

  // Últimos 6 meses: ingresos (cuentas de cobro) vs gastos
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const incomeByMonth = {}, expenseByMonth = {};
  months.forEach(m => { incomeByMonth[m] = 0; expenseByMonth[m] = 0; });
  (docs || []).filter(d => d.type === 'invoice').forEach(d => {
    const k = monthKey(d.issue_date);
    if (k in incomeByMonth) incomeByMonth[k] += (d.grand_total || 0);
  });
  (expenses || []).forEach(e => {
    const k = monthKey(e.date);
    if (k in expenseByMonth) expenseByMonth[k] += (e.amount || 0);
  });
  const maxVal = Math.max(1, ...months.map(m => Math.max(incomeByMonth[m], expenseByMonth[m])));

  const barsHTML = months.map(m => `
    <div style="margin-bottom:16px">
      <div style="font-size:12px;font-weight:600;color:var(--c-text-2);margin-bottom:6px">${monthLabel(m)}</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <div style="width:64px;font-size:11px;color:var(--c-text-3)">Ingresos</div>
        <div style="flex:1;background:var(--c-surface-2);border-radius:4px;overflow:hidden;height:14px">
          <div style="height:100%;width:${(incomeByMonth[m] / maxVal * 100).toFixed(1)}%;background:var(--c-success)"></div>
        </div>
        <div style="width:100px;text-align:right;font-size:11px;font-weight:600">${fmt(incomeByMonth[m])}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:64px;font-size:11px;color:var(--c-text-3)">Gastos</div>
        <div style="flex:1;background:var(--c-surface-2);border-radius:4px;overflow:hidden;height:14px">
          <div style="height:100%;width:${(expenseByMonth[m] / maxVal * 100).toFixed(1)}%;background:var(--c-danger)"></div>
        </div>
        <div style="width:100px;text-align:right;font-size:11px;font-weight:600">${fmt(expenseByMonth[m])}</div>
      </div>
    </div>
  `).join('');

  const expenseRows = (expenses || []).map(e => `
    <tr>
      <td style="white-space:nowrap">${e.date ? new Date(e.date).toLocaleDateString('es-CO') : '—'}</td>
      <td style="max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e.description || '—'}</td>
      <td><span class="badge badge-gray">${e.category || 'Otros'}</span></td>
      <td style="font-weight:600">${fmt(e.amount)}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-outline btn-sm edit-expense" data-id="${e.id}">Editar</button>
          <button class="btn btn-danger btn-sm delete-expense" data-id="${e.id}">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="5"><div class="empty-state" style="padding:20px">Aún no has registrado gastos.</div></td></tr>`;

  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      ${renderSidebar('client', profile)}
      <div class="main-content">
        ${renderTopBar('Estadísticas y Gastos')}
        <div class="page-content">
          <p class="guide-text">Un resumen simple de cómo va tu negocio: cuánto has cotizado, cuánto has cobrado y cuánto has gastado.</p>

          <div class="tabs">
            <div class="tab active" data-tab="resumen">Resumen</div>
            <div class="tab" data-tab="gastos">Gastos</div>
          </div>

          <div class="tab-content" id="tab-resumen">
            <div class="kpi-grid">
              <div class="kpi-card">
                <div class="kpi-label">Total cotizado</div>
                <div class="kpi-value">${fmt(quotesTotal)}</div>
                <div class="kpi-sub">${quotesCount} cotización(es)</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Total cobrado</div>
                <div class="kpi-value">${fmt(invoicesTotal)}</div>
                <div class="kpi-sub">${invoicesCount} cuenta(s) de cobro</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Total gastos</div>
                <div class="kpi-value" style="color:var(--c-danger)">${fmt(expensesTotal)}</div>
                <div class="kpi-sub">${(expenses || []).length} gasto(s) registrado(s)</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Ganancia neta</div>
                <div class="kpi-value" style="color:${netProfit >= 0 ? 'var(--c-success)' : 'var(--c-danger)'}">${fmt(netProfit)}</div>
                <div class="kpi-sub">Cobrado − Gastos</div>
              </div>
            </div>

            <div class="card">
              <h3 style="margin-bottom:4px">Ingresos vs. Gastos (últimos 6 meses)</h3>
              <p class="form-hint" style="opacity:.7;margin-bottom:16px">Comparación mes a mes entre lo que has cobrado en cuentas de cobro y lo que has gastado.</p>
              ${barsHTML}
            </div>
          </div>

          <div class="tab-content" id="tab-gastos" style="display:none">
            <div class="card" style="padding:0">
              <div class="card-header" style="padding:16px 20px 0">
                <h3 class="card-title">Mis gastos</h3>
                <button class="btn btn-primary btn-sm" id="btn-new-expense">+ Nuevo gasto</button>
              </div>
              <p class="guide-text" style="padding:0 20px">Registra aquí lo que gastas en tu negocio (materiales, transporte, servicios, etc.) para saber tu ganancia real.</p>
              <div class="table-wrap">
                <table class="table">
                  <thead><tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Monto</th><th>Acciones</th></tr></thead>
                  <tbody id="expenses-tbody">${expenseRows}</tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Modal nuevo/editar gasto -->
    <div class="modal-overlay" id="expense-modal" style="display:none">
      <div class="modal" style="max-width:460px">
        <div class="modal-header">
          <h3 class="modal-title" id="expense-modal-title">Nuevo gasto</h3>
          <button class="modal-close" id="em-close">×</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="e-id" />
          <div class="form-group"><label class="form-label">Descripción <span>*</span></label><input id="e-desc" class="form-control" placeholder="Ej: Compra de materiales" /></div>
          <div class="form-row cols-2">
            <div class="form-group">
              <label class="form-label">Categoría</label>
              <select id="e-category" class="form-control">${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
            </div>
            <div class="form-group"><label class="form-label">Fecha</label><input type="date" id="e-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" /></div>
          </div>
          <div class="form-group">
            <label class="form-label">Monto <span>*</span></label>
            <input type="text" inputmode="numeric" id="e-amount" class="form-control" placeholder="$ 0" />
            <p class="form-hint" style="opacity:.7">Se formatea automáticamente en pesos colombianos (COP).</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="em-cancel">Cancelar</button>
          <button class="btn btn-primary" id="em-save">Guardar</button>
        </div>
      </div>
    </div>
  `;

  initSidebarEvents();

  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).style.display = 'block';
    });
  });

  // Formato COP en vivo para el monto
  const amountInput = document.getElementById('e-amount');
  amountInput.addEventListener('input', e => {
    const digits = e.target.value.replace(/\D/g, '');
    e.target.value = digits ? formatCOP(parseInt(digits, 10)) : '';
  });

  function openModal() { document.getElementById('expense-modal').style.display = 'flex'; }
  function closeModal() { document.getElementById('expense-modal').style.display = 'none'; }

  document.getElementById('btn-new-expense').addEventListener('click', () => {
    document.getElementById('expense-modal-title').textContent = 'Nuevo gasto';
    document.getElementById('e-id').value = '';
    document.getElementById('e-desc').value = '';
    document.getElementById('e-category').value = CATEGORIES[0];
    document.getElementById('e-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('e-amount').value = '';
    openModal();
  });
  document.getElementById('em-close').addEventListener('click', closeModal);
  document.getElementById('em-cancel').addEventListener('click', closeModal);

  document.getElementById('em-save').addEventListener('click', async () => {
    const id = document.getElementById('e-id').value;
    const description = document.getElementById('e-desc').value.trim();
    const category = document.getElementById('e-category').value;
    const date = document.getElementById('e-date').value;
    const amount = parseInt(document.getElementById('e-amount').value.replace(/\D/g, '') || '0', 10);

    if (!description) { toast('La descripción es obligatoria', 'error'); return; }
    if (!amount) { toast('Ingresa un monto válido', 'error'); return; }

    const payload = { company_id: companyId, description, category, date, amount };
    const btn = document.getElementById('em-save');
    btn.disabled = true;

    try {
      if (id) {
        await supabase.from('expenses').update(payload).eq('id', id);
        toast('Gasto actualizado', 'success');
      } else {
        await supabase.from('expenses').insert(payload);
        toast('Gasto registrado', 'success');
      }
      closeModal();
      renderStats();
    } catch (err) {
      console.error(err);
      toast('Error al guardar el gasto', 'error');
      btn.disabled = false;
    }
  });

  document.querySelectorAll('.edit-expense').forEach(btn => {
    btn.addEventListener('click', () => {
      const e = (expenses || []).find(x => x.id === btn.dataset.id);
      if (!e) return;
      document.getElementById('expense-modal-title').textContent = 'Editar gasto';
      document.getElementById('e-id').value = e.id;
      document.getElementById('e-desc').value = e.description || '';
      document.getElementById('e-category').value = e.category || CATEGORIES[0];
      document.getElementById('e-date').value = e.date ? e.date.split('T')[0] : new Date().toISOString().split('T')[0];
      document.getElementById('e-amount').value = formatCOP(e.amount);
      openModal();
    });
  });

  document.querySelectorAll('.delete-expense').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este gasto?')) return;
      btn.disabled = true;
      const { error } = await supabase.from('expenses').delete().eq('id', btn.dataset.id);
      if (error) { toast('Error al eliminar', 'error'); btn.disabled = false; return; }
      toast('Gasto eliminado', 'success');
      renderStats();
    });
  });
}
