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
    container.innerHTML = '<h3>XP Progression</h3>';

    const projectStats = userData.progresses.reduce((acc, p) => {
        if (p.object?.type === 'project') {
            p.grade > 0 ? acc.passed++ : acc.failed++;
        }
        return acc;
    }, { passed: 0, failed: 0 });

    const width = 200;
    const barHeight = 30;
    const spacing = 10;
    const svgHeight = 2 * barHeight + spacing;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", svgheight);

    const total = projectStats.passed + projectStats.failed;
    const passedWidth = (projectStats.passed / total) * width;
    const failedWidth = (projectStats.failed / total) * width;

    const passedRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    passedRect.setAttribute("x", "0");
    passedRect.setAttribute("y", "0");
    passedRect.setAttribute("width", passedWidth);
    passedRect.setAttribute("height", barHeight);
    passedRect.setAttribute("fill", "#48bb78");

    const failedRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    failedRect.setAttribute("x", 0);
    failedRect.setAttribute("y", barHeight + spacing);
    failedRect.setAttribute("width", failedWidth);
    failedRect.setAttribute("height", barHeight);
    failedRect.setAttribute("fill", "#f56565");

    svg.appendChild(passedRect);
    svg.appendChild(failedRect);

    const legend = document.createElement("div");
    legend.className = "chart-legend";
    legend.appendChild(createLegendItem("#48bb78", `Passed: ${projectStats.passed}`));
    legend.appendChild(createLegendItem("#f56565", `Failed: ${projectStats.failed}`));

    container.appendChild(svg);
    container.appendChild(legend);
}

export function createAuditGraph(container, userData) {
    container.innerHTML = '<h3>XP Progression by Path</h3>';

    const xpData = userData.transactions
        .filter(t => t.type === 'xp')
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        const barHeight = 25;
        const spacing = 10;
        const width = 200;
    
        const xpByPath = xpData.reduce((acc, t) => {
            const path = t.path.split('/')[2];
            acc[path] = (acc[path] || 0) + t.amount;
            return acc;
        }, {});
    
        const totalXP = Object.values(xpByPath).reduce((a, b) => a + b, 0);
        const svgHeight = Object.keys(xpByPath).length * (barHeight + spacing);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    

    let currentX = 0;
    Object.entries(xpByPath).forEach(([path, xp]) => {
        const rectWidth = (xp / totalXP) * width;

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", 0);
        rect.setAttribute("y", currentY);
        rect.setAttribute("width", barLength);
        rect.setAttribute("height", barHeight);
        rect.setAttribute("fill", "#4299e1");

        svg.appendChild(rect);
        currentX += barHeight + spacing;
    });

    const legend = document.createElement("div");
    legend.className = "chart-legend";
    Object.entries(xpByPath).forEach(([path, xp]) => {
        legend.appendChild(createLegendItem("#4299e1", `${path}: ${Math.round(xp / 1000)}k XP`));
    });

    container.appendChild(svg);
    container.appendChild(legend);
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
