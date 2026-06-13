/**
 * InvoicePDF.jsx
 * Generates the exact NutriMeth branded invoice design.
 * Uses HTML print-window approach for pixel-perfect A4 output.
 * All SVG icons taken directly from the provided invoice.html source.
 */

const ROWS_PER_PAGE = 8;

// ─── All icon SVGs inlined from invoice.html ──────────────────────────────────
const SVG_DEFS = `
<svg style="display:none;position:absolute" xmlns="http://www.w3.org/2000/svg">
  <symbol id="icon-whatsapp" viewBox="0 0 91 91">
    <g transform="matrix(1,0,0,1,-2320.767817,-2885.571007)">
      <g transform="matrix(0.03504,0,0,0.03504,2122.964324,2885.571007)">
        <g transform="matrix(3.571289,0,0,3.571289,5619.867618,-538.227931)">
          <path d="M24.92,863.535C25.648,859.321 49.067,684.793 49.053,684.481C48.697,676.868 -3.529,597.275 9.021,475.452C29.6,275.701 205.314,134.428 402.525,152.22C580.904,168.314 730.046,319.209 729.963,511.5C729.88,704.714 588.171,831.763 457.556,862.709C332.028,892.451 248.827,854.767 217.586,841.301C216.32,840.755 216.179,840.695 200.471,843.322C188.502,845.324 188.566,845.483 187.527,845.653C171.669,848.236 27.28,873.122 25.492,873.361C23.794,873.587 23.792,872.635 24.92,863.535ZM368.5,815.033C530.957,812.46 646.3,697.025 667.949,556.561C701.393,339.567 489.288,147.166 263.451,228.365C102.475,286.244 9.087,485.382 103.723,658.382C111.979,673.475 113.729,673.238 112.888,680.543C110.906,697.765 96.731,798.328 97.607,799.416C99.333,801.56 221.3,777.46 224.426,778.691C243.274,786.114 278.395,813.01 368.5,815.033Z" fill="white"/>
          <path d="M456.533,693.056C370.09,677.237 247.581,610.971 196.995,458.338C173.15,386.389 239.53,338.234 259.534,341.28C273.7,343.437 275.174,349.088 299.095,411.664C306.564,431.203 294.388,451.316 278.214,463.1C276.89,464.064 268.399,464.874 282.073,492.695C315.552,560.813 370.664,595.075 405.682,615.182C418.296,622.424 420.102,618.19 442.259,596.259C469.606,569.19 475.337,569.694 496.803,585.084C541.862,617.388 550.782,624.172 533.93,645.845C500.422,688.941 488.639,696.513 456.533,693.056Z" fill="white"/>
        </g>
      </g>
    </g>
  </symbol>
  <symbol id="icon-email" viewBox="0 0 91 61">
    <g transform="matrix(1,0,0,1,-2320.767817,-3044.206237)">
      <g transform="matrix(0.753858,0,0,0.753858,1370.348995,2468.795256)">
        <g transform="matrix(0.267716,0,0,0.267716,1253.792281,755.606494)">
          <path d="M26.11,174.5C26.11,67.819 25.676,67.64 28.705,58.577C32.358,47.645 42.183,36.942 53.416,32.31C62.961,28.374 63.339,28.833 338.5,28.833C442.871,28.833 446.353,26.103 463.292,44.676C475.628,58.201 473.89,60.417 473.89,200.5C473.89,286.498 478.897,309.559 446.584,323.69C437.56,327.636 437.146,327.167 187.5,327.167C59.579,327.167 58.102,328.651 43.794,318.117C23.03,302.83 26.11,295.051 26.11,174.5ZM271.398,235.056C195.892,249.326 182.145,192.823 173.742,200.76C166.135,207.945 167.193,208.902 81.281,293.276C81.019,293.533 76.998,297.483 79.5,297.5C104.939,297.681 104.918,297.331 397.5,297.331C409.22,297.331 423.652,298.183 421.324,295.619C414.327,287.917 413.725,288.665 329.253,203.746C321.223,195.674 320.793,203.977 308.32,215.299C291.149,230.887 272.317,234.741 271.398,235.056ZM56.075,166.5C56.075,274.056 55.862,276.253 57.321,275.116C65.79,268.516 63.902,266.703 152.132,180.137C154.036,178.269 153.794,177.531 152.132,175.863C144.945,168.65 94.63,118.161 62.131,85.87C60.824,84.571 55.965,75.749 56.074,86.499L56.075,166.5ZM443.925,243.5C443.925,94.465 444.676,94.554 444.107,81.615C443.946,77.969 441.851,81.871 410.871,112.868C347.431,176.341 345.198,177.517 347.868,180.137C436.098,266.703 434.21,268.516 442.679,275.116C444.675,276.671 443.926,273.897 443.925,243.5ZM246.525,207.069C279.46,206.272 279.808,201.65 354.25,127.256C420.764,60.785 422.931,58.517 420.5,58.5C393.221,58.306 189.162,56.857 79.5,58.5C76.534,58.544 79.628,61.024 171.271,152.732C219.034,200.529 219.286,203.933 246.525,207.069Z" fill="white"/>
        </g>
      </g>
    </g>
  </symbol>
  <symbol id="icon-web" viewBox="0 0 91 91">
    <g transform="matrix(1,0,0,1,-2320.767817,-3172.601554)">
      <g transform="matrix(0.335943,0,0,0.335943,1791.613481,2885.411211)">
        <path d="M1665.04,880.492C1664.2,879.165 1663.37,877.836 1662.54,876.507C1647.65,887.423 1632.77,898.339 1614.26,911.909C1628.46,916.117 1636.95,918.631 1644.92,920.994C1652.35,906.041 1658.69,893.266 1665.04,880.492ZM1799.36,914.088C1800.08,912.329 1800.8,910.571 1801.52,908.813C1786.3,898.059 1771.08,887.306 1755.86,876.553C1755.23,877.641 1754.59,878.73 1753.96,879.819C1760.71,893.503 1767.45,907.185 1774.54,921.57C1783.15,918.974 1791.26,916.531 1799.36,914.088ZM1756.21,1097.1C1757.6,1098.71 1758.99,1100.32 1760.38,1101.94C1778.24,1086.29 1796.11,1070.64 1813.97,1055C1813,1053.16 1812.04,1051.33 1811.07,1049.49C1800.04,1047.04 1789,1044.591 1779.01,1042.37C1770.8,1062.07 1763.5,1079.59 1756.21,1097.1ZM1640.23,1043.36C1629.07,1046 1618.72,1048.461 1608.36,1050.91C1607.65,1052.99 1606.95,1055.07 1606.24,1057.15C1624.59,1072.38 1642.94,1087.61 1661.29,1102.83C1662.32,1101.53 1663.34,1100.23 1664.37,1098.93C1656.56,1080.97 1648.76,1063 1640.23,1043.36ZM1763.81,939.157C1746.4,941.141 1732.4,942.737 1718.11,944.368L1718.11,973.346L1767.79,973.346C1766.42,961.59 1765.22,951.298 1763.81,939.157ZM1718.59,871.216L1718.59,930.353C1732.83,928.407 1745.36,926.695 1759.18,924.806C1750.52,901.782 1742.44,881.426 1718.59,871.216ZM1650.83,973.253L1701.3,973.253L1701.3,944.059C1685.75,942.423 1671.31,940.904 1655.72,939.263C1654,951.206 1652.53,961.442 1650.83,973.253ZM1701.85,870.107C1677.29,882.082 1668.08,901.552 1660.48,924.911C1674.97,926.65 1687.94,928.207 1701.85,929.876L1701.85,870.107ZM1769.59,990.476L1718.72,990.476L1718.72,1022.52C1735.07,1023.28 1749.78,1023.97 1765.7,1024.721C1766.99,1013.41 1768.16,1003.07 1769.59,990.476ZM1702.05,990.532L1649.38,990.532C1651.04,1003.54 1652.49,1014.91 1653.97,1026.52C1671.47,1024.77 1686.63,1023.25 1702.05,1021.71L1702.05,990.532ZM1782.94,973.919L1830.78,973.919C1824.31,956.414 1818.54,940.791 1812.63,924.801C1798.58,929.321 1788.19,932.664 1777.49,936.107C1779.37,949.151 1781.04,960.729 1782.94,973.919ZM1784.7,990.151C1776.21,1028.67 1781.77,1035.29 1822.48,1034.03C1825.29,1020.2 1828.17,1005.96 1831.38,990.151L1784.7,990.151ZM1641.64,936.453C1604.36,921.686 1594.8,929.01 1592.02,973.426L1636.42,973.426C1638.2,960.79 1639.83,949.249 1641.64,936.453ZM1587.6,990.061C1591.49,1007.37 1594.9,1022.56 1598.49,1038.56C1613.57,1034.88 1625.89,1031.88 1639.2,1028.64C1637.92,1015.28 1636.74,1003.09 1635.49,990.061L1587.6,990.061ZM1717.84,1109.25C1747.18,1092.38 1755.62,1067.3 1763.22,1039.15C1746.76,1038.39 1732.73,1037.74 1717.84,1037.06L1717.84,1109.25ZM1701.52,1108.55L1701.52,1037.091C1686.12,1038.14 1671.89,1039.101 1655.6,1040.211C1665.27,1069.29 1672.88,1094.61 1701.52,1108.55ZM1575.13,990.051C1574.86,916.052 1635.59,854.917 1709.43,854.877C1783.24,854.837 1844.51,916.03 1844.4,989.666C1844.29,1062.38 1783.78,1123.24 1710.74,1124.1C1637.31,1124.96 1575.41,1063.78 1575.13,990.051Z" fill="white" fill-rule="nonzero"/>
      </g>
    </g>
  </symbol>
  <symbol id="icon-location" viewBox="0 0 63 85">
    <g transform="matrix(1,0,0,1,-2334.923565,-3331.191115)">
      <g transform="matrix(0.33276,0,0,0.33276,1588.667563,3228.22289)">
        <path d="M2242.65,402.461C2242.21,384.52 2248.17,366.92 2258.13,351.952C2269.16,335.379 2285.24,322.589 2303.84,315.522C2339.96,301.803 2379.72,311.709 2405.82,340.932C2431.13,369.267 2437.45,412.165 2417.95,445.15C2396.01,482.268 2371.76,518.046 2347.86,553.967C2338.76,567.644 2333.57,567.621 2324.24,553.574C2321.46,549.383 2318.67,545.193 2315.9,541C2300.46,517.703 2285.12,494.336 2270.36,470.603C2258.91,452.195 2246.34,432.703 2243.33,410.785C2242.94,408.008 2242.72,405.23 2242.65,402.461ZM2373.97,398.844C2373.97,377.881 2356.98,360.886 2336.01,360.886C2315.05,360.886 2298.05,377.881 2298.05,398.844C2298.05,419.808 2315.05,436.802 2336.01,436.802C2356.98,436.802 2373.97,419.808 2373.97,398.844Z" fill="white" fill-rule="nonzero"/>
      </g>
    </g>
  </symbol>
</svg>`;

