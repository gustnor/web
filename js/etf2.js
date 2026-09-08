var headers = [];
var data = [];
var filtered = [];

var page = 1;
var pageSize = 50;

var sortColumn = -1;
var asc = true;

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

  let html = "<table>";
  html += "<thead><tr>";

  headers.forEach((h, idx) => {
    const arrow = sortColumn === idx ? (asc ? " ▲" : " ▼") : "";
    html += `<th onclick="sortTable(${idx})">${h}${arrow}</th>`;
  });

  html += "</tr></thead>";
  html += "<tbody>";

  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  displayData.slice(start, end).forEach(row => {
    html += "<tr>";

    row.forEach((col, colIdx) => {
      let css = isNumberColumn(headers[colIdx]) ? "number" : "text";

      if (headers[colIdx] === "종목명") {
        html += `
          <td>
            <a href="#" onclick="showDetail(event,'${row.join("|")}')">${col}</a>
          </td>
        `;
      } else {
        html += `<td class="${css}">${formatValue(headers[colIdx], col)}</td>`;
      }
    });

    html += "</tr>";
  });

  html += "</tbody></table>";
  document.getElementById("tableArea").innerHTML = html;

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

  const number = Number(value);
  if (Number.isNaN(number)) {
    return value;
  }

  if (header === "시가총액(억)") {
    const jo = Math.floor(number / 10000);
    const eok = number % 10000;
    if (jo > 0 && eok > 0) return `${jo}조 ${eok.toLocaleString("ko-KR")}억`;
    if (jo > 0) return `${jo}조`;
    return `${number.toLocaleString("ko-KR")}억`;
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

  filtered = data.filter(row => row.some(col => String(col).toLowerCase().includes(keyword)));
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
