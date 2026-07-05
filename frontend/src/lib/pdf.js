// src/lib/pdf.js
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function fmt(n) { return '$' + Number(n || 0).toLocaleString('es-CO'); }
function esc(s) { return s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// Convierte un color hexadecimal a rgba, para crear fondos "tintados" con el color
// de marca del cliente en vez de grises genéricos.
function tint(hex, alpha) {
  const fallback = `rgba(30, 41, 59, ${alpha})`;
  if (!hex) return fallback;
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n) || full.length !== 6) return fallback;
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildDocumentHTML(data) {
  const {
    type, number, issueDate, company, client, user,
    items, subtotal, tax, taxPercent, total,
    terms, warranty, paymentMode, validity, notes
  } = data;

  const typeLabel  = type === 'quote' ? 'Cotización' : 'Cuenta de Cobro';
  const prefix     = type === 'quote' ? 'COT' : 'CC';
  const accent     = company?.primary_color   || '#1e293b';
  const accent2    = company?.secondary_color || '#3b82f6';
  const accentTint = tint(accent, 0.045);
  const accent2Soft = tint(accent2, 0.10);
  const logo = company?.logo_url
    ? `<img src="${company.logo_url}" crossorigin="anonymous" style="max-height:60px;max-width:190px;object-fit:contain;display:block;margin-bottom:12px" />`
    : '';
  const dateStr = issueDate
    ? new Date(issueDate).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  const companyMetaLines = [
    `NIT/CC ${esc(company?.nit) || '—'}`,
    esc([company?.address, company?.city].filter(Boolean).join(', ')),
    company?.website ? esc(company.website) : '',
  ].filter(Boolean);
  const companyContact = [user?.phone, user?.email].filter(Boolean).join('   ·   ');

  const clientLines = [
    client?.nit ? `NIT/CC ${esc(client.nit)}` : '',
    [client?.address, client?.city].filter(Boolean).join(', '),
    [client?.phone, client?.email].filter(Boolean).join('   ·   '),
  ].filter(Boolean);

  const metaRows = [
    { label: 'Forma de pago', value: paymentMode },
    { label: 'Validez de la oferta', value: validity },
  ].filter(r => r.value);

  const closingLine = type === 'quote'
    ? 'Gracias por la oportunidad de trabajar contigo.'
    : 'Gracias por confiar en nuestro trabajo.';

  return `
    <div style="font-family:'Inter','Helvetica Neue',Arial,sans-serif;width:740px;color:#1e293b;background:#ffffff;-webkit-font-smoothing:antialiased">

      <!-- Franja superior de marca -->
      <div style="height:10px;background:linear-gradient(90deg, ${accent}, ${accent2})"></div>

      <div style="padding:40px 46px 0">

        <!-- ═══ ENCABEZADO ═══ -->
        <div style="display:flex;justify-content:space-between;align-items:stretch;gap:24px;margin-bottom:30px">

          <!-- Identidad de la empresa -->
          <div style="max-width:340px;padding-top:2px">
            ${logo}
            <div style="font-size:20px;font-weight:800;color:${accent};line-height:1.3;letter-spacing:-.01em">${esc(company?.name) || 'Mi Empresa'}</div>
            <div style="margin-top:6px">
              ${companyMetaLines.map(l => `<div style="font-size:11.5px;color:#64748b;line-height:1.65">${l}</div>`).join('')}
            </div>
            ${companyContact ? `<div style="font-size:11.5px;color:${accent};font-weight:600;line-height:1.65;margin-top:6px">${esc(companyContact)}</div>` : ''}
          </div>

          <!-- Tarjeta de tipo de documento -->
          <div style="background:${accent2Soft};border-radius:14px;padding:20px 26px;min-width:220px;display:flex;flex-direction:column;align-items:flex-end;justify-content:center">
            <div style="display:inline-flex;align-items:center;justify-content:center;height:26px;background:${accent};color:#ffffff;font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;line-height:1;padding:0 16px;border-radius:20px;white-space:nowrap">${typeLabel}</div>
            <div style="font-size:26px;font-weight:800;line-height:1.3;margin-top:14px;color:#0f172a;letter-spacing:-.01em;white-space:nowrap">${prefix}-${String(number).padStart(4, '0')}</div>
            <div style="width:100%;height:1px;background:${tint(accent2, 0.25)};margin:14px 0 12px"></div>
            <div style="font-size:9.5px;color:#64748b;line-height:1.5;text-transform:uppercase;letter-spacing:.06em">Fecha de emisión</div>
            <div style="font-size:13px;font-weight:700;line-height:1.5;color:#334155">${dateStr}</div>
          </div>
        </div>

        <!-- ═══ CLIENTE + DETALLES ═══ -->
        <div style="display:flex;gap:16px;margin-bottom:30px;align-items:stretch">
          <div style="flex:${metaRows.length ? '1.4' : '1'};background:${accentTint};border:1px solid ${tint(accent, 0.12)};border-radius:12px;padding:18px 22px">
            <div style="font-size:9.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:${accent};line-height:1.4;margin-bottom:8px">Cotizado / Facturado a</div>
            <div style="font-size:15px;font-weight:800;line-height:1.4;color:#0f172a">${esc(client?.name) || 'Consumidor Final'}${client?.company ? ` <span style="font-weight:500;color:#64748b">— ${esc(client.company)}</span>` : ''}</div>
            <div style="margin-top:4px">
              ${clientLines.map(l => `<div style="font-size:12px;color:#475569;line-height:1.7">${esc(l)}</div>`).join('')}
            </div>
          </div>
          ${metaRows.length ? `
          <div style="flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 22px">
            <div style="font-size:9.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8;line-height:1.4;margin-bottom:10px">Detalles</div>
            ${metaRows.map((r, i) => `
              <div style="${i > 0 ? 'margin-top:10px' : ''}">
                <div style="font-size:10px;color:#94a3b8;line-height:1.5">${esc(r.label)}</div>
                <div style="font-size:12.5px;font-weight:600;color:#334155;line-height:1.5">${esc(r.value)}</div>
              </div>
            `).join('')}
          </div>` : ''}
        </div>

        <!-- ═══ ÍTEMS ═══ -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:4px">
          <thead>
            <tr>
              <th style="text-align:center;vertical-align:middle;padding:12px 8px;font-size:10px;line-height:1;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#ffffff;background:${accent};width:34px;border-radius:8px 0 0 0">#</th>
              <th style="text-align:left;vertical-align:middle;padding:12px 10px;font-size:10px;line-height:1;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#ffffff;background:${accent}">Descripción</th>
              <th style="text-align:center;vertical-align:middle;padding:12px 10px;font-size:10px;line-height:1;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#ffffff;background:${accent};width:56px">Cant.</th>
              <th style="text-align:right;vertical-align:middle;padding:12px 10px;font-size:10px;line-height:1;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#ffffff;background:${accent};width:112px">Valor Unit.</th>
              <th style="text-align:right;vertical-align:middle;padding:12px 14px;font-size:10px;line-height:1;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#ffffff;background:${accent};width:112px;border-radius:0 8px 0 0">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(items || []).map((it, i) => `
              <tr style="background:${i % 2 === 0 ? '#ffffff' : accentTint}">
                <td style="text-align:center;vertical-align:middle;padding:11px 8px;font-size:11.5px;color:#94a3b8;font-weight:600;border-bottom:1px solid #eef1f5">${i + 1}</td>
                <td style="vertical-align:middle;padding:11px 10px;font-size:12.5px;line-height:1.45;color:#1e293b;border-bottom:1px solid #eef1f5">${esc(it.desc)}</td>
                <td style="text-align:center;vertical-align:middle;padding:11px 10px;font-size:12.5px;line-height:1.4;color:#475569;border-bottom:1px solid #eef1f5">${it.qty}</td>
                <td style="text-align:right;vertical-align:middle;padding:11px 10px;font-size:12.5px;line-height:1.4;color:#475569;border-bottom:1px solid #eef1f5">${fmt(it.price)}</td>
                <td style="text-align:right;vertical-align:middle;padding:11px 14px;font-size:12.5px;line-height:1.4;font-weight:700;color:#0f172a;border-bottom:1px solid #eef1f5">${fmt(it.qty * it.price)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- ═══ TOTALES ═══ -->
        <div style="display:flex;justify-content:flex-end;margin-top:18px;margin-bottom:32px">
          <div style="width:300px">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 12px;font-size:12.5px;line-height:1.4;color:#64748b">
              <span>Subtotal</span><span style="font-weight:600;color:#334155">${fmt(subtotal)}</span>
            </div>
            ${taxPercent ? `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 12px;font-size:12.5px;line-height:1.4;color:#64748b">
              <span>IVA (${taxPercent}%)</span><span style="font-weight:600;color:#334155">${fmt(tax)}</span>
            </div>` : ''}
            <div style="display:flex;align-items:center;justify-content:space-between;padding:15px 18px;margin-top:10px;background:linear-gradient(90deg, ${accent}, ${accent2});color:#ffffff;border-radius:12px">
              <span style="font-size:13.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;line-height:1">Total ${type === 'quote' ? 'cotizado' : 'a pagar'}</span>
              <span style="font-size:19px;font-weight:800;line-height:1">${fmt(total)}</span>
            </div>
          </div>
        </div>

        ${terms || warranty || notes ? `
        <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin-bottom:24px">
          ${terms ? `<div style="${warranty || notes ? 'margin-bottom:14px' : ''}"><div style="font-size:9.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;line-height:1.4;margin-bottom:4px">Condiciones comerciales</div><div style="font-size:11.5px;color:#475569;line-height:1.65">${esc(terms).replace(/\n/g, '<br>')}</div></div>` : ''}
          ${warranty ? `<div style="${notes ? 'margin-bottom:14px' : ''}"><div style="font-size:9.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;line-height:1.4;margin-bottom:4px">Garantía</div><div style="font-size:11.5px;color:#475569;line-height:1.65">${esc(warranty).replace(/\n/g, '<br>')}</div></div>` : ''}
          ${notes ? `<div><div style="font-size:9.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;line-height:1.4;margin-bottom:4px">Notas</div><div style="font-size:11.5px;color:#475569;line-height:1.65">${esc(notes).replace(/\n/g, '<br>')}</div></div>` : ''}
        </div>` : ''}

        <!-- ═══ CIERRE ═══ -->
        <div style="text-align:center;padding:6px 0 22px">
          <div style="font-size:12px;font-weight:600;color:${accent};line-height:1.5">${closingLine}</div>
        </div>

        <div style="border-top:1px solid #e2e8f0;padding:16px 0;display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:10.5px;line-height:1.4;color:#94a3b8">${user?.name ? `Atendido por <strong style="color:#64748b">${esc(user.name)}</strong>` : ''}</div>
          <div style="font-size:10.5px;line-height:1.4;color:#cbd5e1;font-weight:600">CotiCuenta</div>
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
