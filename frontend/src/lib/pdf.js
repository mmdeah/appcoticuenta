// src/lib/pdf.js
import html2pdf from 'html2pdf.js';

function fmt(n) { return '$' + Number(n || 0).toLocaleString('es-CO'); }

function buildDocumentHTML(data) {
  const {
    type, number, issueDate, company, client,
    items, subtotal, tax, taxPercent, total,
    terms, warranty, paymentMode, validity, notes
  } = data;

  const typeLabel = type === 'quote' ? 'Cotización' : 'Cuenta de Cobro';
  const prefix    = type === 'quote' ? 'COT' : 'CC';
  const accent    = company?.primary_color || '#1e293b';
  const logo      = company?.logo_url ? `<img src="${company.logo_url}" style="max-height:60px;max-width:170px;object-fit:contain" />` : '';

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;padding:36px;color:#1e293b;font-size:13px;width:700px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid ${accent};padding-bottom:16px;margin-bottom:20px">
        <div>
          ${logo}
          <div style="font-size:17px;font-weight:700;margin-top:8px">${company?.name || 'Mi Empresa'}</div>
          <div>NIT/CC: ${company?.nit || '—'}</div>
          <div>${[company?.address, company?.city].filter(Boolean).join(', ')}</div>
          <div>${company?.website || ''}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:19px;font-weight:700;color:${accent}">${typeLabel}</div>
          <div style="font-size:15px;font-weight:600;margin-top:4px">${prefix}-${String(number).padStart(4, '0')}</div>
          <div style="margin-top:4px">Fecha: ${issueDate ? new Date(issueDate).toLocaleDateString('es-CO') : '—'}</div>
        </div>
      </div>

      <div style="margin-bottom:20px">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#64748b;margin-bottom:4px">Cliente</div>
        <div style="font-weight:600">${client?.name || 'Consumidor Final'}${client?.company ? ' — ' + client.company : ''}</div>
        ${client?.nit ? `<div>NIT/CC: ${client.nit}</div>` : ''}
        ${(client?.address || client?.city) ? `<div>${[client?.address, client?.city].filter(Boolean).join(', ')}</div>` : ''}
        ${client?.phone ? `<div>Tel: ${client.phone}</div>` : ''}
        ${client?.email ? `<div>${client.email}</div>` : ''}
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <thead>
          <tr style="background:#f1f5f9">
            <th style="text-align:left;padding:8px;border:1px solid #e2e8f0;font-size:11px;text-transform:uppercase">Descripción</th>
            <th style="text-align:center;padding:8px;border:1px solid #e2e8f0;font-size:11px;text-transform:uppercase">Cant.</th>
            <th style="text-align:right;padding:8px;border:1px solid #e2e8f0;font-size:11px;text-transform:uppercase">Valor Unit.</th>
            <th style="text-align:right;padding:8px;border:1px solid #e2e8f0;font-size:11px;text-transform:uppercase">Total</th>
          </tr>
        </thead>
        <tbody>
          ${(items || []).map(it => `
            <tr>
              <td style="padding:8px;border:1px solid #e2e8f0">${it.desc || ''}</td>
              <td style="text-align:center;padding:8px;border:1px solid #e2e8f0">${it.qty}</td>
              <td style="text-align:right;padding:8px;border:1px solid #e2e8f0">${fmt(it.price)}</td>
              <td style="text-align:right;padding:8px;border:1px solid #e2e8f0">${fmt(it.qty * it.price)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="display:flex;justify-content:flex-end;margin-bottom:20px">
        <table style="width:260px">
          <tr><td style="padding:4px 8px">Subtotal</td><td style="text-align:right;padding:4px 8px">${fmt(subtotal)}</td></tr>
          ${taxPercent ? `<tr><td style="padding:4px 8px">IVA (${taxPercent}%)</td><td style="text-align:right;padding:4px 8px">${fmt(tax)}</td></tr>` : ''}
          <tr style="font-weight:700;border-top:2px solid #1e293b"><td style="padding:6px 8px">TOTAL</td><td style="text-align:right;padding:6px 8px">${fmt(total)}</td></tr>
        </table>
      </div>

      ${paymentMode ? `<div style="margin-bottom:8px"><strong>Forma de pago:</strong> ${paymentMode}</div>` : ''}
      ${validity ? `<div style="margin-bottom:8px"><strong>Validez de la oferta:</strong> ${validity}</div>` : ''}
      ${terms ? `<div style="margin-bottom:8px"><strong>Condiciones comerciales:</strong><br>${String(terms).replace(/\n/g, '<br>')}</div>` : ''}
      ${warranty ? `<div style="margin-bottom:8px"><strong>Garantía:</strong><br>${String(warranty).replace(/\n/g, '<br>')}</div>` : ''}
      ${notes ? `<div style="margin-bottom:8px">${String(notes).replace(/\n/g, '<br>')}</div>` : ''}
    </div>
  `;
}

export async function downloadDocumentPDF(data) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.innerHTML = buildDocumentHTML(data);
  document.body.appendChild(container);

  const prefix   = data.type === 'quote' ? 'COT' : 'CC';
  const filename = `${prefix}-${String(data.number).padStart(4, '0')}.pdf`;

  try {
    await html2pdf().from(container).set({
      margin: 10,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    }).save();
  } finally {
    document.body.removeChild(container);
  }
}
