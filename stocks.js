let stockData = [];
let mainChart, distChart;
let activeFilters = new Set();
let filterMode = 'include';
let dateRange = { start: null, end: null };
let tileVariantToBaseMap = {};

//So you can see them in rarity and not in alphabitcal order
const CUSTOM_RARITY_ORDER = [
    "Trees",
    "Flowers",
    "Rocks",
    "Farmland",
    "Sand Pile",
    "Farm",
    "Sawmill",
    "Grasslands",
    "Crystal",
    "Beach",
    "Apple Tree",
    "Glowing Mushroom",
    "Basalt",
    "Acid Rock",
    "Ice",
    "Citrus Tree",
    "Magma",
    "Moai",
    "Disco",
    "Radioactive"
];

// Helper function to format date for input fields
function formatDateForInput(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// UPDATED: Pre-computes a map from a specific tile variant name to its base tile NAME (string).
function precomputeTileVariantMap() {
    tileVariantToBaseMap = {};
    for (const baseName in MASTER_TILE_DATABASE) {
        const baseData = MASTER_TILE_DATABASE[baseName];
        // Also map the base name itself, in case it appears in stock data
        tileVariantToBaseMap[baseName] = baseName;
        if (baseData.variants) {
            for (const variant of baseData.variants) {
                tileVariantToBaseMap[variant.name] = baseName;
            }
        }
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    precomputeTileVariantMap(); // Pre-process rarity data
    try {
        const response = await fetch('output.json');

        if (!response.ok) {
            throw new Error(`Failed to fetch output.json. Server responded with status: ${response.status} ${response.statusText}`);
        }

        const rawData = await response.json();
        console.log("Successfully fetched and parsed output.json. Raw data:", rawData);

        stockData = parseStockData(rawData);
        console.log(`Found and parsed ${stockData.length} valid stock messages.`);

        if (!stockData || stockData.length === 0) {
            throw new Error("Found 'output.json', but it contains no valid stock messages. Please check the file content and format.");
        }

        initializeApp();
    } catch (error) {
        console.error("Failed to load or parse stock data:", error);
        showError(error.message);
    }
});

// UPDATED: This function now works with the modified tileVariantToBaseMap
function getTileColor(tileName) {
    const baseName = tileVariantToBaseMap[tileName];
    if (baseName && MASTER_TILE_DATABASE[baseName]) {
        return MASTER_TILE_DATABASE[baseName].color;
    }
    // Fallback for names not found in the map (should be rare)
    if (MASTER_TILE_DATABASE[tileName]) {
        return MASTER_TILE_DATABASE[tileName].color;
    }
    return TILE_COLORS.default;
}

function parseStockData(rawData) {
    if (!rawData || !Array.isArray(rawData.messages)) return [];

    const stockMessages = rawData.messages.flatMap(msg => {
        const timestamp = new Date(msg.timestamp);

        let authorName = '';
        if (msg.author) {
            if (typeof msg.author === 'string') {
                authorName = msg.author;
            } else if (typeof msg.author === 'object' && msg.author.name) {
                authorName = msg.author.name;
            }
        }

        if (authorName === 'My Island Stock' && msg.embeds && msg.embeds.length > 0 && msg.embeds[0].title === 'My Island Stock' && Array.isArray(msg.embeds[0].fields)) {
            const embed = msg.embeds[0];
            const fields = embed.fields.map(field => {
                const name = field.name.replace(/\s*\<a?:.+?:\d+>/g, '').trim();
                const quantityMatch = field.value.match(/Quantity: \*\*(\d+)\*\*/);
                const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 0;
                return { name, quantity };
            }).filter(f => f.quantity > 0);

            if (fields.length > 0) {
                return [{ timestamp, fields }];
            }
        }

        if (authorName === 'My Island Stock' && msg.content && msg.content.startsWith('## Tiles Stock')) {
            const lines = msg.content.split('\n');
            const fields = [];
            const regex = /^x(\d+)\s@(.+)/;

            for (const line of lines) {
                const match = line.match(regex);
                if (match) {
                    const quantity = parseInt(match[1], 10);
                    const name = match[2].trim();
                    if (quantity > 0 && name) {
                        fields.push({ name, quantity });
                    }
                }
            }

            if (fields.length > 0) {
                return [{ timestamp, fields }];
            }
        }

        return [];
    });

    return stockMessages.sort((a, b) => a.timestamp - b.timestamp);
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

    document.getElementById('dist-chart-type').onchange = () => {
        if (distChart) {
            distChart.destroy();
            distChart = createDistributionChart(distChart.config.data, document.getElementById('dist-chart-type').value);
        }
    };

    const filterToggle = document.getElementById('filter-mode-toggle');
    filterToggle.onchange = () => {
        filterMode = filterToggle.checked ? 'exclude' : 'include';
        document.getElementById('filter-mode-label').textContent = filterToggle.checked ? 'Exclude' : 'Include';
        updateCharts();
    };

    const dateRangeBtn = document.getElementById('date-range-btn');
    const dateRangePopout = document.getElementById('date-range-popout');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const clearDatesBtn = document.getElementById('clear-dates-btn');

    if (stockData.length > 0) {
        const minDate = stockData[0].timestamp;
        const maxDate = stockData[stockData.length - 1].timestamp;
        const minDateStr = formatDateForInput(minDate);
        const maxDateStr = formatDateForInput(maxDate);

        startDateInput.min = minDateStr;
        startDateInput.max = maxDateStr;
        endDateInput.min = minDateStr;
        endDateInput.max = maxDateStr;
    }

    dateRangeBtn.onclick = (e) => {
        e.stopPropagation();
        dateRangePopout.style.display = dateRangePopout.style.display === 'none' ? 'block' : 'none';
    };
    document.addEventListener('click', (e) => {
        if (!dateRangePopout.contains(e.target) && e.target !== dateRangeBtn) {
            dateRangePopout.style.display = 'none';
        }
    });

    const applyDateRange = () => {
        dateRange.start = startDateInput.value ? new Date(startDateInput.value) : null;
        dateRange.end = endDateInput.value ? new Date(endDateInput.value) : null;
        if (dateRange.start) dateRange.start.setHours(0, 0, 0, 0);
        if (dateRange.end) dateRange.end.setHours(23, 59, 59, 999);

        if (dateRange.start && dateRange.end) {
            dateRangeBtn.textContent = `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`;
        } else if (dateRange.start) {
            dateRangeBtn.textContent = `From ${dateRange.start.toLocaleDateString()}`;
        } else if (dateRange.end) {
            dateRangeBtn.textContent = `Until ${dateRange.end.toLocaleDateString()}`;
        } else {
            dateRangeBtn.textContent = 'All Time';
        }

        updateCharts();
        dateRangePopout.style.display = 'none';
    };

    startDateInput.onchange = applyDateRange;
    endDateInput.onchange = applyDateRange;

    clearDatesBtn.onclick = () => {
        startDateInput.value = '';
        endDateInput.value = '';
        applyDateRange();
    };

    document.getElementById('json-file-input').addEventListener('change', handleFileUpload);
}

function switchChartView(view) {
    document.querySelectorAll('.chart-view-toggle button').forEach(b => b.classList.remove('active'));
    document.getElementById(`view-${view}`).classList.add('active');

    const mainCard = document.getElementById('main-chart-card');
    const distCard = document.getElementById('dist-chart-card');
    const statsGrid = document.getElementById('stats-grid');

    mainCard.style.display = 'block';
    distCard.style.display = 'block';
    statsGrid.style.display = 'grid';

    if (view === 'totals') {
        distCard.style.display = 'none';
        statsGrid.style.display = 'none';
    }

    updateCharts();
}

function getFilteredData() {
    let data = stockData.slice();

    if (dateRange.start) data = data.filter(d => d.timestamp >= dateRange.start);
    if (dateRange.end) data = data.filter(d => d.timestamp <= dateRange.end);
    data = JSON.parse(JSON.stringify(data));

    if (activeFilters.size > 0) {
        data.forEach(entry => {
            entry.fields = entry.fields.filter(field => {
                const hasFilter = activeFilters.has(field.name);
                return filterMode === 'include' ? hasFilter : !hasFilter;
            });
        });
    }

    return data;
}

function updateCharts() {
    const data = getFilteredData();
    const currentView = document.querySelector('.chart-view-toggle button.active').id.replace('view-', '');

    populateTileChips();
    const totals = aggregateTotals(data);
    displayStats(totals);

    if (mainChart) mainChart.destroy();
    if (distChart) distChart.destroy();

    if (currentView === 'rarity') {
        document.getElementById('main-chart-card').querySelector('h3').textContent = 'Tile Spawn Rarity';
        mainChart = createRarityChart(totals);
    } else if (currentView === 'timeline') {
        document.getElementById('main-chart-card').querySelector('h3').textContent = 'Quantity Over Time';
        mainChart = createTimelineChart(data);
    } else if (currentView === 'totals') {
        document.getElementById('main-chart-card').querySelector('h3').textContent = 'Total Quantities';
        mainChart = createTotalsBarChart(totals);
    }

    distChart = createDistributionChart(totals, document.getElementById('dist-chart-type').value);
}

function populateTileChips() {
    const container = document.getElementById('tile-chip-container');
    const allTileNames = new Set(stockData.flatMap(d => d.fields.map(f => f.name)));

    // UPDATED: Sort tile names based on the custom order.
    const sortedNames = Array.from(allTileNames).sort((a, b) => {
        const baseNameA = tileVariantToBaseMap[a];
        const baseNameB = tileVariantToBaseMap[b];

        const indexA = CUSTOM_RARITY_ORDER.indexOf(baseNameA);
        const indexB = CUSTOM_RARITY_ORDER.indexOf(baseNameB);

        // Treat items not in the list as having a very high index so they go to the end
        const sortOrderA = indexA === -1 ? Infinity : indexA;
        const sortOrderB = indexB === -1 ? Infinity : indexB;

        if (sortOrderA !== sortOrderB) {
            return sortOrderA - sortOrderB;
        }

        // If they have the same base type (e.g., Small Tree vs Large Tree) or are both not in the list,
        // sort them alphabetically by their specific variant name.
        return a.localeCompare(b);
    });

    container.innerHTML = '';
    sortedNames.forEach(name => {
        const color = getTileColor(name);
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.dataset.tileName = name;
        chip.innerHTML = `<span class="dot" style="background:${color};"></span> ${name}`;
        chip.onclick = () => {
            if (activeFilters.has(name)) {
                activeFilters.delete(name);
            } else {
                activeFilters.add(name);
            }
            updateCharts();
        };
        if (activeFilters.has(name)) {
            chip.classList.add('active');
        }
        container.appendChild(chip);
    });
}

function aggregateTotals(data) {
    const totals = {};
    data.forEach(entry => {
        entry.fields.forEach(field => {
            totals[field.name] = (totals[field.name] || 0) + field.quantity;
        });
    });
    return totals;
}

function displayStats(totals) {
    const grid = document.getElementById('stats-grid');
    grid.innerHTML = '';
    const totalItems = Object.values(totals).reduce((sum, q) => sum + q, 0);
    const uniqueItems = Object.keys(totals).length;

    const createStatCard = (label, value) => `
        <div class="stat-card">
            <div class="stat-value">${value.toLocaleString()}</div>
            <div class="stat-label">${label}</div>
        </div>`;

    grid.innerHTML += createStatCard('Total Items Stocked', totalItems);
    grid.innerHTML += createStatCard('Unique Item Types', uniqueItems);

    if (uniqueItems > 0) {
        const sorted = Object.entries(totals).sort((a,b) => b[1] - a[1]);
        grid.innerHTML += createStatCard('Most Common', `${sorted[0][0]} (${sorted[0][1].toLocaleString()})`);
        grid.innerHTML += createStatCard('Least Common', `${sorted[sorted.length-1][0]} (${sorted[sorted.length-1][1].toLocaleString()})`);
    }
}

function createRarityChart(totals) {
    const ctx = document.getElementById('main-chart').getContext('2d');
    const sorted = Object.entries(totals).sort((a,b) => b[1] - a[1]);
    const labels = sorted.map(item => item[0]);
    const data = sorted.map(item => item[1]);
    const backgroundColors = labels.map(name => getTileColor(name));

    return new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Total Quantity', data, backgroundColor: backgroundColors }] },
        options: {
            responsive: true, maintainAspectRatio: false, indexAxis: 'y',
            scales: { x: { ticks: { color: 'white' } }, y: { ticks: { color: 'white' } } },
            plugins: { legend: { display: false } }
        }
    });
}

