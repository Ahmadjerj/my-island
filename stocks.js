let stockData = [];
let mainChart, distChart;
let activeFilters = new Set();
let filterMode = 'include';
let excludeUncategorized = false;
let uncategorizedItems = new Set();
let dateRange = {
    start: null,
    end: null
};
let tileVariantToBaseMap = {};

const CUSTOM_RARITY_ORDER = [
    "Trees", "Flowers", "Rocks", "Farmland", "Grasslands", "Sand Pile", "Farm", "Sawmill",
    "Crystal", "Mesa", "Apple Tree", "Glowing Mushroom", "Beach", "Treehouse", "Basalt",
    "Acid Rock", "Citrus Tree", "Ice", "Magma", "Moai", "Disco", "Radioactive", "Obsidian"
];

document.addEventListener('DOMContentLoaded', async () => {
    precomputeTileVariantMap();
    try {
        const response = await fetch('output.json');
        if (!response.ok) throw new Error(`Failed to fetch output.json: ${response.statusText}`);
        const rawData = await response.json();
        stockData = parseStockData(rawData);
        if (!stockData.length) throw new Error("No valid stock messages found in data.");
        initializeApp();
    } catch (error) {
        console.error("Failed to load or parse stock data:", error);
        showError(error.message);
    }
});

function precomputeTileVariantMap() {
    tileVariantToBaseMap = {};
    for (const baseName in MASTER_TILE_DATABASE) {
        const baseData = MASTER_TILE_DATABASE[baseName];
        tileVariantToBaseMap[baseName] = baseName;
        if (baseData.variants) {
            for (const variant of baseData.variants) {
                tileVariantToBaseMap[variant.name] = baseName;
            }
        }
    }
}

function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
}

function getTileColor(tileName) {
    const baseName = tileVariantToBaseMap[tileName] || tileName;
    const colorKey = baseName.toLowerCase().replace(/ /g, ' ');
    if (TILE_COLORS[colorKey]) {
        return TILE_COLORS[colorKey];
    }
    const dbEntry = MASTER_TILE_DATABASE[baseName];
    return dbEntry ? dbEntry.color : null;
}

function parseStockData(rawData) {
    if (!rawData || !Array.isArray(rawData.messages)) return [];
    return rawData.messages.flatMap(msg => {
        const timestamp = new Date(msg.timestamp);
        let authorName = msg.author?.name || (typeof msg.author === 'string' ? msg.author : '');
        if (authorName !== 'My Island Stock') return [];
        let fields = [];
        if (msg.embeds?.[0]?.title === 'My Island Stock' && Array.isArray(msg.embeds[0].fields)) {
            fields = msg.embeds[0].fields.map(field => {
                const name = field.name.replace(/\s*\<a?:.+?:\d+>/g, '').trim();
                const quantity = parseInt(field.value.match(/Quantity: \*\*(\d+)\*\*/)?.[1] || 0, 10);
                return { name, quantity };
            }).filter(f => f.quantity > 0);
        } else if (msg.content?.startsWith('## Tiles Stock')) {
            const regex = /^x(\d+)\s@(.+)/gm;
            let match;
            while ((match = regex.exec(msg.content)) !== null) {
                fields.push({
                    name: match[2].trim(),
                    quantity: parseInt(match[1], 10)
                });
            }
        }
        return fields.length > 0 ? [{ timestamp, fields }] : [];
    }).sort((a, b) => a.timestamp - b.timestamp);
}

function initializeApp() {
    document.getElementById('stocks-loading-container').style.display = 'none';
    document.getElementById('analytics-content').style.display = 'block';
    setupControls();
    updateCharts();
}

