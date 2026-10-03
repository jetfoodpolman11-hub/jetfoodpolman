/**
 * Client-side Export Utilities (Excel .xls & Print-ready PDF)
 * Used across Admin Attendance, Reports, and Operational Analytics (Rekap)
 */

export interface ExportSummaryItem {
  label: string;
  value: string;
}

export interface ExportTableSection {
  sectionTitle?: string;
  headers: string[];
  rows: (string | number)[][];
  footerRow?: (string | number)[];
}

export interface ExportDocumentConfig {
  fileName: string;
  title: string;
  subtitle: string;
  summaryItems?: ExportSummaryItem[];
  tables: ExportTableSection[];
}

function escapeHtml(value: string | number | null | undefined): string {
  const str = String(value ?? "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getWitaPrintTimestamp(): string {
  return (
    new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Makassar",
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date()) + " WITA"
  );
}

/**
 * Download formatted Microsoft Excel (.xls) document
 */
export function exportToExcel(config: ExportDocumentConfig): void {
  if (typeof window === "undefined") return;

  const printedAt = getWitaPrintTimestamp();
  const maxCols = Math.max(
    4,
    ...config.tables.map((t) => t.headers.length)
  );

  const summaryHtml =
    config.summaryItems && config.summaryItems.length > 0
      ? `
      <tr><td colspan="${maxCols}"></td></tr>
      <tr>
        <td colspan="${maxCols}" style="background:#f8fafc;font-weight:bold;border:1px solid #cbd5e1;padding:6px;">
          RINGKASAN EKSEKUTIF
        </td>
      </tr>
      ${config.summaryItems
        .map(
          (item) => `
        <tr>
          <td colspan="2" style="border:1px solid #cbd5e1;padding:5px;font-weight:bold;background:#ffffff;">${escapeHtml(item.label)}</td>
          <td colspan="${Math.max(1, maxCols - 2)}" style="border:1px solid #cbd5e1;padding:5px;background:#ffffff;">${escapeHtml(item.value)}</td>
        </tr>`
        )
        .join("")}
    `
      : "";

  const tablesHtml = config.tables
    .map((table) => {
      const titleRow = table.sectionTitle
        ? `
        <tr><td colspan="${maxCols}"></td></tr>
        <tr>
          <td colspan="${table.headers.length}" style="background:#1e293b;color:#ffffff;font-weight:bold;padding:7px;border:1px solid #0f172a;">
            ${escapeHtml(table.sectionTitle)}
          </td>
        </tr>`
        : `<tr><td colspan="${maxCols}"></td></tr>`;

      const headerRow = `
        <tr>
          ${table.headers
            .map(
              (h) =>
                `<th style="background:#dc0000;color:#ffffff;font-weight:bold;padding:7px;border:1px solid #991b1b;text-align:left;">${escapeHtml(h)}</th>`
            )
            .join("")}
        </tr>`;

      const bodyRows =
        table.rows.length === 0
          ? `<tr><td colspan="${table.headers.length}" style="padding:10px;text-align:center;border:1px solid #cbd5e1;">Tidak ada data pada periode/filter ini.</td></tr>`
          : table.rows
              .map(
                (row, idx) => `
              <tr>
                ${row
                  .map(
                    (cell) =>
                      `<td style="padding:6px;border:1px solid #cbd5e1;background:${
                        idx % 2 === 0 ? "#ffffff" : "#f8fafc"
                      };">${escapeHtml(cell)}</td>`
                  )
                  .join("")}
              </tr>`
              )
              .join("");

      const footerHtml = table.footerRow
        ? `
        <tr>
          ${table.footerRow
            .map(
              (cell) =>
                `<td style="padding:7px;border:1px solid #94a3b8;background:#f1f5f9;font-weight:bold;">${escapeHtml(cell)}</td>`
            )
            .join("")}
        </tr>`
        : "";

      return `${titleRow}${headerRow}${bodyRows}${footerHtml}`;
    })
    .join("");

  const fullExcelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>JetFood Polman</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body style="font-family:Arial,sans-serif;font-size:11pt;">
        <table border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td colspan="${maxCols}" style="font-size:15pt;font-weight:bold;color:#dc0000;padding:4px 0;">
              JETFOOD POLMAN — ${escapeHtml(config.title.toUpperCase())}
            </td>
          </tr>
          <tr>
            <td colspan="${maxCols}" style="font-size:10pt;color:#334155;padding:2px 0;">
              ${escapeHtml(config.subtitle)}
            </td>
          </tr>
          <tr>
            <td colspan="${maxCols}" style="font-size:9pt;color:#64748b;padding:2px 0;">
              Dicetak pada: ${escapeHtml(printedAt)} | Wilayah Operasional: Kabupaten Polewali Mandar, Sulawesi Barat
            </td>
          </tr>
          ${summaryHtml}
          ${tablesHtml}
        </table>
      </body>
    </html>
  `;

  const blob = new Blob(["\uFEFF", fullExcelHtml], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${config.fileName}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Open Print-Ready Official A4 PDF Report Window and trigger Save as PDF
 */
export function exportToPdf(config: ExportDocumentConfig): void {
  if (typeof window === "undefined") return;

  const printedAt = getWitaPrintTimestamp();

  const summaryCardsHtml =
    config.summaryItems && config.summaryItems.length > 0
      ? `
      <div class="summary-grid">
        ${config.summaryItems
          .map(
            (item) => `
          <div class="summary-card">
            <div class="summary-label">${escapeHtml(item.label)}</div>
            <div class="summary-value">${escapeHtml(item.value)}</div>
          </div>`
          )
          .join("")}
      </div>`
      : "";

  const tablesHtml = config.tables
    .map((table) => {
      const sectionHeading = table.sectionTitle
        ? `<h3 class="section-title">${escapeHtml(table.sectionTitle)}</h3>`
        : "";

      const headers = table.headers
        .map((h) => `<th>${escapeHtml(h)}</th>`)
        .join("");

      const rows =
        table.rows.length === 0
          ? `<tr><td colspan="${table.headers.length}" style="text-align:center;padding:18px;color:#64748b;">Tidak ada data tercatat pada periode/filter ini.</td></tr>`
          : table.rows
              .map(
                (row) =>
                  `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
              )
              .join("");

      const footer = table.footerRow
        ? `<tfoot><tr>${table.footerRow
            .map((cell) => `<td>${escapeHtml(cell)}</td>`)
            .join("")}</tr></tfoot>`
        : "";

      return `
        <div class="table-section">
          ${sectionHeading}
          <table>
            <thead><tr>${headers}</tr></thead>
            <tbody>${rows}</tbody>
            ${footer}
          </table>
        </div>
      `;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(config.title)} — JetFood Polman</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 16px;
            font-size: 11px;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 3px solid #dc0000;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .brand-badge {
            background: #dc0000;
            color: #ffffff;
            font-weight: 900;
            font-size: 14px;
            padding: 8px 12px;
            border-radius: 8px;
            letter-spacing: 0.5px;
          }
          .doc-title {
            font-size: 18px;
            font-weight: 900;
            margin: 0;
            color: #0f172a;
          }
          .doc-sub {
            font-size: 11px;
            color: #475569;
            margin: 3px 0 0 0;
          }
          .meta {
            text-align: right;
            font-size: 10px;
            color: #64748b;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 8px;
            margin-bottom: 16px;
          }
          .summary-card {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 8px 10px;
            background: #f8fafc;
          }
          .summary-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
          }
          .summary-value {
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 3px;
          }
          .table-section {
            margin-bottom: 18px;
          }
          .section-title {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            margin: 0 0 8px 0;
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background: #0f172a;
            color: #ffffff;
            font-weight: 700;
            text-align: left;
            padding: 7px 8px;
            border: 1px solid #0f172a;
            font-size: 10px;
            text-transform: uppercase;
          }
          td {
            padding: 6px 8px;
            border: 1px solid #cbd5e1;
            vertical-align: top;
          }
          tbody tr:nth-child(even) td {
            background: #f8fafc;
          }
          tfoot td {
            background: #f1f5f9;
            font-weight: 800;
            border-top: 2px solid #0f172a;
          }
          .footer-sign {
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #64748b;
          }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom:14px;display:flex;gap:8px;justify-content:flex-end;">
          <button onclick="window.print()" style="background:#dc0000;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:bold;cursor:pointer;">
            Cetak / Simpan sebagai PDF
          </button>
          <button onclick="window.close()" style="background:#e2e8f0;color:#0f172a;border:none;padding:8px 14px;border-radius:6px;font-weight:bold;cursor:pointer;">
            Tutup
          </button>
        </div>

        <div class="header">
          <div class="brand">
            <div class="brand-badge">JETFOOD POLMAN</div>
            <div>
              <h1 class="doc-title">${escapeHtml(config.title)}</h1>
              <p class="doc-sub">${escapeHtml(config.subtitle)}</p>
            </div>
          </div>
          <div class="meta">
            <div><strong>Sistem Operasional Kurir</strong></div>
            <div>Kabupaten Polewali Mandar, Sulbar</div>
            <div>Dicetak: ${escapeHtml(printedAt)}</div>
          </div>
        </div>

        ${summaryCardsHtml}
        ${tablesHtml}

        <div class="footer-sign">
          <div>Dokumen Resmi Operasional Internal — JetFood Polewali Mandar</div>
          <div>Administrator: jetfoodpolman11@gmail.com</div>
        </div>

        <script>
          window.addEventListener("load", function () {
            setTimeout(function () {
              window.print();
            }, 250);
          });
        </script>
      </body>
    </html>
  `;

  const printWin = window.open("", "_blank", "width=1024,height=768");
  if (printWin) {
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  }
}
