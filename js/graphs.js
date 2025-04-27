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

export function createSkillsGraph(container, userData) {
    if (!container || !userData.skills) return;
    
    container.innerHTML = `
        <div class="info-card">
            <h3>Skills Progression</h3>
            <div class="chart-content"></div>
        </div>
    `;

    const svgWidth = 800;
    const svgHeight = 400;
    const padding = 40;
    const leftPadding = 70;
    const bottomPadding = 90;
    const barWidth = ((svgWidth - padding - leftPadding) / 6) * 0.75;
    const barGap = ((svgWidth - padding - leftPadding) / 6) * 0.25;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");

    // Process skills data from userData
    const skills = userData.skills
        .filter(skill => skill.type.startsWith('skill_'))
        .map(skill => ({
            name: skill.type.replace('skill_', '').replace(/_/g, ' '),
            amount: Math.round((skill.amount / 1000) * 100), // Convert to percentage
            total: 100
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6); // Take top 6 skills

    console.log('Processed skills:', skills); // For debugging

    const chartHeight = svgHeight - (padding + bottomPadding);

    // Y-axis scale and grid
    for (let i = 0; i <= 5; i++) {
        const value = i * 20;
        const y = chartHeight - (value / 100) * chartHeight + padding;

        // Grid line
        const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        gridLine.setAttribute("x1", leftPadding);
        gridLine.setAttribute("x2", svgWidth - padding);
        gridLine.setAttribute("y1", y);
        gridLine.setAttribute("y2", y);
        gridLine.setAttribute("stroke", "#E2E8F0");
        gridLine.setAttribute("stroke-dasharray", "2,2");
        svg.appendChild(gridLine);

        // Y-axis label
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", leftPadding - 10);
        label.setAttribute("y", y + 4);
        label.setAttribute("text-anchor", "end");
        label.setAttribute("fill", "#718096");
        label.textContent = `${value}%`;
        svg.appendChild(label);
    }

    // Draw bars for actual skills data
    skills.forEach((skill, index) => {
        const x = leftPadding + index * (barWidth + barGap);
        const barHeight = (skill.amount / 100) * chartHeight;
        const y = chartHeight - barHeight + padding;

        // Background bar
        const bgBar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bgBar.setAttribute("x", x);
        bgBar.setAttribute("y", padding);
        bgBar.setAttribute("width", barWidth);
        bgBar.setAttribute("height", chartHeight);
        bgBar.setAttribute("fill", "#2D3748");
        bgBar.setAttribute("opacity", "0.1");
        svg.appendChild(bgBar);

        // Progress bar
        const progressBar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        progressBar.setAttribute("x", x);
        progressBar.setAttribute("y", y);
        progressBar.setAttribute("width", barWidth);
        progressBar.setAttribute("height", barHeight);
        progressBar.setAttribute("fill", "#4299E1");
        svg.appendChild(progressBar);

        // Value label
        const valueLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        valueLabel.setAttribute("x", x + barWidth / 2);
        valueLabel.setAttribute("y", y - 5);
        valueLabel.setAttribute("text-anchor", "middle");
        valueLabel.setAttribute("fill", "#2D3748");
        valueLabel.textContent = `${skill.amount}%`;
        svg.appendChild(valueLabel);

        // Skill name
        const nameLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        nameLabel.setAttribute("x", x + barWidth / 2);
        nameLabel.setAttribute("y", svgHeight - bottomPadding + 20);
        nameLabel.setAttribute("text-anchor", "middle");
        nameLabel.setAttribute("transform", `rotate(-45 ${x + barWidth / 2} ${svgHeight - bottomPadding + 20})`);
        nameLabel.setAttribute("fill", "#2D3748");
        nameLabel.textContent = skill.name;
        svg.appendChild(nameLabel);
    });

    // Add axis lines
    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxis.setAttribute("x1", leftPadding);
    xAxis.setAttribute("y1", chartHeight + padding);
    xAxis.setAttribute("x2", svgWidth - padding);
    xAxis.setAttribute("y2", chartHeight + padding);
    xAxis.setAttribute("stroke", "#718096");
    svg.appendChild(xAxis);

    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxis.setAttribute("x1", leftPadding);
    yAxis.setAttribute("y1", padding);
    yAxis.setAttribute("x2", leftPadding);
    yAxis.setAttribute("y2", chartHeight + padding);
    yAxis.setAttribute("stroke", "#718096");
    svg.appendChild(yAxis);

    container.querySelector('.chart-content').appendChild(svg);
}

