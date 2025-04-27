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
        <div class="info-card">
            <h3>XP Progression</h3>
            <div class="chart-content"></div>
        </div>
    `;

    const chartContent = container.querySelector('.chart-content');
    const width = 600;
    const height = 300;
    const padding = 40;
    const leftPadding = 60; // Для меток оси Y

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "");

    // Обработка данных
    let totalXP = 0;
    const xpData = userData.transactions
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .map(t => ({
            date: new Date(t.createdAt),
            amount: totalXP += t.amount,
            project: t.path.split('/').pop()
        }));

    // Добавляем сетку
    for (let i = 0; i <= 5; i++) {
        const y = padding + (i * (height - 2 * padding) / 5);
        const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        gridLine.setAttribute("x1", leftPadding);
        gridLine.setAttribute("x2", width - padding);
        gridLine.setAttribute("y1", y);
        gridLine.setAttribute("y2", y);
        gridLine.setAttribute("stroke", "#2D3748");
        gridLine.setAttribute("stroke-dasharray", "2,2");
        svg.appendChild(gridLine);

        // Метки оси Y
        const yLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        const yValue = Math.round((1 - i/5) * totalXP / 1000);
        yLabel.setAttribute("x", leftPadding - 10);
        yLabel.setAttribute("y", y + 5);
        yLabel.setAttribute("text-anchor", "end");
        yLabel.setAttribute("fill", "#2D3748");
        yLabel.textContent = `${yValue}k`;
        svg.appendChild(yLabel);
    }

    // Оси
    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxis.setAttribute("x1", leftPadding);
    xAxis.setAttribute("y1", height - padding);
    xAxis.setAttribute("x2", width - padding);
    xAxis.setAttribute("y2", height - padding);
    xAxis.setAttribute("stroke", "#718096");
    svg.appendChild(xAxis);

    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxis.setAttribute("x1", leftPadding);
    yAxis.setAttribute("y1", padding);
    yAxis.setAttribute("x2", leftPadding);
    yAxis.setAttribute("y2", height - padding);
    yAxis.setAttribute("stroke", "#718096");
    svg.appendChild(yAxis);

    // График
    const pathData = `M ${leftPadding} ${height - padding} ` + 
        xpData.map((d, i) => {
            const x = leftPadding + (i / (xpData.length - 1)) * (width - leftPadding - padding);
            const y = height - padding - (d.amount / totalXP) * (height - 2 * padding);
            return `L ${x} ${y}`;
        }).join(' ');

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("stroke", "#4299E1");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    svg.appendChild(path);

    // Точки и метки времени
    xpData.forEach((d, i) => {
        const x = leftPadding + (i / (xpData.length - 1)) * (width - leftPadding - padding);
        const y = height - padding - (d.amount / totalXP) * (height - 2 * padding);

        // Точка
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", "4");
        circle.setAttribute("fill", "#4299E1");

        // Тултип
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

        // Метка времени (для каждой 5-й точки)
        if (i % 5 === 0 || i === xpData.length - 1) {
            const dateLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
            dateLabel.setAttribute("x", x);
            dateLabel.setAttribute("y", height - padding + 20);
            dateLabel.setAttribute("text-anchor", "middle");
            dateLabel.setAttribute("fill", "#2D3748");
            dateLabel.textContent = d.date.toLocaleDateString();
            svg.appendChild(dateLabel);
        }

        svg.appendChild(circle);
    });

    chartContent.appendChild(svg);
}

export function createAuditGraph(container, userData) {
    if (!container) return;
    container.innerHTML = `
        <div class="info-card">
            <h3>Technical Skills</h3>
            <div class="chart-content"></div>
        </div>
    `;

    const width = 800;
    const height = 400;
    const padding = 40;
    const leftPadding = 200;
    const bottomPadding = 60;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");

    // Получаем данные о навыках
    const skills = userData.skills
        .map(skill => ({
            name: skill.type.replace('skill_', '').replace(/_/g, ' '),
            amount: Math.round((skill.amount / 1000) * 100), // Конвертируем в проценты
            total: 100
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6);

    console.log('Skills data:', skills); // Для отладки

    const barHeight = 40;
    const barGap = 20;

    // Рисуем навыки
    skills.forEach((skill, i) => {
        const y = padding + i * (barHeight + barGap);

        // Фоновая полоса (100%)
        const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bgRect.setAttribute("x", leftPadding);
        bgRect.setAttribute("y", y);
        bgRect.setAttribute("width", width - leftPadding - padding);
        bgRect.setAttribute("height", barHeight);
        bgRect.setAttribute("fill", "#2D3748");
        bgRect.setAttribute("opacity", "0.1");
        svg.appendChild(bgRect);

        // Полоса прогресса
        const progressWidth = (skill.amount / skill.total) * (width - leftPadding - padding);
        const progressRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        progressRect.setAttribute("x", leftPadding);
        progressRect.setAttribute("y", y);
        progressRect.setAttribute("width", progressWidth);
        progressRect.setAttribute("height", barHeight);
        progressRect.setAttribute("fill", "#4299E1");
        svg.appendChild(progressRect);

        // Название навыка
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", leftPadding - 10);
        text.setAttribute("y", y + barHeight / 2 + 5);
        text.setAttribute("text-anchor", "end");
        text.setAttribute("fill", "#2D3748");
        text.setAttribute("font-weight", "bold");
        text.textContent = skill.name;
        svg.appendChild(text);

        // Процент
        const percentText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        percentText.setAttribute("x", leftPadding + progressWidth + 10);
        percentText.setAttribute("y", y + barHeight / 2 + 5);
        percentText.setAttribute("fill", "#2D3748");
        percentText.textContent = `${skill.amount}%`;
        svg.appendChild(percentText);
    });

    container.querySelector('.chart-content').appendChild(svg);
}

// export function createTimeProgressGraph(container, userData) {
//     container.innerHTML = '<h3>Best skills</h3>';

//     const height = 200;
//     const width = container.clientWidth - 40;
//     const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
//     svg.setAttribute("width", width);
//     svg.setAttribute("height", height);

//     const xpOverTime = userData.transactions
//         .filter(t => t.type === 'xp')
//         .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
//         .reduce((acc, t) => {
//             const date = new Date(t.createdAt).toLocaleDateString();
//             const lastValue = acc.length > 0 ? acc[acc.length - 1].total : 0;
//             acc.push({
//                 date: date,
//                 amount: t.amount,
//                 total: lastValue + t.amount
//             });
//             return acc;
//         }, []);

//     const maxXP = xpOverTime[xpOverTime.length - 1].total;
//     const barWidth = 5;
//     const spacing = 2;

//     xpOverTime.forEach((point, index) => {
//         const barLength = (point.total / maxXP) * width;
//         const y = index * (barWidth + spacing);

//         const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
//         rect.setAttribute("x", 0);
//         rect.setAttribute("y", y);
//         rect.setAttribute("width", barLength);
//         rect.setAttribute("height", barWidth);
//         rect.setAttribute("fill", "#4299e1");
//         svg.appendChild(rect);
//     });

//     container.appendChild(svg);

//     const legend = document.createElement("div");
//     legend.className = "chart-legend";
//     legend.appendChild(createLegendItem("#4299e1", `Total XP: ${Math.round(maxXP / 1000)}k`));

//     container.appendChild(legend);
// }