function setupControls() {
    document.getElementById('view-rarity').onclick = () => switchChartView('rarity');
    document.getElementById('view-timeline').onclick = () => switchChartView('timeline');
    document.getElementById('view-totals').onclick = () => switchChartView('totals');
    document.getElementById('dist-chart-type').onchange = updateCharts;

    const filterToggle = document.getElementById('filter-mode-toggle');
    filterToggle.onchange = () => {
        filterMode = filterToggle.checked ? 'exclude' : 'include';
        document.getElementById('filter-mode-label').textContent = filterToggle.checked ? 'Exclude' : 'Include';
        updateCharts();
    };

    const uncategorizedToggle = document.getElementById('exclude-uncategorized-toggle');
    uncategorizedToggle.onchange = () => {
        excludeUncategorized = uncategorizedToggle.checked;
        updateCharts();
    };

    const dateRangeBtn = document.getElementById('date-range-btn');
    const dateRangePopout = document.getElementById('date-range-popout');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    dateRangeBtn.onclick = (e) => {
        e.stopPropagation();
        dateRangePopout.style.display = 'block';
    };
    document.addEventListener('click', (e) => {
        if (!dateRangePopout.contains(e.target) && e.target !== dateRangeBtn) dateRangePopout.style.display = 'none';
    });
    const applyDateRange = () => {
        dateRange.start = startDateInput.value ? new Date(startDateInput.value) : null;
        dateRange.end = endDateInput.value ? new Date(endDateInput.value) : null;
        if (dateRange.start) dateRange.start.setHours(0, 0, 0, 0);
        if (dateRange.end) dateRange.end.setHours(23, 59, 59, 999);
        dateRangeBtn.textContent = (dateRange.start || dateRange.end) ? `${dateRange.start?.toLocaleDateString() || '...'} - ${dateRange.end?.toLocaleDateString() || '...'}` : 'All Time';
        updateCharts();
        dateRangePopout.style.display = 'none';
    };
    startDateInput.onchange = endDateInput.onchange = applyDateRange;
    document.getElementById('clear-dates-btn').onclick = () => {
        startDateInput.value = '';
        endDateInput.value = '';
        applyDateRange();
    };

    document.getElementById('json-file-input').addEventListener('change', handleFileUpload);

    const exportSelect = document.getElementById('export-options');
    exportSelect.onchange = () => {
        const selectedValue = exportSelect.value;
        if (selectedValue === 'summary') exportSummaryCSV();
        if (selectedValue === 'timeline') exportTimelineCSV();
        exportSelect.value = 'none';
        updateCustomSelectDisplay(exportSelect);
    };

    initializeCustomSelects();
}

function switchChartView(view) {
    document.querySelectorAll('.chart-view-toggle button').forEach(b => b.classList.remove('active'));
    document.getElementById(`view-${view}`).classList.add('active');
    document.getElementById('dist-chart-card').style.display = (view === 'totals') ? 'none' : 'block';
    document.getElementById('stats-grid').style.display = (view === 'totals') ? 'none' : 'grid';
    updateCharts();
}

function getFilteredData() {
    let data = stockData.filter(d => (!dateRange.start || d.timestamp >= dateRange.start) && (!dateRange.end || d.timestamp <= dateRange.end));

    if (excludeUncategorized) {
        data = JSON.parse(JSON.stringify(data)).map(entry => {
            entry.fields = entry.fields.filter(field => !uncategorizedItems.has(tileVariantToBaseMap[field.name] || field.name));
            return entry;
        }).filter(entry => entry.fields.length > 0);
    }

    if (activeFilters.size > 0) {
        return JSON.parse(JSON.stringify(data)).map(entry => {
            entry.fields = entry.fields.filter(field => {
                const baseName = tileVariantToBaseMap[field.name] || field.name;
                const hasFilter = activeFilters.has(baseName);
                return filterMode === 'include' ? hasFilter : !hasFilter;
            });
            return entry;
        }).filter(entry => entry.fields.length > 0);
    }
    return data;
}

function updateCharts() {
    populateTileChips();
    const data = getFilteredData();
    const currentView = document.querySelector('.chart-view-toggle button.active').id.replace('view-', '');
    const totals = aggregateTotals(data);
    displayStats(totals, data);
    if (mainChart) mainChart.destroy();
    if (distChart) distChart.destroy();
    const chartTitle = document.getElementById('main-chart-card').querySelector('h3');
    if (currentView === 'rarity') {
        chartTitle.textContent = 'Tile Spawn Rarity';
        mainChart = createRarityChart(totals);
    }
    if (currentView === 'timeline') {
        chartTitle.textContent = 'Quantity Over Time';
        mainChart = createTimelineChart(data);
    }
    if (currentView === 'totals') {
        chartTitle.textContent = 'Total Quantities';
        mainChart = createTotalsBarChart(totals);
    }
    if (currentView !== 'totals') distChart = createDistributionChart(totals, document.getElementById('dist-chart-type').value);
}

