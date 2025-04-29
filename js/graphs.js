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
    const width = 800;
    const height = 400;
    const padding = 40;
    const leftPadding = 100;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    const xpTransactions = userData.transactions
        .filter(t => t.type === 'xp' && !t.path.includes('piscine'))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    if (xpTransactions.length === 0) {
        chartContent.innerHTML = '<p>No XP data available</p>';
        return;
    }

    let totalXP = 0;
    const xpData = xpTransactions.map(t => {
        totalXP += t.amount;
        return {
            date: new Date(t.createdAt),
            amount: totalXP,
            project: t.path.split('/').pop()
        };
    });

    const minTime = xpData[0].date;
    const maxTime = new Date(Math.max(...xpData.map(d => d.date.getTime())));
    maxTime.setDate(maxTime.getDate() + 5);

    const maxYValue = Math.ceil(totalXP / 100000) * 100000;

    const xScale = date => 
        leftPadding + ((date - minTime) / (maxTime - minTime)) * (width - leftPadding - padding);
    
    const yScale = amount =>
        height - padding - (amount / maxYValue) * (height - 2 * padding);

    drawTicksAndLabels();

    let points = [];
    xpData.forEach((d, i) => {
        const x = xScale(d.date);
        const y = yScale(d.amount);
        points.push(`${x},${y}`);

        if (i + 1 < xpData.length) {
            points.push(`${xScale(xpData[i + 1].date)},${y}`);
        } else {
            points.push(`${xScale(maxTime)},${y}`);
        }
    });

    const pathData = "M " + points.join(" L ");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("stroke", "#4299E1");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    svg.appendChild(path);

    xpData.forEach(d => {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", xScale(d.date));
        circle.setAttribute("cy", yScale(d.amount));
        circle.setAttribute("r", "4");
        circle.setAttribute("fill", "#4299E1");

        circle.addEventListener("mouseover", e => {
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

    function drawTicksAndLabels() {
        const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
        xAxis.setAttribute("x1", leftPadding);
        xAxis.setAttribute("y1", height - padding);
        xAxis.setAttribute("x2", width - padding);
        xAxis.setAttribute("y2", height - padding);
        xAxis.setAttribute("stroke", "#718096");
        svg.appendChild(xAxis);

        const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
        yAxis.setAttribute("x1", leftPadding);
        yAxis.setAttribute("y1", height - padding);
        yAxis.setAttribute("x2", leftPadding);
        yAxis.setAttribute("y2", padding);
        yAxis.setAttribute("stroke", "#718096");
        svg.appendChild(yAxis);

        const ySteps = 5;
        for (let i = 0; i <= ySteps; i++) {
            const value = (maxYValue / ySteps) * i;
            const y = yScale(value);

            const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            gridLine.setAttribute("x1", leftPadding);
            gridLine.setAttribute("x2", width - padding);
            gridLine.setAttribute("y1", y);
            gridLine.setAttribute("y2", y);
            gridLine.setAttribute("stroke", "#E2E8F0");
            gridLine.setAttribute("stroke-dasharray", "2,2");
            svg.appendChild(gridLine);

            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("x", leftPadding - 10);
            label.setAttribute("y", y + 4);
            label.setAttribute("text-anchor", "end");
            label.setAttribute("fill", "#718096");
            label.setAttribute("font-size", "12px");
            label.textContent = `${Math.round(value / 1000)}k`;
            svg.appendChild(label);
        }

        const numDateLabels = 6;
        for (let i = 0; i <= numDateLabels; i++) {
            const progress = i / numDateLabels;
            const date = new Date(minTime.getTime() + (maxTime.getTime() - minTime.getTime()) * progress);
            const x = xScale(date);
            
            const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
            tick.setAttribute("x1", x);
            tick.setAttribute("y1", height - padding);
            tick.setAttribute("x2", x);
            tick.setAttribute("y2", height - padding + 5);
            tick.setAttribute("stroke", "#718096");
            svg.appendChild(tick);

            const dateLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
            dateLabel.setAttribute("x", x);
            dateLabel.setAttribute("y", height - padding + 20);
            dateLabel.setAttribute("text-anchor", "middle");
            dateLabel.setAttribute("fill", "#718096");
            dateLabel.setAttribute("font-size", "12px");
            
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            dateLabel.textContent = `${day}/${month}/${year}`;
            
            svg.appendChild(dateLabel);
        }
    }

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

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", svgWidth);
    svg.setAttribute("height", svgHeight);
    svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    const chartHeight = svgHeight - padding - bottomPadding;

    const skills = userData.skills.map(skill => ({
        name: skill.name,
        amount: skill.amount
    }));

    const barWidth = Math.min(
        ((svgWidth - padding - leftPadding) / skills.length) * 0.8,
        50
    );
    const barGap = ((svgWidth - padding - leftPadding) / skills.length) * 0.2;

    const yScale = amount => chartHeight - (amount / 100) * chartHeight + padding;

    for (let i = 0; i <= 5; i++) {
        const y = padding + (i * (chartHeight) / 5);
        const value = 100 - (i * 20);

        const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        gridLine.setAttribute("x1", leftPadding);
        gridLine.setAttribute("x2", svgWidth - padding);
        gridLine.setAttribute("y1", y);
        gridLine.setAttribute("y2", y);
        gridLine.setAttribute("stroke", "#E2E8F0");
        gridLine.setAttribute("stroke-dasharray", "2,2");
        svg.appendChild(gridLine);

        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", leftPadding - 10);
        label.setAttribute("y", y + 5);
        label.setAttribute("text-anchor", "end");
        label.setAttribute("fill", "#718096");
        label.setAttribute("font-size", "12px");
        label.textContent = `${value}%`;
        svg.appendChild(label);
    }

    skills.forEach((skill, i) => {
        const x = leftPadding + i * (barWidth + barGap);
        const y = yScale(skill.amount);
        const height = chartHeight - (y - padding);

        const bgBar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bgBar.setAttribute("x", x);
        bgBar.setAttribute("y", padding);
        bgBar.setAttribute("width", barWidth);
        bgBar.setAttribute("height", chartHeight);
        bgBar.setAttribute("fill", "#E2E8F0");
        svg.appendChild(bgBar);

        const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bar.setAttribute("x", x);
        bar.setAttribute("y", y);
        bar.setAttribute("width", barWidth);
        bar.setAttribute("height", height);
        bar.setAttribute("fill", "#4299E1");
        svg.appendChild(bar);

        const valueLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        valueLabel.setAttribute("x", x + barWidth / 2);
        valueLabel.setAttribute("y", y - 5);
        valueLabel.setAttribute("text-anchor", "middle");
        valueLabel.setAttribute("fill", "#718096");
        valueLabel.setAttribute("font-size", "12px");
        valueLabel.textContent = `${skill.amount}%`;
        svg.appendChild(valueLabel);

        const nameLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        nameLabel.setAttribute("x", x + barWidth / 2);
        nameLabel.setAttribute("y", svgHeight - bottomPadding + 20);
        nameLabel.setAttribute("text-anchor", "middle");
        nameLabel.setAttribute("transform", `rotate(-45 ${x + barWidth / 2} ${svgHeight - bottomPadding + 20})`);
        nameLabel.setAttribute("fill", "#718096");
        nameLabel.setAttribute("font-size", "12px");
        nameLabel.textContent = skill.name;
        svg.appendChild(nameLabel);
    });

    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxis.setAttribute("x1", leftPadding);
    xAxis.setAttribute("y1", svgHeight - bottomPadding);
    xAxis.setAttribute("x2", svgWidth - padding);
    xAxis.setAttribute("y2", svgHeight - bottomPadding);
    xAxis.setAttribute("stroke", "#718096");
    svg.appendChild(xAxis);

    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxis.setAttribute("x1", leftPadding);
    yAxis.setAttribute("y1", padding);
    yAxis.setAttribute("x2", leftPadding);
    yAxis.setAttribute("y2", svgHeight - bottomPadding);
    yAxis.setAttribute("stroke", "#718096");
    svg.appendChild(yAxis);

    container.querySelector('.chart-content').appendChild(svg);
}

