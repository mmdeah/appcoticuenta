// src/pages/invoices-new.js
import { requireAuth }  from '../lib/auth.js';
import { navigate }     from '../lib/router.js';
import { supabase }     from '../lib/supabase.js';
import { toast }        from '../components/toast.js';
import { downloadDocumentPDF } from '../lib/pdf.js';
import { renderSidebar, initSidebarEvents, renderTopBar } from '../components/sidebar.js';

export async function renderInvoiceNew() {
  const auth = await requireAuth('client');
  if (!auth) return;
  const { profile } = auth;
  const companyId = profile.company_id;

  const [
    { data: company },
    { data: clients }
  ] = await Promise.all([
    supabase.from('companies').select('*, company_config(*)').eq('id', companyId).single(),
    supabase.from('clients').select('*').eq('company_id', companyId).order('name')
  ]);

  const conf = company?.company_config?.[0] || {};
  let iNum = conf.next_invoice || 1;
  let items = [{ desc: '', qty: 1, price: 0 }];

  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      ${renderSidebar('client', profile)}
      <div class="main-content">
        ${renderTopBar('Nueva Cuenta de Cobro', `<div class="autosave-status"><div class="autosave-dot"></div> Borrador</div>`)}
        <div class="page-content" style="background:#f8fafc">
          <p class="guide-text">Completa los datos, agrega tus ítems y revisa la vista previa a la derecha antes de guardar.</p>
          <div class="builder-layout">
            <div class="builder-form">
              <div class="card">
                <div class="form-row cols-2">
                  <div class="form-group">
                    <label class="form-label">Cliente</label>
                    <select class="form-control" id="i-client">
                      <option value="">-- Seleccionar --</option>
                      <option value="__final__">Consumidor final</option>
                      ${(clients||[]).map(c=>`<option value="${c.id}">${c.name} ${c.company?`(${c.company})`:''}</option>`).join('')}
                    </select>
                    <p class="form-hint" style="opacity:.7">Usa "Consumidor final" si el documento no es para un cliente específico registrado.</p>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Fecha de emisión</label>
                    <input type="date" class="form-control" id="i-date" value="${new Date().toISOString().split('T')[0]}" />
                  </div>
                </div>
              </div>

              <div class="card" style="padding:16px">
                <h4 style="margin-bottom:4px;font-size:14px">Ítems</h4>
                <p class="form-hint" style="opacity:.7;margin-bottom:12px">El valor unitario se formatea automáticamente en pesos colombianos (COP).</p>
                <div class="items-table" style="margin-bottom:12px">
                  <div class="item-row item-row-header">
                    <div>Descripción</div><div>Cant.</div><div>Valor Unit.</div><div>Total</div><div></div>
                  </div>
                  <div id="items-container"></div>
                </div>
                <button class="btn btn-outline btn-sm" id="btn-add-item">+ Agregar ítem</button>
              </div>

              <div class="card">
                <p class="form-hint" style="opacity:.7">Este texto aparecerá al final de la cuenta de cobro (datos de pago, instrucciones, etc.).</p>
                <div class="form-group"><label class="form-label">Notas Adicionales</label><textarea id="i-terms" class="form-control" style="min-height:60px" placeholder="Ej: Datos de la cuenta para el pago, instrucciones adicionales..."></textarea></div>
              </div>
            </div>

            <div class="builder-preview">
              <div class="preview-header">
                <span>Vista Previa</span>
                <span style="color:var(--c-accent)">CC-${String(iNum).padStart(4,'0')}</span>
              </div>
              <div class="preview-body">
                <div class="totals-section">
                  <div class="total-row"><span>Subtotal</span><span id="p-sub">$0</span></div>
                  <!-- Generalmente cuentas de cobro no llevan IVA, pero lo dejamos opcional -->
                  <div class="total-row" id="p-iva-row" style="display:${conf.iva_enabled?'flex':'none'}"><span>IVA (${conf.iva_percent||0}%)</span><span id="p-iva">$0</span></div>
                  <div class="total-row grand"><span>TOTAL</span><span id="p-total">$0</span></div>
                </div>
                <button class="btn btn-primary btn-block btn-lg" id="btn-save" style="margin-top:16px">Guardar Cuenta de Cobro</button>
                <button class="btn btn-outline btn-block" id="btn-pdf" style="margin-top:8px">Generar PDF</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;

  initSidebarEvents();

  const container = document.getElementById('items-container');

  function formatCOP(n) { return Number(n || 0).toLocaleString('es-CO'); }

  function renderItems() {
    container.innerHTML = items.map((it, i) => `
      <div class="item-row">
        <input type="text" class="form-control item-desc" data-i="${i}" value="${it.desc}" placeholder="Producto/Servicio..." />
        <input type="number" class="form-control item-qty" data-i="${i}" value="${it.qty}" min="1" />
        <input type="text" inputmode="numeric" class="form-control item-price" data-i="${i}" value="${formatCOP(it.price)}" placeholder="$ 0" />
        <div class="item-row-total" style="font-weight:600;font-size:13px;text-align:right">$${formatCOP(it.qty * it.price)}</div>
        <button class="item-btn-remove" data-i="${i}">×</button>
      </div>
    `).join('');

    container.querySelectorAll('.item-desc').forEach(el => el.addEventListener('input', e => { items[e.target.dataset.i].desc = e.target.value; updateTotals(); }));
    container.querySelectorAll('.item-qty').forEach(el => el.addEventListener('input', e => { items[e.target.dataset.i].qty = Number(e.target.value); renderItems(); }));
    container.querySelectorAll('.item-price').forEach(el => el.addEventListener('input', e => {
      const i = e.target.dataset.i;
      const digits = e.target.value.replace(/\D/g, '');
      const value = digits ? parseInt(digits, 10) : 0;
      items[i].price = value;
      e.target.value = formatCOP(value);
      const row = e.target.closest('.item-row');
      row.querySelector('.item-row-total').textContent = '$' + formatCOP(items[i].qty * value);
      updateTotals();
    }));
    container.querySelectorAll('.item-btn-remove').forEach(el => el.addEventListener('click', e => {
      if(items.length===1)return;
      items.splice(e.target.dataset.i, 1);
      renderItems();
    }));
    updateTotals();
  }

  function updateTotals() {
    const sub = items.reduce((acc, it) => acc + (it.qty * it.price), 0);
    const ivaPct = conf.iva_enabled ? (conf.iva_percent || 0) : 0;
    const iva = sub * (ivaPct / 100);
    const total = sub + iva;

    document.getElementById('p-sub').textContent = '$' + formatCOP(sub);
    if(conf.iva_enabled) document.getElementById('p-iva').textContent = '$' + formatCOP(iva);
    document.getElementById('p-total').textContent = '$' + formatCOP(total);
  }

  document.getElementById('btn-add-item').addEventListener('click', () => { items.push({desc:'',qty:1,price:0}); renderItems(); });
  
  renderItems();

  // Resuelve el cliente "Consumidor final" a un registro real (lo crea si aún no existe)
  async function resolveClientId(cid) {
    if (cid !== '__final__') return cid;
    const { data: existing } = await supabase.from('clients').select('id').eq('company_id', companyId).eq('name', 'Consumidor Final').maybeSingle();
    if (existing) return existing.id;
    const { data: created, error } = await supabase.from('clients').insert({ name: 'Consumidor Final', company_id: companyId }).select().single();
    if (error) throw error;
    return created.id;
  }

  document.getElementById('btn-save').addEventListener('click', async () => {
    const cidRaw = document.getElementById('i-client').value;
    if(!cidRaw){ toast('Selecciona un cliente','error'); return; }
    if(items.some(x=>!x.desc)){ toast('Completa la descripción de los ítems','error'); return; }

    const btn = document.getElementById('btn-save');
    btn.disabled=true; btn.textContent='Guardando...';

    try {
      const cid = await resolveClientId(cidRaw);

      const sub = items.reduce((acc, it) => acc + (it.qty * it.price), 0);
      const ivaPct = conf.iva_enabled ? (conf.iva_percent || 0) : 0;
      const iva = sub * (ivaPct / 100);
      const total = sub + iva;

      const payload = {
        company_id: companyId,
        client_id: cid,
        type: 'invoice',
        number: iNum,
        issue_date: document.getElementById('i-date').value,
        subtotal: sub,
        tax_total: iva,
        grand_total: total,
        items: items,
        terms: document.getElementById('i-terms').value,
      };

      const { error } = await supabase.from('documents').insert(payload);
      if(error) throw error;

      await supabase.from('company_config').update({ next_invoice: iNum + 1 }).eq('company_id', companyId);

      toast('Cuenta de cobro guardada','success');
      navigate('/history');
    } catch(err) {
      console.error(err);
      toast('Error al guardar','error');
      btn.disabled=false; btn.textContent='Guardar';
    }
  });
  
  // Obtiene los datos del cliente seleccionado sin necesidad de guardarlo
  function getSelectedClient(cidRaw) {
    if (cidRaw === '__final__') return { name: 'Consumidor Final' };
    return (clients || []).find(c => c.id === cidRaw) || null;
  }

  // Generar PDF (no requiere guardar la cuenta de cobro primero)
  document.getElementById('btn-pdf').addEventListener('click', async () => {
    const cidRaw = document.getElementById('i-client').value;
    if (!cidRaw) { toast('Selecciona un cliente', 'error'); return; }
    if (items.some(x => !x.desc)) { toast('Completa la descripción de los ítems', 'error'); return; }

    const btn = document.getElementById('btn-pdf');
    btn.disabled = true; btn.textContent = 'Generando PDF...';

    try {
      const sub = items.reduce((acc, it) => acc + (it.qty * it.price), 0);
      const ivaPct = conf.iva_enabled ? (conf.iva_percent || 0) : 0;
      const iva = sub * (ivaPct / 100);
      const total = sub + iva;

      await downloadDocumentPDF({
        type: 'invoice',
        number: iNum,
        issueDate: document.getElementById('i-date').value,
        company,
        client: getSelectedClient(cidRaw),
        items,
        subtotal: sub,
        tax: iva,
        taxPercent: conf.iva_enabled ? ivaPct : 0,
        total,
        notes: document.getElementById('i-terms').value,
      });
    } catch (err) {
      console.error(err);
      toast('Error al generar el PDF', 'error');
    }
    btn.disabled = false; btn.textContent = 'Generar PDF';
  });
}
