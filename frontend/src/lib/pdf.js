// src/lib/pdf.js
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function fmt(n) { return '$' + Number(n || 0).toLocaleString('es-CO'); }
function esc(s) { return s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function buildDocumentHTML(data) {
  const {
    type, number, issueDate, company, client, user,
    items, subtotal, tax, taxPercent, total,
    terms, warranty, paymentMode, validity, notes
  } = data;

  const typeLabel = type === 'quote' ? 'Cotización' : 'Cuenta de Cobro';
  const prefix    = type === 'quote' ? 'COT' : 'CC';
  const accent    = company?.primary_color || '#1e293b';
  const accent2   = company?.secondary_color || '#3b82f6';
  const logo      = company?.logo_url ? `<img src="${company.logo_url}" crossorigin="anonymous" style="max-height:64px;max-width:180px;object-fit:contain;display:block;margin-bottom:10px" />` : '';
  const dateStr   = issueDate ? new Date(issueDate).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

  const companyContact = [user?.phone, user?.email].filter(Boolean).join('  ·  ');

  const clientLines = [
    client?.nit ? `NIT/CC: ${esc(client.nit)}` : '',
    [client?.address, client?.city].filter(Boolean).join(', '),
    [client?.phone, client?.email].filter(Boolean).join('  ·  '),
  ].filter(Boolean);

  const legalLines = [
    paymentMode ? { label: 'Forma de pago', value: paymentMode } : null,
    validity    ? { label: 'Validez de la oferta', value: validity } : null,
  ].filter(Boolean);

  return `
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;width:700px;color:#1e293b;background:#ffffff">
      <div style="height:8px;background:linear-gradient(90deg, ${accent}, ${accent2})"></div>
      <div style="padding:36px 44px 42px">

        <!-- Encabezado -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px">
          <div style="max-width:360px">
            ${logo}
            <div style="font-size:19px;font-weight:700;color:${accent};line-height:1.25">${esc(company?.name) || 'Mi Empresa'}</div>
            <div style="font-size:11.5px;color:#64748b;line-height:1.6;margin-top:4px">NIT/CC ${esc(company?.nit) || '—'}</div>
            <div style="font-size:11.5px;color:#64748b;line-height:1.6">${esc([company?.address, company?.city].filter(Boolean).join(', '))}</div>
            ${company?.website ? `<div style="font-size:11.5px;color:#64748b;line-height:1.6">${esc(company.website)}</div>` : ''}
            ${companyContact ? `<div style="font-size:11.5px;color:#64748b;line-height:1.6;margin-top:4px">${esc(companyContact)}</div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end">
            <div style="display:inline-flex;align-items:center;justify-content:center;height:28px;background:${accent};color:#ffffff;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;line-height:1;padding:0 18px;border-radius:20px;white-space:nowrap">${typeLabel}</div>
            <div style="font-size:23px;font-weight:800;line-height:1.3;margin-top:12px;color:#0f172a">${prefix}-${String(number).padStart(4, '0')}</div>
            <div style="font-size:10.5px;color:#94a3b8;line-height:1.5;margin-top:10px;text-transform:uppercase;letter-spacing:.05em">Fecha de emisión</div>
            <div style="font-size:12.5px;font-weight:600;line-height:1.4;color:#334155">${dateStr}</div>
          </div>
        </div>

        <!-- Cliente -->
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-bottom:26px">
          <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;line-height:1.4;margin-bottom:6px">Cliente</div>
          <div style="font-size:14.5px;font-weight:700;line-height:1.4;color:#0f172a">${esc(client?.name) || 'Consumidor Final'}${client?.company ? ' — ' + esc(client.company) : ''}</div>
          ${clientLines.map(l => `<div style="font-size:12px;color:#475569;line-height:1.6;margin-top:2px">${esc(l)}</div>`).join('')}
        </div>

        <!-- Ítems -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:4px">
          <thead>
            <tr>
              <th style="text-align:left;vertical-align:middle;padding:11px 10px;font-size:10.5px;line-height:1;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#ffffff;background:${accent}">Descripción</th>
              <th style="text-align:center;vertical-align:middle;padding:11px 10px;font-size:10.5px;line-height:1;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#ffffff;background:${accent};width:60px">Cant.</th>
              <th style="text-align:right;vertical-align:middle;padding:11px 10px;font-size:10.5px;line-height:1;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#ffffff;background:${accent};width:110px">Valor Unit.</th>
              <th style="text-align:right;vertical-align:middle;padding:11px 10px;font-size:10.5px;line-height:1;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#ffffff;background:${accent};width:110px">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(items || []).map((it, i) => `
              <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'}">
                <td style="vertical-align:middle;padding:10px;font-size:12.5px;line-height:1.4;border-bottom:1px solid #e2e8f0">${esc(it.desc)}</td>
                <td style="text-align:center;vertical-align:middle;padding:10px;font-size:12.5px;line-height:1.4;border-bottom:1px solid #e2e8f0">${it.qty}</td>
                <td style="text-align:right;vertical-align:middle;padding:10px;font-size:12.5px;line-height:1.4;border-bottom:1px solid #e2e8f0">${fmt(it.price)}</td>
                <td style="text-align:right;vertical-align:middle;padding:10px;font-size:12.5px;line-height:1.4;font-weight:600;border-bottom:1px solid #e2e8f0">${fmt(it.qty * it.price)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Totales -->
        <div style="display:flex;justify-content:flex-end;margin-top:16px;margin-bottom:28px">
          <div style="width:280px">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:5px 10px;font-size:12.5px;line-height:1.4;color:#475569">
              <span>Subtotal</span><span>${fmt(subtotal)}</span>
            </div>
            ${taxPercent ? `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:5px 10px;font-size:12.5px;line-height:1.4;color:#475569">
              <span>IVA (${taxPercent}%)</span><span>${fmt(tax)}</span>
            </div>` : ''}
            <div style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;margin-top:8px;background:${accent};color:#ffffff;border-radius:10px">
              <span style="font-size:14px;font-weight:700;line-height:1">TOTAL</span>
              <span style="font-size:18px;font-weight:800;line-height:1">${fmt(total)}</span>
            </div>
          </div>
        </div>

        ${legalLines.length ? `
        <div style="display:flex;gap:24px;margin-bottom:18px">
          ${legalLines.map(l => `
            <div style="flex:1">
              <div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#94a3b8;line-height:1.4;margin-bottom:3px">${esc(l.label)}</div>
              <div style="font-size:12px;color:#334155;line-height:1.5">${esc(l.value)}</div>
            </div>
          `).join('')}
        </div>` : ''}

        ${terms ? `<div style="margin-bottom:14px"><div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#94a3b8;line-height:1.4;margin-bottom:3px">Condiciones comerciales</div><div style="font-size:11.5px;color:#475569;line-height:1.6">${esc(terms).replace(/\n/g, '<br>')}</div></div>` : ''}
        ${warranty ? `<div style="margin-bottom:14px"><div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#94a3b8;line-height:1.4;margin-bottom:3px">Garantía</div><div style="font-size:11.5px;color:#475569;line-height:1.6">${esc(warranty).replace(/\n/g, '<br>')}</div></div>` : ''}
        ${notes ? `<div style="margin-bottom:14px"><div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#94a3b8;line-height:1.4;margin-bottom:3px">Notas</div><div style="font-size:11.5px;color:#475569;line-height:1.6">${esc(notes).replace(/\n/g, '<br>')}</div></div>` : ''}

        <div style="margin-top:30px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:10.5px;line-height:1.4;color:#94a3b8">${user?.name ? `Atendido por ${esc(user.name)}` : ''}</div>
          <div style="font-size:10.5px;line-height:1.4;color:#cbd5e1">Generado con CotiCuenta</div>
        </div>
      </div>
    </div>
  `;
}

function waitForImages(container) {
  const images = Array.from(container.querySelectorAll('img'));
  return Promise.all(images.map(img => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise(resolve => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    });
  }));
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
    await waitForImages(container);
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    const pdf = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
    const margin    = 10;
    const pageWidth  = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const usableWidth  = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;
    const imgWidth  = usableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let offset = 0;

    pdf.addImage(imgData, 'JPEG', margin, margin - offset, imgWidth, imgHeight);
    heightLeft -= usableHeight;

    while (heightLeft > 0) {
      offset += usableHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, margin - offset, imgWidth, imgHeight);
      heightLeft -= usableHeight;
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}
