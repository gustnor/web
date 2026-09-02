async function loadETF() {
    const response = await fetch("/data/etf.csv");
    const text = await response.text();
    const rows = text
        .trim()
        .split(/\r?\n/)
        .map(row => row.split(","));
    const headers = rows[0];
    const table = document.getElementById("table");

    if (!table) {
        return;
    }

    let html = "<thead><tr>";
    headers.forEach(header => {
        html += `<th>${header.replace(/^\uFEFF/, "")}</th>`;
    });
    html += "</tr></thead>";
    html += "<tbody>";

    rows.slice(1).forEach(columns => {
        if (!columns.length || !columns[0]) {
            return;
        }

        const code = columns[0].trim();
        html += "<tr>";
        columns.forEach((value, index) => {
            const header = headers[index]
                .replace(/^\uFEFF/, "")
                .trim();

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

function formatValue(header, value) {
    if (value === undefined || value === null) {
        return "";
    }

    value = value.trim();
    if (value === "") {
        return "";
    }

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

    if (header === "3개월수익률" || header === "등락률") {
        const number = Number(value);
        if (Number.isNaN(number)) {
            return value;
        }
        return `${number.toLocaleString("ko-KR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}%`;
    }

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

loadETF();
