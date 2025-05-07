// Constants for graph dimensions and styling
const GRAPH_CONSTANTS = {
    svgWidth: 800,
    svgHeight: 400,
    padding: 40,
    leftPadding: 70,
    bottomPadding: 90,
    colors: {
        grid: '#2d3748',
        axis: '#718096',
        bar: '#4299E1',
        barBg: '#E2E8F0'
    }
};

// Helper function to create SVG elements with attributes
function createSVGElement(type, attributes = {}) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", type);
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    return element;
}

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

// Add touch event support
function addTouchSupport(element, tooltipContent) {
    element.addEventListener('touchstart', e => {
        e.preventDefault();
        const touch = e.touches[0];
        showTooltip(touch.pageX, touch.pageY, tooltipContent);
    });

    element.addEventListener('touchend', () => {
        hideTooltip();
    });
}

// Update tooltip positioning for mobile
function showTooltip(x, y, content) {
    const tooltip = document.createElement("div");
    tooltip.classList.add("tooltip");
    tooltip.textContent = content;

    // Adjust position for mobile viewport
    const viewportWidth = window.innerWidth;
    const tooltipWidth = 200; // Approximate width

    // Keep tooltip within viewport bounds
    let leftPos = x - tooltipWidth / 2;
    leftPos = Math.max(10, Math.min(leftPos, viewportWidth - tooltipWidth - 10));

    tooltip.style.left = `${leftPos}px`;
    tooltip.style.top = `${y - 40}px`; // Position above finger

    document.body.appendChild(tooltip);
}

function hideTooltip() {
    document.querySelectorAll(".tooltip").forEach(t => t.remove());
}

