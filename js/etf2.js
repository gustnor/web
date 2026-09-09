var headers = [];
var data = [];
var filtered = [];

var page = 1;
var pageSize = 50;

var sortColumn = -1;
var asc = true;
var renderVersion = 0;
var renderChunkSize = 200;

document.getElementById("search").addEventListener("input", filterData);
document.getElementById("popupClose").onclick = () => {
  document.getElementById("popup").style.display = "none";
};

loadDefaultCsv();

async function loadDefaultCsv() {
  try {
    const response = await fetch("./data/etf2.csv");
    const text = await response.text();
    parseCsv(text);
  } catch (err) {
    document.getElementById("tableArea").innerHTML = "data/etf2.csv 파일을 찾을 수 없습니다.";
    console.error(err);
  }
}

function parseCsv(csv) {
  const rows = csv.trim().split(/\r?\n/);
  headers = rows[0].split(",");

  data = [];
  for (let i = 1; i < rows.length; i++) {
    data.push(rows[i].split(","));
  }

  filtered = [...data];
  page = 1;
  render();
}

function render() {
  const displayData = [...filtered];
  const currentRenderVersion = ++renderVersion;

  let headerHtml = "<table><thead><tr>";

  headers.forEach((h, idx) => {
    const arrow = sortColumn === idx ? (asc ? " ▲" : " ▼") : "";
    headerHtml += `<th onclick="sortTable(${idx})">${h}${arrow}</th>`;
  });

  headerHtml += "</tr></thead><tbody></tbody></table>";
  const tableArea = document.getElementById("tableArea");
  tableArea.innerHTML = headerHtml;
  const tbody = tableArea.querySelector("tbody");

  function appendChunk(start) {
    if (currentRenderVersion !== renderVersion) {
      return;
    }

    const end = Math.min(start + renderChunkSize, displayData.length);
    let rowsHtml = "";
    for (let rowIndex = start; rowIndex < end; rowIndex++) {
      rowsHtml += renderRow(displayData[rowIndex]);
    }
    tbody.insertAdjacentHTML("beforeend", rowsHtml);

    if (end < displayData.length) {
      requestAnimationFrame(() => appendChunk(end));
    }
  }

  appendChunk(0);
}

function renderRow(row) {
  let html = "<tr>";

  row.forEach((col, colIdx) => {
    const header = headers[colIdx].replace(/^\uFEFF/, "").trim();
    let css = isNumberColumn(header) ? "number" : "text";
    if (header === "종목코드") {
      css = "code";
    }
    if (["등락률", "3개월수익률"].includes(header)) {
      css += ` ${Number(col) >= 0 ? "up" : "down"}`;
    }

    if (header === "종목명") {
      html += `<td><a href="#" onclick="showDetail(event,'${row.join("|")}')">${col}</a></td>`;
    } else {
      html += `<td class="${css}">${formatValue(header, col)}</td>`;
    }
  });

  return `${html}</tr>`;

}

function isNumberColumn(header) {
  return [
    "현재가",
    "NAV",
    "3개월수익률",
    "거래량",
    "거래대금",
    "시가총액(억)",
    "등락률",
    "배당수익률",
    "총보수"
  ].includes(header.replace(/^\uFEFF/, "").trim());
}

function formatValue(header, value) {
  if (value === undefined || value === null || value.trim() === "") {
    return "";
  }

  if (header === "종목코드") {
    return value.trim();
  }

  const number = Number(value);
  if (Number.isNaN(number)) {
    return value;
  }

  if (header === "시가총액(억)") {
    const jo = Math.floor(number / 10000);
    const eok = Math.floor(number % 10000);
    if (jo > 0 && eok > 0) return `${jo}조 ${eok.toLocaleString("ko-KR")}억`;
    if (jo > 0) return `${jo}조`;
    return `${number.toLocaleString("ko-KR")}억`;
  }

  if (["NAV", "거래대금"].includes(header)) {
    return Math.floor(number).toLocaleString("ko-KR");
  }

  if (["3개월수익률", "등락률", "배당수익률", "총보수"].includes(header)) {
    return `${number.toLocaleString("ko-KR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}%`;
  }

  return number.toLocaleString("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function filterData() {
  const keyword = document.getElementById("search").value.toLowerCase();
  const nameIndex = headers.findIndex(header =>
    header.replace(/^\uFEFF/, "").trim() === "종목명"
  );

  filtered = data.filter(row =>
    String(row[nameIndex] || "").toLowerCase().includes(keyword)
  );
  page = 1;
  render();
}

function sortTable(idx) {
  if (sortColumn === idx) {
    asc = !asc;
  } else {
    sortColumn = idx;
    asc = true;
  }

  filtered = [...filtered].sort((a, b) => compareRows(a, b, idx));
  page = 1;
  render();
}

function compareRows(a, b, idx) {
  const aa = a[idx] ?? "";
  const bb = b[idx] ?? "";

  const na = Number.parseFloat(String(aa).replace(/,/g, ""));
  const nb = Number.parseFloat(String(bb).replace(/,/g, ""));

  if (!Number.isNaN(na) && !Number.isNaN(nb)) {
    return asc ? na - nb : nb - na;
  }

  const aText = String(aa).trim();
  const bText = String(bb).trim();

  if (aText === bText) {
    return 0;
  }

  return asc
    ? aText.localeCompare(bText, "ko")
    : bText.localeCompare(aText, "ko");
}

function prevPage() {
  if (page > 1) {
    page--;
    render();
  }
}

function nextPage() {
  page++;
  render();
}

function showDetail(e, rowText) {
  e.preventDefault();

  const values = rowText.split("|");
  let html = "";

  headers.forEach((h, i) => {
    html += `
      <div>
        <b>${h}</b> : ${values[i]}
      </div>
    `;
  });

  document.getElementById("popupContent").innerHTML = html;
  document.getElementById("popup").style.display = "block";
}