// ─── Decorative SVGs (inline approximations matching the design) ───────────────
const UPPER_GRAPHICS_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 794 108" preserveAspectRatio="xMaxYMid meet">
  <defs>
    <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#668621"/>
      <stop offset="100%" stop-color="#1c6631"/>
    </linearGradient>
  </defs>
  <rect width="794" height="108" fill="url(#hg)"/>
  <!-- Botanical leaf decorations top-right -->
  <g opacity="0.18" fill="#ffffff">
    <ellipse cx="720" cy="20" rx="55" ry="12" transform="rotate(-35 720 20)"/>
    <ellipse cx="745" cy="45" rx="50" ry="11" transform="rotate(-20 745 45)"/>
    <ellipse cx="760" cy="72" rx="45" ry="10" transform="rotate(-50 760 72)"/>
    <ellipse cx="690" cy="55" rx="48" ry="10" transform="rotate(-15 690 55)"/>
    <ellipse cx="775" cy="25" rx="38" ry="8" transform="rotate(-65 775 25)"/>
    <ellipse cx="650" cy="35" rx="42" ry="9" transform="rotate(-10 650 35)"/>
    <ellipse cx="710" cy="90" rx="50" ry="10" transform="rotate(-40 710 90)"/>
    <ellipse cx="780" cy="85" rx="32" ry="7" transform="rotate(-55 780 85)"/>
  </g>
  <!-- Stem lines -->
  <g opacity="0.15" stroke="#ffffff" stroke-width="1.5" fill="none">
    <path d="M680,108 Q700,60 740,15"/>
    <path d="M720,108 Q735,70 760,30"/>
    <path d="M760,108 Q770,80 785,50"/>
  </g>