function populateTileChips() {
    const container = document.getElementById('tile-chip-container');
    container.innerHTML = '';
    const allBaseNamesInStock = new Set(stockData.flatMap(d => d.fields.map(f => tileVariantToBaseMap[f.name] || f.name)));
    uncategorizedItems.clear();

    const categorized = new Set();
    const misc = [];

    const orderedChips = CUSTOM_RARITY_ORDER.filter(name => allBaseNamesInStock.has(name)).map(createChip);
    if (orderedChips.length > 0) {
        container.innerHTML += `<div class="chips">${orderedChips.map(c => c.outerHTML).join('')}</div>`;
        CUSTOM_RARITY_ORDER.forEach(name => categorized.add(name));
    }

    allBaseNamesInStock.forEach(name => {
        if (categorized.has(name)) return;
        getTileColor(name) ? misc.push(name) : uncategorizedItems.add(name);
    });

    if (misc.length > 0) {
        container.innerHTML += `<h5 style="width: 100%; margin: 10px 0 5px; font-weight: 600; color: var(--text-muted);">Miscellaneous</h5>`;
        const miscChips = misc.sort().map(createChip);
        container.innerHTML += `<div class="chips">${miscChips.map(c => c.outerHTML).join('')}</div>`;
    }
    if (uncategorizedItems.size > 0) {
        container.innerHTML += `<h5 style="width: 100%; margin: 10px 0 5px; font-weight: 600; color: var(--text-muted);">Uncategorized</h5>`;
        const uncategorizedChips = Array.from(uncategorizedItems).sort().map(createChip);
        container.innerHTML += `<div class="chips">${uncategorizedChips.map(c => c.outerHTML).join('')}</div>`;
    }

    container.querySelectorAll('.chip').forEach(chip => {
        chip.onclick = () => {
            const name = chip.dataset.tileName;
            activeFilters.has(name) ? activeFilters.delete(name) : activeFilters.add(name);
            updateCharts();
        };
    });
}

function createChip(name) {
    const color = getTileColor(name) || stringToColor(name);
    const chip = document.createElement('div');
    chip.className = `chip ${activeFilters.has(name) ? 'active' : ''}`;
    chip.dataset.tileName = name;
    chip.innerHTML = `<span class="dot" style="background:${color};"></span> ${name}`;
    return chip;
}

function createTimelineChart(data) {
    const ctx = document.getElementById('main-chart').getContext('2d');
    const datasets = {};
    let minDate = null, maxDate = null;
    if (activeFilters.size === 1) {
        const singleFilter = Array.from(activeFilters)[0];
        const relevantTimestamps = data.flatMap(entry => entry.fields.some(field => (tileVariantToBaseMap[field.name] || field.name) === singleFilter) ? [entry.timestamp] : []).map(ts => ts.getTime());
        if (relevantTimestamps.length > 0) {
            const firstStock = Math.min(...relevantTimestamps);
            const lastStock = Math.max(...relevantTimestamps);
            minDate = new Date(firstStock - 3600 * 1000 * 6);
            maxDate = new Date(lastStock + 3600 * 1000 * 6);
        }
    }
    data.forEach(entry => {
        entry.fields.forEach(field => {
            if (!datasets[field.name]) {
                const color = getTileColor(field.name) || stringToColor(field.name);
                datasets[field.name] = {
                    label: field.name,
                    data: [],
                    borderColor: color,
                    backgroundColor: shadeColor(color, 40),
                    tension: 0.1,
                    hidden: activeFilters.size > 0 ? !activeFilters.has(tileVariantToBaseMap[field.name]) : false
                };
            }
            datasets[field.name].data.push({ x: entry.timestamp, y: field.quantity });
        });
    });
    return new Chart(ctx, {
        type: 'line',
        data: { datasets: Object.values(datasets) },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    min: minDate,
                    max: maxDate,
                    time: {
                        tooltipFormat: 'PPpp',
                        displayFormats: { day: 'MMM d, yyyy', hour: 'HH:mm' }
                    },
                    ticks: { color: 'white' }
                },
                y: {
                    ticks: { color: 'white', precision: 0 },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: { labels: { color: 'white' } },
                tooltip: { mode: 'index', intersect: false },
                zoom: {
                    pan: { enabled: true, mode: 'x' },
                    zoom: {
                        wheel: { enabled: true },
                        pinch: { enabled: true },
                        mode: 'x'
                    }
                }
            }
        }
    });
}

function aggregateTotals(data) {
    const totals = {};
    data.forEach(e => e.fields.forEach(f => {
        totals[f.name] = (totals[f.name] || 0) + f.quantity;
    }));
    return totals;
}