function createTimelineChart(data) {
    const ctx = document.getElementById('main-chart').getContext('2d');
    const datasets = {};

    data.forEach(entry => {
        entry.fields.forEach(field => {
            if (!datasets[field.name]) {
                const color = getTileColor(field.name);
                datasets[field.name] = {
                    label: field.name,
                    data: [],
                    borderColor: color,
                    backgroundColor: shadeColor(color, 40),
                    tension: 0.1,
                    hidden: activeFilters.size > 0 ? !activeFilters.has(field.name) : false
                };
            }
            datasets[field.name].data.push({ x: entry.timestamp, y: field.quantity });
        });
    });

    return new Chart(ctx, {
        type: 'line',
        data: { datasets: Object.values(datasets) },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        tooltipFormat: 'PPpp', // Format for tooltips on hover
                        displayFormats: {
                            millisecond: 'HH:mm:ss.SSS',
                            second: 'HH:mm:ss',
                            minute: 'HH:mm',
                            hour: 'MMM d, HH:mm',
                            day: 'MMM d, yyyy',
                            week: 'MMM d, yyyy',
                            month: 'MMM yyyy',
                            year: 'yyyy',
                        }
                    },
                    ticks: { color: 'white' }
                },
                y: {
                    ticks: {
                        color: 'white',
                        precision: 0
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: { labels: { color: 'white' } },
                tooltip: { mode: 'index', intersect: false },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                    },
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


function createTotalsBarChart(totals) {
     const ctx = document.getElementById('main-chart').getContext('2d');
     return createRarityChart(totals);
}

function createDistributionChart(totals, type = 'doughnut') {
    const ctx = document.getElementById('distribution-chart').getContext('2d');
    const sorted = Object.entries(totals).sort((a,b) => b[1] - a[1]);
    const labels = sorted.map(item => item[0]);
    const data = sorted.map(item => item[1]);
    const backgroundColors = labels.map(name => getTileColor(name));

    return new Chart(ctx, {
        type: type,
        data: { labels, datasets: [{ data, backgroundColor: backgroundColors }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { color: 'white', boxWidth: 15 } } }
        }
    });
}

function showError(message) {
    document.getElementById('stocks-loading-container').style.display = 'none';
    const errorEl = document.getElementById('error-message');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

function exportStockData() {
    const data = getFilteredData();
    const totals = aggregateTotals(data);
    if(Object.keys(totals).length === 0) {
        toast('No data to export with current filters.');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Tile Name,Total Quantity\n";
    Object.entries(totals).forEach(([name, quantity]) => {
        csvContent += `"${name}",${quantity}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "my_island_stock_export.csv");
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
            if (!stockData || stockData.length === 0) {
                 throw new Error("The uploaded JSON file does not contain any valid stock messages.");
            }
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

function shadeColor(hex,percent){ try{ const num=parseInt(hex.replace('#',''),16); let r=(num>>16)+percent, g=((num>>8)&0x00FF)+percent, b=(num&0x0000FF)+percent; r=Math.max(0,Math.min(255,r)); g=Math.max(0,Math.min(255,g)); b=Math.max(0,Math.min(255,b)); return '#'+(b| (g<<8) | (r<<16)).toString(16).padStart(6,'0'); }catch{ return hex; } }
