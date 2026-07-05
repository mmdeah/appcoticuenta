// src/pages/quotes-new.js
import { requireAuth }  from '../lib/auth.js';
import { navigate }     from '../lib/router.js';
import { supabase }     from '../lib/supabase.js';
import { toast }        from '../components/toast.js';
import { renderSidebar, initSidebarEvents, renderTopBar } from '../components/sidebar.js';

export async function renderQuoteNew(params) {
  const auth = await requireAuth('client');
  if (!auth) return;
  const { profile } = auth;
  const companyId = profile.company_id;

  // Cargar datos base
  const [
    { data: company },
    { data: clients }
  ] = await Promise.all([
    supabase.from('companies').select('*, company_config(*)').eq('id', companyId).single(),
    supabase.from('clients').select('*').eq('company_id', companyId).order('name')
  ]);

  const conf = company?.company_config?.[0] || {};
  let quoteId = params?.id; // Si es edición (no implementado en router, pero por si acaso)
  let qNum = conf.next_quote || 1;
  let items = [{ desc: '', qty: 1, price: 0 }];

  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      ${renderSidebar('client', profile)}
      <div class="main-content">
        ${renderTopBar('Nueva Cotización', `<div class="autosave-status"><div class="autosave-dot"></div> Borrador</div>`)}
        <div class="page-content" style="background:#f8fafc">
          
          <div class="builder-layout">
            <div class="builder-form">
              <!-- Detalles base -->
              <div class="card">
                <div class="form-row cols-2">
                  <div class="form-group">
                    <label class="form-label">Cliente</label>
                    <select class="form-control" id="q-client">
                      <option value="">-- Seleccionar --</option>
                      ${(clients||[]).map(c=>`<option value="${c.id}">${c.name} ${c.company?`(${c.company})`:''}</option>`).join('')}
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Fecha de emisión</label>
                    <input type="date" class="form-control" id="q-date" value="${new Date().toISOString().split('T')[0]}" />
                  </div>
                </div>
              </div>

              <!-- Items -->
              <div class="card" style="padding:16px">
                <h4 style="margin-bottom:12px;font-size:14px">Ítems</h4>
                <div class="items-table" style="margin-bottom:12px">
                  <div class="item-row item-row-header">
                    <div>Descripción</div><div>Cant.</div><div>Valor Unit.</div><div>Total</div><div></div>
                  </div>
                  <div id="items-container"></div>
                </div>
                <button class="btn btn-outline btn-sm" id="btn-add-item">+ Agregar ítem</button>
              </div>

              <!-- Textos -->
              <div class="card">
                <div class="form-group"><label class="form-label">Condiciones comerciales</label><textarea id="q-terms" class="form-control" style="min-height:60px">${conf.terms||''}</textarea></div>
                <div class="form-group"><label class="form-label">Garantía</label><textarea id="q-warr" class="form-control" style="min-height:60px">${conf.warranty||''}</textarea></div>
                <div class="form-row cols-2">
                  <div class="form-group"><label class="form-label">Forma de pago</label><input id="q-pay" class="form-control" value="${conf.paymode||''}" /></div>
                  <div class="form-group"><label class="form-label">Validez</label><input id="q-val" class="form-control" value="${conf.validity||''}" /></div>
                </div>
              </div>
            </div>

            <!-- Preview panel -->
            <div class="builder-preview">
              <div class="preview-header">
                <span>Vista Previa</span>
                <span style="color:var(--c-accent)">COT-${String(qNum).padStart(4,'0')}</span>
              </div>
              <div class="preview-body">
                <div class="totals-section">
                  <div class="total-row"><span>Subtotal</span><span id="p-sub">$0</span></div>
                  <div class="total-row" id="p-iva-row" style="display:${conf.iva_enabled?'flex':'none'}"><span>IVA (${conf.iva_percent||0}%)</span><span id="p-iva">$0</span></div>
                  <div class="total-row grand"><span>TOTAL</span><span id="p-total">$0</span></div>
                </div>
                <button class="btn btn-primary btn-block btn-lg" id="btn-save" style="margin-top:16px">Guardar Cotización</button>
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

  function renderItems() {
    container.innerHTML = items.map((it, i) => `
      <div class="item-row">
        <input type="text" class="form-control item-desc" data-i="${i}" value="${it.desc}" placeholder="Producto/Servicio..." />
        <input type="number" class="form-control item-qty" data-i="${i}" value="${it.qty}" min="1" />
        <input type="number" class="form-control item-price" data-i="${i}" value="${it.price}" min="0" step="1000" />
        <div style="font-weight:600;font-size:13px;text-align:right">$${(it.qty * it.price).toLocaleString('es-CO')}</div>
        <button class="item-btn-remove" data-i="${i}">×</button>
      </div>
    `).join('');

    // Bind events
    container.querySelectorAll('.item-desc').forEach(el => el.addEventListener('input', e => { items[e.target.dataset.i].desc = e.target.value; updateTotals(); }));
    container.querySelectorAll('.item-qty').forEach(el => el.addEventListener('input', e => { items[e.target.dataset.i].qty = Number(e.target.value); renderItems(); }));
    container.querySelectorAll('.item-price').forEach(el => el.addEventListener('input', e => { items[e.target.dataset.i].price = Number(e.target.value); renderItems(); }));
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

    document.getElementById('p-sub').textContent = '$' + sub.toLocaleString('es-CO');
    if(conf.iva_enabled) document.getElementById('p-iva').textContent = '$' + iva.toLocaleString('es-CO');
    document.getElementById('p-total').textContent = '$' + total.toLocaleString('es-CO');
  }

  document.getElementById('btn-add-item').addEventListener('click', () => { items.push({desc:'',qty:1,price:0}); renderItems(); });
  
  renderItems();

  // Guardar DB
  document.getElementById('btn-save').addEventListener('click', async () => {
    const cid = document.getElementById('q-client').value;
    if(!cid){ toast('Selecciona un cliente','error'); return; }
    
    // Check empty items
    if(items.some(x=>!x.desc)){ toast('Completa la descripción de los ítems','error'); return; }

    const btn = document.getElementById('btn-save');
    btn.disabled=true; btn.textContent='Guardando...';

    const sub = items.reduce((acc, it) => acc + (it.qty * it.price), 0);
    const ivaPct = conf.iva_enabled ? (conf.iva_percent || 0) : 0;
    const iva = sub * (ivaPct / 100);
    const total = sub + iva;

    const payload = {
      company_id: companyId,
      client_id: cid,
      type: 'quote',
      number: qNum,
      issue_date: document.getElementById('q-date').value,
      subtotal: sub,
      tax_total: iva,
      grand_total: total,
      items: items,
      terms: document.getElementById('q-terms').value,
      warranty: document.getElementById('q-warr').value,
      payment_mode: document.getElementById('q-pay').value,
      validity: document.getElementById('q-val').value,
    };

    try {
      const { error } = await supabase.from('documents').insert(payload);
      if(error) throw error;
      
      // Incrementar consecutivo
      await supabase.from('company_config').update({ next_quote: qNum + 1 }).eq('company_id', companyId);
      
      toast('Cotización guardada','success');
      navigate('/history');
    } catch(err) {
      console.error(err);
      toast('Error al guardar','error');
      btn.disabled=false; btn.textContent='Guardar Cotización';
    }
  });

  // PDF Helper
  document.getElementById('btn-pdf').addEventListener('click', () => {
    toast('Guarda la cotización primero para generar el PDF.','warning');
  });
}