// Update createProjectGraph
export function createProjectGraph(container, userData) {
    // Clear container first
    container.innerHTML = '';
    
    // Create container with title
    const chartInfoContainer = document.createElement('div');
    chartInfoContainer.classList.add('chart-info-container', 'key-value-title');
    
    const title = document.createElement('h3');
    title.textContent = 'XP progression';
    chartInfoContainer.appendChild(title);

    // SVG setup
    const svgWidth = 800;
    const svgHeight = 400;
    const padding = 40;
    const leftPadding = 100;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.classList.add('chart');

    // Make SVG responsive
    svg.style.width = "100%";
    svg.style.height = "auto";

    // Process XP data
    const xpData = userData.xp || [];
    let cumulativeXP = 0;
    
    // Create points array with initial point
    const points = [{
        date: new Date(xpData[0]?.createdAt || Date.now()),
        xp: 0,
        name: 'Start'
    }];

    // Sort transactions by date and calculate cumulative XP
    const sortedTransactions = [...xpData].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    sortedTransactions.forEach(tx => {
        if (!tx.amount || typeof tx.amount !== 'number') return;
        
        cumulativeXP += tx.amount;
        points.push({
            date: new Date(tx.createdAt),
            xp: cumulativeXP,
            name: tx.path ? tx.path.split('/').pop() : 'XP gain'
        });
    });

    // Scale functions
    const minDate = points[0].date;
    const maxDate = points[points.length - 1].date;
    const maxXP = Math.max(...points.map(p => p.xp));

    const xScale = date => 
        leftPadding + (date - minDate) / (maxDate - minDate) * (svgWidth - leftPadding - padding);
    
    const yScale = xp =>
        svgHeight - padding - (xp / maxXP) * (svgHeight - 2 * padding);

    // Draw grid and labels first
    drawGridAndLabels();

    // Draw XP line
    const pathData = points.map((p, i) => {
        const x = xScale(p.date);
        const y = yScale(p.xp);
        return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }).join(' ');

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.classList.add("chart-line");
    svg.appendChild(path);

    // Add data points with tooltips
    points.forEach(point => {
        const circle = createSVGElement("circle", {
            cx: xScale(point.date),
            cy: yScale(point.xp),
            r: window.matchMedia('(hover: none)').matches ? "6" : "4",
            class: "data-point"
        });

        const tooltipContent = `${point.name}: ${Math.round(point.xp/1000)}k XP`;
        
        // Mouse events
        circle.addEventListener("mouseover", e => {
            showTooltip(e.pageX, e.pageY, tooltipContent);
        });

        circle.addEventListener("mouseout", hideTooltip);

        // Touch events
        addTouchSupport(circle, tooltipContent);

        svg.appendChild(circle);
    });

    function drawGridAndLabels() {
        // Add axes
        const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
        xAxis.setAttribute("x1", leftPadding);
        xAxis.setAttribute("x2", svgWidth - padding);
        xAxis.setAttribute("y1", svgHeight - padding);
        xAxis.setAttribute("y2", svgHeight - padding);
        xAxis.classList.add("axis-line");
        svg.appendChild(xAxis);

        const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
        yAxis.setAttribute("x1", leftPadding);
        yAxis.setAttribute("x2", leftPadding);
        yAxis.setAttribute("y1", svgHeight - padding);
        yAxis.setAttribute("y2", padding);
        yAxis.classList.add("axis-line");
        svg.appendChild(yAxis);

        // Y-axis label
        const yLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        yLabel.setAttribute("x", "15");
        yLabel.setAttribute("y", svgHeight / 2);
        yLabel.setAttribute("text-anchor", "middle");
        yLabel.setAttribute("transform", `rotate(-90 15 ${svgHeight / 2})`);
        svg.appendChild(yLabel);

        // Add grid lines and labels
        const ySteps = 5;
        for (let i = 0; i <= ySteps; i++) {
            const y = padding + (i * (svgHeight - 2 * padding) / ySteps);
            const value = Math.round((maxXP * (ySteps - i) / ySteps) / 1000);

            // Grid line
            const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            gridLine.setAttribute("x1", leftPadding);
            gridLine.setAttribute("x2", svgWidth - padding);
            gridLine.setAttribute("y1", y);
            gridLine.setAttribute("y2", y);
            gridLine.classList.add("grid-line");
            svg.appendChild(gridLine);

            // Y-axis tick
            const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
            tick.setAttribute("x1", leftPadding - 5);
            tick.setAttribute("x2", leftPadding);
            tick.setAttribute("y1", y);
            tick.setAttribute("y2", y);
            tick.classList.add("axis-tick");
            svg.appendChild(tick);

            // Y-axis label
            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("x", leftPadding - 10);
            label.setAttribute("y", y + 4);
            label.setAttribute("text-anchor", "end");
            label.classList.add("tick-label");
            label.textContent = `${value}k`;
            svg.appendChild(label);
        }

        // X-axis ticks and labels
        const xSteps = Math.min(points.length - 1, 5);
        for (let i = 0; i <= xSteps; i++) {
            const date = new Date(minDate.getTime() + (maxDate.getTime() - minDate.getTime()) * (i / xSteps));
            const x = xScale(date);

            const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
            tick.setAttribute("x1", x);
            tick.setAttribute("x2", x);
            tick.setAttribute("y1", svgHeight - padding);
            tick.setAttribute("y2", svgHeight - padding + 5);
            tick.classList.add("axis-tick");
            svg.appendChild(tick);

            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("x", x);
            label.setAttribute("y", svgHeight - padding + 27);
            label.setAttribute("text-anchor", "middle");
            label.classList.add("tick-label");
            label.textContent = date.toLocaleDateString("fi-FI");
            svg.appendChild(label);
        }
    }

    chartInfoContainer.appendChild(svg);
    container.appendChild(chartInfoContainer);
}

// Update createSkillsGraph
export function createSkillsGraph(container, userData) {
    if (!container || !userData.skills) return;

    container.innerHTML = `
        <div class="info-card">
            <h3>Skills progression</h3>
            <div class="chart-content"></div>
        </div>
    `;

    const svgWidth = 800;
    const svgHeight = 400;
    const padding = 40;
    const leftPadding = 70;
    const bottomPadding = 90;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.classList.add('chart');

    // Make SVG responsive
    svg.style.width = "100%";
    svg.style.height = "auto";

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
        nameLabel.setAttribute("y", svgHeight - bottomPadding + 30);
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

