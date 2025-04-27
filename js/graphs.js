export function createLegendItem(color, label) {
    const item = document.createElement("div");
    item.className = "legend-item";

    const colorBox = document.createElement("span");
    colorBox.className = "legend-color";
    colorBox.style.backgroundColor = color;

    const text = document.createElement("span");
    text.textContent = label;

    item.appendChild(colorBox);
    item.appendChild(text);
    return item;
}

export function createProjectGraph(container, userData) {
    if (!container) return;
    container.innerHTML = `
        <div class="chart-info-container">
            <h3>XP Progression</h3>
            <div class="chart-content"></div>
        </div>
    `;

    const chartContent = container.querySelector('.chart-content');
    const width = 800;
    const height = 300;
    const padding = 40;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");

    // Обработка данных
    let totalXP = 0;
    const xpData = userData.transactions
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .map(t => ({
            date: new Date(t.createdAt),
            amount: totalXP += t.amount,
            project: t.path.split('/').pop()
        }));

    // Оси
    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxis.setAttribute("x1", padding);
    xAxis.setAttribute("y1", height - padding);
    xAxis.setAttribute("x2", width - padding);
    xAxis.setAttribute("y2", height - padding);
    xAxis.setAttribute("stroke", "#718096");
    svg.appendChild(xAxis);

    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxis.setAttribute("x1", padding);
    yAxis.setAttribute("y1", padding);
    yAxis.setAttribute("x2", padding);
    yAxis.setAttribute("y2", height - padding);
    yAxis.setAttribute("stroke", "#718096");
    svg.appendChild(yAxis);

    // График
    const pathData = `M ${padding} ${height - padding} ` + 
        xpData.map((d, i) => {
            const x = padding + (i / (xpData.length - 1)) * (width - 2 * padding);
            const y = height - padding - (d.amount / totalXP) * (height - 2 * padding);
            return `L ${x} ${y}`;
        }).join(' ');

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("stroke", "#4299E1");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    svg.appendChild(path);

    // Точки
    xpData.forEach((d, i) => {
        const x = padding + (i / (xpData.length - 1)) * (width - 2 * padding);
        const y = height - padding - (d.amount / totalXP) * (height - 2 * padding);

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", "4");
        circle.setAttribute("fill", "#4299E1");

        circle.addEventListener("mouseover", (e) => {
            const tooltip = document.createElement("div");
            tooltip.className = "tooltip";
            tooltip.textContent = `${d.project}: ${Math.round(d.amount / 1000)}k XP`;
            tooltip.style.left = `${e.pageX + 10}px`;
            tooltip.style.top = `${e.pageY - 20}px`;
            document.body.appendChild(tooltip);
        });

        circle.addEventListener("mouseout", () => {
            const tooltip = document.querySelector(".tooltip");
            if (tooltip) tooltip.remove();
        });

        svg.appendChild(circle);
    });

    chartContent.appendChild(svg);
}

export function createAuditGraph(container, userData) {
    if (!container) return;
    container.innerHTML = `
        <div class="chart-info-container">
            <h3>XP by Project Path</h3>
            <div class="chart-content"></div>
        </div>
    `;

    const chartContent = container.querySelector('.chart-content');
    const width = 800;
    const height = 300;
    const padding = 40;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");

    // Группируем XP по путям
    const xpByPath = userData.transactions.reduce((acc, t) => {
        const path = t.path.split('/')[1] || 'Other';
        acc[path] = (acc[path] || 0) + t.amount;
        return acc;
    }, {});

    const data = Object.entries(xpByPath)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const maxXP = Math.max(...data.map(([_, xp]) => xp));
    const barWidth = (width - 2 * padding) / data.length - 10;

    data.forEach(([path, xp], i) => {
        const barHeight = (xp / maxXP) * (height - 2 * padding);
        const x = padding + i * (barWidth + 10);
        const y = height - padding - barHeight;

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", barWidth);
        rect.setAttribute("height", barHeight);
        rect.setAttribute("fill", "#4299E1");

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x + barWidth / 2);
        text.setAttribute("y", height - padding + 20);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "#2D3748");
        text.textContent = path;

        svg.appendChild(rect);
        svg.appendChild(text);
    });

    chartContent.appendChild(svg);
}

export function createTimeProgressGraph(container, userData) {
    container.innerHTML = '<h3>Best skills</h3>';

    const height = 200;
    const width = container.clientWidth - 40;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);

    const xpOverTime = userData.transactions
        .filter(t => t.type === 'xp')
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .reduce((acc, t) => {
            const date = new Date(t.createdAt).toLocaleDateString();
            const lastValue = acc.length > 0 ? acc[acc.length - 1].total : 0;
            acc.push({
                date: date,
                amount: t.amount,
                total: lastValue + t.amount
            });
            return acc;
        }, []);

    const maxXP = xpOverTime[xpOverTime.length - 1].total;
    const barWidth = 5;
    const spacing = 2;

    xpOverTime.forEach((point, index) => {
        const barLength = (point.total / maxXP) * width;
        const y = index * (barWidth + spacing);

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", 0);
        rect.setAttribute("y", y);
        rect.setAttribute("width", barLength);
        rect.setAttribute("height", barWidth);
        rect.setAttribute("fill", "#4299e1");
        svg.appendChild(rect);
    });

    container.appendChild(svg);

    const legend = document.createElement("div");
    legend.className = "chart-legend";
    legend.appendChild(createLegendItem("#4299e1", `Total XP: ${Math.round(maxXP / 1000)}k`));

    container.appendChild(legend);
}