function displayStats(totals, data) {
    const grid = document.getElementById('stats-grid');
    grid.innerHTML = '';
    const totalItems = Object.values(totals).reduce((sum, q) => sum + q, 0);
    const uniqueItems = Object.keys(totals).length;
    const totalRestocks = data.length;

    const createStatCard = (label, value) => `<div class="stat-card"><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>`;

    grid.innerHTML += createStatCard('Total Items Stocked', totalItems.toLocaleString());
    grid.innerHTML += createStatCard('Unique Item Types', uniqueItems.toLocaleString());
    grid.innerHTML += createStatCard('Total Restock Events', totalRestocks.toLocaleString());

    if (totalRestocks > 0) {
        grid.innerHTML += createStatCard('Avg. Items / Restock', (totalItems / totalRestocks).toFixed(2));
    } else {
        grid.innerHTML += createStatCard('Avg. Items / Restock', 'N/A');
    }

    if (uniqueItems > 0) {
        const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
        const mostCommonName = sorted[0][0];

        let mostCommonTotalQty = 0;
        let mostCommonAppearances = 0;
        data.forEach(entry => {
            entry.fields.forEach(field => {
                if (field.name === mostCommonName) {
                    mostCommonTotalQty += field.quantity;
                    mostCommonAppearances++;
                }
            });
        });
        const avgQtyMostCommon = (mostCommonTotalQty / mostCommonAppearances).toFixed(1);
        grid.innerHTML += createStatCard(`Avg. Qty (${mostCommonName})`, avgQtyMostCommon);
    } else {
        grid.innerHTML += createStatCard('Avg. Qty (Most Common)', 'N/A');
    }
}

function createRarityChart(totals) {
    const ctx = document.getElementById('main-chart').getContext('2d');
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(item => item[0]);
    const data = sorted.map(item => item[1]);
    const backgroundColors = labels.map(name => getTileColor(name) || stringToColor(name));
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Total Quantity',
                data,
                backgroundColor: backgroundColors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                x: { ticks: { color: 'white' } },
                y: { ticks: { color: 'white' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function createTotalsBarChart(totals) {
    return createRarityChart(totals);
}

function createDistributionChart(totals, type = 'doughnut') {
    const ctx = document.getElementById('distribution-chart').getContext('2d');
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(item => item[0]);
    const data = sorted.map(item => item[1]);
    const backgroundColors = labels.map(name => getTileColor(name) || stringToColor(name));
    return new Chart(ctx, {
        type: type,
        data: {
            labels,
            datasets: [{ data, backgroundColor: backgroundColors }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: 'white', boxWidth: 15 }
                }
            }
        }
    });
}

function showError(message) {
    document.getElementById('stocks-loading-container').style.display = 'none';
    const errorEl = document.getElementById('error-message');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

function exportSummaryCSV() {
    const totals = aggregateTotals(getFilteredData());
    if (Object.keys(totals).length === 0) return toast('No data to export.');
    const headers = ['Tile Name', 'Total Quantity'];
    const rows = Object.entries(totals).map(([name, quantity]) => [name, quantity]);
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });
    downloadCSV(csvContent, 'stock_summary_export.csv');
}

function exportTimelineCSV() {
    const data = getFilteredData();
    if (data.length === 0) return toast('No data to export.');
    const headers = ['timestamp', 'tile_name', 'quantity_stocked', 'restock_id', 'items_in_same_restock', 'total_items_in_restock'];
    const rows = [];
    data.forEach((entry, index) => {
        const restockId = `restock_${index + 1}`;
        const itemsInRestock = entry.fields.map(f => f.name).join('; ');
        const totalItemsInRestock = entry.fields.reduce((sum, f) => sum + f.quantity, 0);
        entry.fields.forEach(field => {
            rows.push([entry.timestamp.toISOString(), field.name, field.quantity, restockId, itemsInRestock, totalItemsInRestock]);
        });
    });
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });
    downloadCSV(csvContent, 'stock_timeline_export.csv');
}

function downloadCSV(csvContent, fileName) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const rawData = JSON.parse(e.target.result);
            stockData = parseStockData(rawData);
            if (!stockData || stockData.length === 0) throw new Error("The uploaded JSON file does not contain any valid stock messages.");
            activeFilters.clear();
            initializeApp();
            toast('Custom JSON loaded successfully!');
        } catch (error) {
            console.error("Failed to parse custom JSON file:", error);
            showError(error.message);
        }
    };
    reader.readAsText(file);
}

function shadeColor(hex, percent) {
    try {
        const num = parseInt(hex.replace('#', ''), 16);
        let r = (num >> 16) + percent, g = ((num >> 8) & 0x00FF) + percent, b = (num & 0x0000FF) + percent;
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
        return '#' + (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0');
    } catch {
        return hex;
    }
}
