let headers = [];
let data = [];
let filtered = [];

let page = 1;
let pageSize = 50;

let sortColumn = -1;
let asc = true;

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
    document.getElementById("stats").innerHTML = "data/etf2.csv 파일을 찾을 수 없습니다.";
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

  document.getElementById("stats").innerHTML = `Rows : ${displayData.length}`;

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
      let css = "";
      if (!isNaN(col)) css = "num";

      if (headers[colIdx].includes("등락률")) {
        css = parseFloat(col) >= 0 ? "up" : "down";
      }

      if (headers[colIdx] === "종목명") {
        html += `
          <td>
            <a href="#" onclick="showDetail(event,'${row.join("|")}')">${col}</a>
          </td>
        `;
      } else {
        html += `<td class="${css}">${format(col)}</td>`;
      }
    });

    html += "</tr>";
  });

  html += "</tbody></table>";
  document.getElementById("tableArea").innerHTML = html;

  const maxPage = Math.max(1, Math.ceil(displayData.length / pageSize));
  document.getElementById("pageInfo").innerHTML = `${page} / ${maxPage}`;
}

function format(v) {
  if (v === "" || isNaN(v)) return v;
  return Number(v).toLocaleString();
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

  filtered.sort((a, b) => compareRows(a, b, idx));
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