</svg>`;

const LOWER_GRAPHICS_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 794 310" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#668621"/>
      <stop offset="100%" stop-color="#1c6631"/>
    </linearGradient>
  </defs>
  <!-- Main curved wave shape -->
  <path d="M0,310 L0,140 Q180,60 360,110 Q500,150 650,80 Q720,50 794,70 L794,310 Z" fill="url(#lg)"/>
  <!-- Large decorative circle bottom-right -->
  <circle cx="720" cy="280" r="120" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="40"/>
  <circle cx="720" cy="280" r="70" fill="rgba(255,255,255,0.06)"/>
  <!-- Botanical overlays -->
  <g opacity="0.12" fill="#ffffff">
    <ellipse cx="580" cy="200" rx="70" ry="14" transform="rotate(-30 580 200)"/>
    <ellipse cx="620" cy="230" rx="60" ry="12" transform="rotate(-15 620 230)"/>
    <ellipse cx="550" cy="250" rx="55" ry="11" transform="rotate(-45 550 250)"/>
  </g>
</svg>`;

const BANK_DETAILS_BG_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 130" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2d6a1f"/>
      <stop offset="100%" stop-color="#1c4a26"/>
    </linearGradient>
  </defs>
  <rect width="220" height="130" rx="12" fill="url(#bg)"/>
  <circle cx="180" cy="20" r="50" fill="rgba(255,255,255,0.05)"/>
  <circle cx="200" cy="110" r="60" fill="rgba(255,255,255,0.04)"/>
  <g opacity="0.1" fill="#ffffff">
    <ellipse cx="160" cy="40" rx="45" ry="9" transform="rotate(-25 160 40)"/>
    <ellipse cx="185" cy="65" rx="38" ry="8" transform="rotate(-40 185 65)"/>
  </g>
