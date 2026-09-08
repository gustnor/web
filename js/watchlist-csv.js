var headers = [];
var data = [];
var filtered = [];

var page = 1;
var pageSize = 50;

var sortColumn = -1;
var asc = true;

var csvPath = document.currentScript.dataset.csv;

document.getElementById("popupClose").onclick = () => {
    document.getElementById("popup").style.display = "none";
};

async function loadWatchlistCsv() {
    const response = await fetch(csvPath);
    const text = await response.text();
    parseCsv(text);
}

function parseCsv(csv) {
    const rows = csv.trim().split(/\r?\n/);
    headers = rows[0].split(",");
    data = rows.slice(1).map(row => row.split(","));
    filtered = [...data];
    page = 1;
    render();
}

function render() {
    const displayData = [...filtered];
    let html = "<table><thead><tr>";
    headers.forEach((header, index) => {
        const arrow = sortColumn === index ? (asc ? " ▲" : " ▼") : "";
        html += `<th onclick="sortTable(${index})">${header}${arrow}</th>`;
    });
    html += "</tr></thead><tbody>";

    displayData.forEach(row => {
        html += "<tr>";
        row.forEach((value, index) => {
            const header = headers[index].replace(/^\uFEFF/, "");
            let css = isNumberColumn(header) ? "number" : "text";
            if (["등락률", "3개월수익률"].includes(header)) {
                css += ` ${Number(value) >= 0 ? "up" : "down"}`;
            }
            if (header === "종목명") {
                html += `<td><a href="#" onclick="showDetail(event, '${escapeAttribute(row.join("|"))}')">${escapeHtml(value)}</a></td>`;
            } else {
                html += `<td class="${css}">${formatValue(header, value)}</td>`;
            }
        });
        html += "</tr>";
    });

    document.getElementById("tableArea").innerHTML = `${html}</tbody></table>`;
}

function isNumberColumn(header) {
    return [
        "현재가", "NAV", "3개월수익률", "거래량", "거래대금",
        "시가총액(억)", "등락률", "배당수익률", "총보수"
    ].includes(header.replace(/^\uFEFF/, "").trim());
}

function formatValue(header, value) {
    const trimmedValue = value.trim();
    if (trimmedValue === "") return "";

    if (header === "종목코드") return escapeHtml(trimmedValue);

    const number = Number(trimmedValue);
    if (Number.isNaN(number)) return escapeHtml(trimmedValue);

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
    filtered = data.filter(row => row.some(column => column.toLowerCase().includes(keyword)));
    page = 1;
    render();
}

function sortTable(index) {
    if (sortColumn === index) asc = !asc;
    else {
        sortColumn = index;
        asc = true;
    }
    filtered = [...filtered].sort((a, b) => compareRows(a, b, index));
    page = 1;
    render();
}

function compareRows(a, b, index) {
    const aa = Number.parseFloat(a[index].replace(/,/g, ""));
    const bb = Number.parseFloat(b[index].replace(/,/g, ""));
    if (!Number.isNaN(aa) && !Number.isNaN(bb)) return asc ? aa - bb : bb - aa;
    return asc
        ? a[index].localeCompare(b[index], "ko")
        : b[index].localeCompare(a[index], "ko");
}

function prevPage() {
    if (page > 1) {
        page--;
        render();
    }
}

function nextPage() {
    const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (page < maxPage) {
        page++;
        render();
    }
}

function showDetail(event, rowText) {
    event.preventDefault();
    const values = rowText.split("|");
    document.getElementById("popupContent").innerHTML = headers
        .map((header, index) => `<div><b>${escapeHtml(header)}</b> : ${escapeHtml(values[index] || "")}</div>`)
        .join("");
    document.getElementById("popup").style.display = "block";
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("`", "&#96;");
}

loadWatchlistCsv();