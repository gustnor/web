async function loadWatchlist() {
    const watchlistText = await fetch("data/watchlist.txt")
        .then(response => response.text());
    const watchlist = new Set(
        watchlistText
            .split(/\r?\n/)
            .map(code => code.trim())
            .filter(code => code.length > 0)
    );
    const csvText = await fetch("data/etf.csv")
        .then(response => response.text());
    const rows = csvText
        .trim()
        .split(/\r?\n/)
        .map(row => row.split(","));
    const headers = rows[0];
    const table = document.getElementById("table");
    let html = "<thead><tr>";
    headers.forEach(header => {
        html += `
            <th>
                ${header.replace(/^\uFEFF/, "")}
            </th>
        `;
    });
    html += "</tr></thead>";
    html += "<tbody>";
    rows.slice(1).forEach(columns => {
        if (!columns.length || !columns[0]) {
            return;
        }
        const code = columns[0].trim();
        /* 관심 ETF가 아니면 제외 */
        if (!watchlist.has(code)) {
            return;
        }
        html += "<tr>";
        columns.forEach((value, index) => {
            const header = headers[index]
                .replace(/^\uFEFF/, "")
                .trim();
            /* 종목명 */
            if (header === "종목명") {
                html += `
                    <td class="name">
                        <a href="detail.html?code=${code}">
                            ${value}
                        </a>
                    </td>
                `;
                return;
            }
            let className = "text";
            if (header === "종목코드") {
                className = "code";
            }
            if (isNumberColumn(header)) {
                className = "number";
            }
            html += `
                <td class="${className}">
                    ${formatValue(header, value)}
                </td>
            `;
        });
        html += "</tr>";
    });
    html += "</tbody>";
    table.innerHTML = html;
}
/* =========================================
   숫자 컬럼
   ========================================= */
function isNumberColumn(header) {
    return [
        "현재가",
        "NAV",
        "3개월수익률",
        "거래량",
        "거래대금",
        "시가총액(억)",
        "등락률"
    ].includes(header);
}
/* =========================================
   데이터 포맷
   ========================================= */
function formatValue(header, value) {
    if (value === undefined || value === null) {
        return "";
    }
    value = value.trim();
    if (value === "") {
        return "";
    }
    /* =====================================
       시가총액
       원본 단위 = 억원
       ===================================== */
    if (header === "시가총액(억)") {
        const number = Number(value);
        if (Number.isNaN(number)) {
            return value;
        }
        const jo = Math.floor(number / 10000);
        const eok = number % 10000;
        if (jo > 0 && eok > 0) {
            return `${jo}조 ${eok.toLocaleString("ko-KR")}억`;
        }
        if (jo > 0) {
            return `${jo}조`;
        }
        return `${number.toLocaleString("ko-KR")}억`;
    }
    /* =====================================
       수익률
       ===================================== */
    if (
        header === "3개월수익률" ||
        header === "등락률"
    ) {
        const number = Number(value);
        if (Number.isNaN(number)) {
            return value;
        }
        return `${number.toLocaleString("ko-KR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}%`;
    }
    /* =====================================
       일반 숫자
       ===================================== */
    if (isNumberColumn(header)) {
        const number = Number(value);
        if (Number.isNaN(number)) {
            return value;
        }
        return number.toLocaleString("ko-KR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    }
    return value;
}
loadWatchlist();