</svg>`;

function fmtMoney(v, sym = 'Rs.') {
  return sym + ' ' + Number(v || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(str) {
  if (!str) return '';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPage(invoice, items, pageNum, totalPages, isLast, companySettings = {}) {
  const sym       = companySettings.currency_symbol || 'Rs.';
  const payStatus = invoice.payment_status || 'Unpaid';
  const statusCap = payStatus.charAt(0).toUpperCase() + payStatus.slice(1);

  const fillerCount = Math.max(0, ROWS_PER_PAGE - items.length);
  const fillers = Array(fillerCount).fill(
    `<tr class="empty-filler"><td>&nbsp;</td><td></td><td></td><td></td></tr>`
  ).join('');

  const tableRows = items.map((item, i) => `
    <tr>
      <td>${escHtml(item.description || '')}</td>
      <td>${item.qty}</td>
      <td>${fmtMoney(item.unit_price, sym)}</td>
      <td>${fmtMoney(item.total, sym)}</td>
    </tr>`).join('');

  const totalsSection = isLast ? `
    <div class="inv-totals-row">
      <div class="inv-totals-table">
        <div class="tr"><span class="tl">Sub Total :</span><span class="tv">${fmtMoney(invoice.subtotal, sym)}</span></div>
        ${invoice.discount_percent > 0 ? `<div class="tr"><span class="tl">Discount (${invoice.discount_percent}%) :</span><span class="tv" style="color:#c0392b">− ${fmtMoney(invoice.discount_amount, sym)}</span></div>` : ''}
        ${invoice.tax_percent > 0 ? `<div class="tr"><span class="tl">Tax Vat (${invoice.tax_percent}%) :</span><span class="tv">${fmtMoney(invoice.tax_amount, sym)}</span></div>` : ''}
        <div class="tr grand"><span class="tl">Total :</span><span class="tv">${fmtMoney(invoice.grand_total, sym)}</span></div>
        ${invoice.paid_amount > 0 && invoice.payment_status !== 'paid' ? `<div class="tr" style="margin-top:3px"><span class="tl" style="color:#1c6631">Paid :</span><span class="tv" style="color:#1c6631">${fmtMoney(invoice.paid_amount, sym)}</span></div>` : ''}
        ${invoice.remaining_amount > 0 && invoice.payment_status !== 'paid' ? `<div class="tr"><span class="tl" style="color:#c0392b">Remaining :</span><span class="tv" style="color:#c0392b">${fmtMoney(invoice.remaining_amount, sym)}</span></div>` : ''}
      </div>
    </div>` : '';

  const bankBox = isLast && (invoice.account_number || invoice.iban) ? `
    <div class="bank-box">
      <div style="position:absolute;top:0;left:0;width:100%;height:100%;border-radius:12px;overflow:hidden;z-index:0">
        ${BANK_DETAILS_BG_SVG}
      </div>
      <div class="bb-title">Bank Transfer :</div>
      ${invoice.account_number ? `<div class="bb-label">Account Number :</div><div class="bb-val">${escHtml(invoice.account_number)}</div>` : ''}
      ${invoice.iban ? `<div class="bb-label">Virtual Number :</div><div class="bb-val">${escHtml(invoice.iban)}</div>` : ''}
      ${invoice.notes ? `<div class="bb-label" style="margin-top:6px">Notes :</div><div class="bb-val">${escHtml(invoice.notes)}</div>` : ''}
    </div>` : '';

  const contactPhone   = invoice.company_phone   || companySettings.phone   || '+92 3368936834';
  const contactEmail   = invoice.company_email   || companySettings.email   || 'nutrimethofficial@gmail.com';
  const contactWeb     = invoice.company_website  || companySettings.website || 'www.nutrimeth.com';
  const contactAddress = invoice.company_address  || companySettings.address || 'Your Office Address Here';

  const contactSection = isLast ? `
    <div class="contact-block">
      <div class="contact-item">
        <span class="ci-text">${escHtml(contactPhone)}</span>
        <span class="ci-icon"><svg width="28" height="28" style="overflow:visible;display:block"><use href="#icon-whatsapp"/></svg></span>
      </div>
      <div class="contact-item">
        <span class="ci-text">${escHtml(contactEmail)}</span>
        <span class="ci-icon"><svg width="28" height="28" style="overflow:visible;display:block"><use href="#icon-email"/></svg></span>
      </div>
      <div class="contact-item">
        <span class="ci-text">${escHtml(contactWeb)}</span>
        <span class="ci-icon"><svg width="28" height="28" style="overflow:visible;display:block"><use href="#icon-web"/></svg></span>
      </div>
      <div class="contact-item">
        <span class="ci-text">${escHtml(contactAddress)}</span>
        <span class="ci-icon"><svg width="28" height="28" style="overflow:visible;display:block"><use href="#icon-location"/></svg></span>
      </div>
    </div>` : '';

  const bottomSection = isLast ? `
    <div class="inv-bottom">
      ${LOWER_GRAPHICS_SVG}
      ${bankBox}
      ${contactSection}
    </div>` : '';

  const pageIndicator = totalPages > 1
    ? `<div class="meta-row" style="color:#999;font-size:11px"><span class="ml">Page</span><span class="mv" style="font-size:11px;color:#999">${pageNum} / ${totalPages}</span></div>`
    : '';

  return `
    <div class="invoice-page${!isLast ? ' page-break' : ''}">

      <!-- HEADER -->
      <div class="inv-header">
        <div class="inv-header-logo">
          <div class="brand-name">NutriMeth</div>
          <div class="brand-tag">Pure By Nature Trusted By You</div>
        </div>
        <div class="inv-header-title">INVOICE</div>
        <div class="upperGraphics">${UPPER_GRAPHICS_SVG}</div>
      </div>

      <!-- BILL TO + META -->
      <div class="inv-meta-section">
        <div class="bill-to-block">
          <div class="section-label">Bill To</div>
          <div class="field-row"><span class="fl">Client Name :</span><span class="fv">${escHtml(invoice.party_name) || '—'}</span></div>
          <div class="field-row"><span class="fl">Client Number:</span><span class="fv">${escHtml(invoice.party_phone) || '—'}</span></div>
          <div class="field-row"><span class="fl">Client Address:</span><span class="fv">${escHtml(invoice.party_address) || '—'}</span></div>
        </div>
        <div class="meta-block">
          <div class="meta-row"><span class="ml">Invoice Number :</span><span class="mv">${escHtml(invoice.invoice_number)}</span></div>
          <div class="meta-row"><span class="ml">Invoice Date :</span><span class="mv">${fmtDate(invoice.invoice_date)}</span></div>
          <div class="meta-row"><span class="ml">Due Date :</span><span class="mv">${fmtDate(invoice.due_date)}</span></div>
          <div class="meta-row"><span class="ml">Status :</span><span class="mv"><span class="payment-badge ${statusCap}">${statusCap}</span></span></div>
          ${pageIndicator}
        </div>
      </div>

      <!-- TABLE -->
      <div class="inv-table-wrap">
        <table class="inv-table">
          <thead>
            <tr>
              <th style="width:50%">Item Description</th>
              <th style="width:12%">Qty</th>
              <th style="width:19%">Price</th>
              <th style="width:19%">Total</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            ${fillers}
          </tbody>
        </table>
      </div>

      ${totalsSection}
      ${bottomSection}
    </div>`;
}

function buildFullHtml(invoice, companySettings = {}) {
  const items = invoice.items || [];
  const pages = [];
  for (let i = 0; i < items.length; i += ROWS_PER_PAGE) {
    pages.push(items.slice(i, i + ROWS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  const pagesHtml = pages
    .map((pg, idx) => buildPage(invoice, pg, idx + 1, pages.length, idx === pages.length - 1, companySettings))
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${escHtml(invoice.invoice_number)} — NutriMeth Invoice</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600;700&family=Lato:wght@400;700;900&display=swap" rel="stylesheet"/>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root { --g1: #668621; --g2: #1c6631; }

  body { font-family: 'DM Sans', sans-serif; background: #e8ede0; padding: 0; }

  .screen-toolbar {
    background: linear-gradient(90deg, #668621, #1c6631);
    padding: 12px 36px; display: flex; align-items: center;
    justify-content: space-between; box-shadow: 0 2px 16px rgba(0,0,0,0.15);
  }
  .toolbar-brand { font-family: 'Playfair Display', serif; font-size: 20px; color: #fff; }
  .toolbar-right { display: flex; gap: 12px; align-items: center; }
  .btn-print {
    background: #fff; color: #1c6631; border: none; border-radius: 8px;
    padding: 9px 22px; font-family: 'DM Sans', sans-serif; font-size: 13px;
    font-weight: 700; cursor: pointer; display: inline-flex; align-items: center;
    gap: 7px; box-shadow: 0 2px 8px rgba(0,0,0,0.12); transition: opacity 0.2s;
  }
  .btn-print:hover { opacity: 0.85; }
  .btn-close {
    background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.35);
    border-radius: 8px; padding: 9px 18px; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500; cursor: pointer;
  }

  .invoice-stage { display: flex; justify-content: center; padding: 36px 20px 60px; flex-direction: column; align-items: center; gap: 32px; }

  .invoice-page {
    width: 794px; min-height: 1123px; background: #fff; position: relative;
    overflow: hidden; box-shadow: 0 8px 48px rgba(0,0,0,0.18); border-radius: 2px;
  }

  /* HEADER */
  .inv-header {
    position: relative; width: 100%; height: 108px; display: flex;
    align-items: center; justify-content: space-between; padding: 0 44px;
    print-color-adjust: exact; -webkit-print-color-adjust: exact;
  }
  .inv-header .upperGraphics {
    position: absolute; top: 0; right: 0; width: 100%; height: 108px;
    overflow: hidden; z-index: 0;
  }
  .inv-header .upperGraphics svg { width: 100%; height: 108px; display: block; }
  .inv-header-logo { position: relative; z-index: 1; }
  .inv-header-title { position: relative; z-index: 1; font-family: 'Lato', sans-serif; font-size: 52px; font-weight: 900; color: #fff; letter-spacing: 2px; text-transform: uppercase; }
  .brand-name { font-family: 'Playfair Display', serif; font-size: 45px; font-weight: 700; color: #fff; line-height: 1; }
  .brand-tag { font-family: 'Lato', sans-serif; font-size: 10px; color: rgba(255,255,255,0.75); letter-spacing: 1.8px; text-transform: uppercase; margin-top: 3px; }

  /* META */
  .inv-meta-section { padding: 28px 44px 20px; display: flex; justify-content: space-between; gap: 20px; }
  .bill-to-block .section-label { font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #1c1c1c; margin-bottom: 10px; }
  .bill-to-block .field-row { display: flex; gap: 6px; margin-bottom: 5px; font-size: 13.5px; line-height: 1.5; }
  .bill-to-block .field-row .fl { color: #555; font-weight: 400; min-width: 110px; }
  .bill-to-block .field-row .fv { color: #1a2e1a; font-weight: 700; }
  .meta-block { text-align: right; min-width: 220px; }
  .meta-block .meta-row { display: flex; justify-content: flex-end; align-items: baseline; gap: 10px; margin-bottom: 6px; font-size: 13.5px; }
  .meta-block .ml { color: #555; }
  .meta-block .mv { font-weight: 700; color: #1a2e1a; }
  .payment-badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
  .payment-badge.Paid    { background: #e8f5e9; color: #1c6631; border: 1px solid #a5d6a7; }
  .payment-badge.Unpaid  { background: #fdecea; color: #c0392b; border: 1px solid #f5c6c0; }
  .payment-badge.Partial { background: #fff8e1; color: #c07800; border: 1px solid #ffe082; }

  /* TABLE */
  .inv-table-wrap { padding: 0 44px; margin-top: 4px; }
  .inv-table { width: 100%; border-collapse: collapse; }
  .inv-table thead tr {
    background: linear-gradient(90deg, #668621 0%, #1c6631 100%);
    print-color-adjust: exact; -webkit-print-color-adjust: exact;
  }
  .inv-table thead th { padding: 13px 18px; text-align: left; font-size: 13px; font-weight: 600; color: #fff; letter-spacing: 0.4px; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .inv-table thead th:nth-child(2), .inv-table thead th:nth-child(3), .inv-table thead th:nth-child(4) { text-align: center; }
  .inv-table tbody tr { border-top: 1px solid #ddebc8; }
  .inv-table tbody tr:first-child { border-top: none; }
  .inv-table tbody td { padding: 14px 18px; font-size: 13px; color: #1a2e1a; vertical-align: middle; }
  .inv-table tbody td:nth-child(2), .inv-table tbody td:nth-child(3), .inv-table tbody td:nth-child(4) { text-align: center; }
  .inv-table tbody td:nth-child(4) { font-weight: 700; }
  .inv-table tbody tr.empty-filler td { padding: 12px 18px; color: transparent; }

  /* TOTALS */
  .inv-totals-row { display: flex; justify-content: flex-end; padding: 0 44px; margin-top: 16px; }
  .inv-totals-table { font-size: 13px; color: #1a2e1a; min-width: 220px; }
  .inv-totals-table .tr { display: flex; justify-content: space-between; padding: 3px 0; gap: 40px; }
  .inv-totals-table .tr .tl { color: #444; }
  .inv-totals-table .tr .tv { font-weight: 700; text-align: right; }
  .inv-totals-table .tr.grand .tl, .inv-totals-table .tr.grand .tv { font-weight: 800; font-size: 14px; color: #1c6631; }

  /* BOTTOM */
  .inv-bottom { position: absolute; bottom: -10px; left: 0; right: 0; height: 310px; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .inv-bottom > svg, .inv-bottom > div:first-child { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }

  .bank-box {
    position: absolute; left: 44px; bottom: 130px; width: 220px;
    border-radius: 12px; padding: 16px 20px; color: #fff; z-index: 10;
    overflow: hidden;
    print-color-adjust: exact; -webkit-print-color-adjust: exact;
  }
  .bank-box .bb-title { font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 10px; position: relative; z-index: 1; }
  .bank-box .bb-label { font-size: 11px; color: rgba(255,255,255,0.7); letter-spacing: 0.5px; margin-bottom: 2px; position: relative; z-index: 1; }
  .bank-box .bb-val { font-size: 12.5px; font-weight: 500; color: #fff; margin-bottom: 10px; word-break: break-all; position: relative; z-index: 1; }

  .contact-block {
    position: absolute; right: 44px; bottom: 55px;
    display: flex; flex-direction: column; gap: 8px;
    z-index: 10; align-items: flex-end;
  }
  .contact-item { display: flex; align-items: center; gap: 9px; justify-content: flex-end; }
  .contact-item .ci-text { font-size: 13px; font-weight: 500; color: #fff; text-align: right; white-space: nowrap; }
  .contact-item .ci-icon { width: 32px; height: 32px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }

  .page-break { page-break-after: always; }

  @media print {
    html, body { margin: 0; padding: 0; background: #fff !important; }
    .screen-toolbar { display: none !important; }
    .invoice-stage { display: block !important; padding: 0 !important; background: #fff !important; }
    .invoice-page { width: 210mm; min-height: 297mm; box-shadow: none !important; border-radius: 0 !important; page-break-after: always; margin: 0 auto; overflow: visible !important; }
    .invoice-page:last-child { page-break-after: avoid; }
    @page { size: A4 portrait; margin: 0; }
    * { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
    .inv-bottom { position: absolute !important; bottom: -10px !important; height: 310px !important; }
    .contact-block { display: flex !important; visibility: visible !important; }
  }

  @media (max-width: 900px) {
    .invoice-page { transform: scale(0.85); transform-origin: top center; }
  }
  @media (max-width: 600px) {
    .invoice-page { transform: scale(0.55); }
  }
</style>
</head>
<body>
${SVG_DEFS}

<div class="screen-toolbar">
  <div class="toolbar-brand">NutriMeth</div>
  <div class="toolbar-right">
    <button class="btn-close" onclick="window.close()">✕ Close</button>
    <button class="btn-print" onclick="window.print()">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 1h8v4H4V1zM2 5h12a1 1 0 011 1v5a1 1 0 01-1 1h-1v3H4v-3H3a1 1 0 01-1-1V6a1 1 0 011-1z" stroke="#1c6631" stroke-width="1.4" fill="none" stroke-linejoin="round"/>
        <rect x="4" y="10" width="8" height="5" rx="0.5" fill="#c8ddb0" stroke="#1c6631" stroke-width="1.4"/>
        <circle cx="12.5" cy="7.5" r="0.8" fill="#1c6631"/>
      </svg>
      Print / Download PDF
    </button>
  </div>
</div>

<div class="invoice-stage">
  ${pagesHtml}
</div>

</body>
</html>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Open invoice in new window (view + print) */
export function printInvoice(invoice, companySettings) {
  const win = window.open('', '_blank', 'width=1000,height=800');
  if (!win) { alert('Please allow popups to print invoices.'); return; }
  win.document.write(buildFullHtml(invoice, companySettings || {}));
  win.document.close();
  win.focus();
}

/** Open and immediately trigger print dialog */
export function downloadInvoicePDF(invoice, companySettings) {
  const win = window.open('', '_blank', 'width=1000,height=800');
  if (!win) { alert('Please allow popups to download invoices.'); return; }
  win.document.write(buildFullHtml(invoice, companySettings || {}));
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 800);
}

/** Alias kept for backward compatibility */
export { downloadInvoicePDF as downloadPayslipPDF };
export { printInvoice as printPayslip };
