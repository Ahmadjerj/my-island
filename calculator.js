document.addEventListener('DOMContentLoaded', () => {
    initCalculator();
    setupImageUpload();
});

function initCalculator() {
    initResourceCalculator();
    initTileCalculator();
    loadCalculatorState();

    document.getElementById('include-tiles-toggle').addEventListener('change', calculateNetWorth);
    document.getElementById('bell-tower-toggle').addEventListener('change', () => {
        updateFriendsSlider(document.getElementById('friends-slider'));
    });

    // Initial check for tile grid visibility
    const includeTilesToggle = document.getElementById('include-tiles-toggle');
    const tileGrid = document.getElementById('tile-calculator-grid');
    tileGrid.classList.toggle('hidden', !includeTilesToggle.checked);

    calculateNetWorth();
}


function setupImageUpload() {
    const dropZone = document.getElementById('image-drop-zone');
    const input = document.getElementById('image-upload-input');
    const preview = document.getElementById('uploaded-image-preview');
    const removeBtn = document.getElementById('remove-image-btn');

    let imageTransform = { scale: 1, translateX: 0, translateY: 0 };
    let isPanning = false;
    let startPan = { x: 0, y: 0 };
    let initialPinchDistance = 0;
    let imageNaturalSize = { width: 0, height: 0 };
    let containerSize = { width: 0, height: 0 };

    const updateContainerSize = () => {
        const rect = preview.getBoundingClientRect();
        containerSize.width = rect.width;
        containerSize.height = rect.height;
    };

    const constrainTransform = () => {
        updateContainerSize();

        if (imageNaturalSize.width === 0 || imageNaturalSize.height === 0) return;

        const scaledWidth = (imageNaturalSize.width / Math.max(imageNaturalSize.width / containerSize.width, imageNaturalSize.height / containerSize.height)) * imageTransform.scale;
        const scaledHeight = (imageNaturalSize.height / Math.max(imageNaturalSize.width / containerSize.width, imageNaturalSize.height / containerSize.height)) * imageTransform.scale;

        const maxTranslateX = Math.max(0, (scaledWidth - containerSize.width) / 2);
        const maxTranslateY = Math.max(0, (scaledHeight - containerSize.height) / 2);

        imageTransform.translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, imageTransform.translateX));
        imageTransform.translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, imageTransform.translateY));
    };

    const applyTransform = () => {
        constrainTransform();
        preview.style.transform = `translate(${imageTransform.translateX}px, ${imageTransform.translateY}px) scale(${imageTransform.scale})`;
    };

    const resetTransform = () => {
        imageTransform = { scale: 1, translateX: 0, translateY: 0 };
        applyTransform();
    };

    const showPreview = (file) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';
                removeBtn.style.display = 'inline-block';
                dropZone.style.display = 'flex';
                input.value = '';

                preview.onload = () => {
                    imageNaturalSize.width = preview.naturalWidth;
                    imageNaturalSize.height = preview.naturalHeight;
                    resetTransform();
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                showPreview(file);
                toast('Image pasted from clipboard!');
                break;
            }
        }
    };

    dropZone.addEventListener('paste', handlePaste);
    document.addEventListener('paste', handlePaste);

    removeBtn.addEventListener('click', () => {
        preview.src = '';
        preview.style.display = 'none';
        removeBtn.style.display = 'none';
        dropZone.style.display = 'flex';
        input.value = '';
        imageNaturalSize = { width: 0, height: 0 };
    });

    dropZone.addEventListener('click', () => input.click());
    input.addEventListener('change', (e) => showPreview(e.target.files[0]));

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('active'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('active'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('active');
        showPreview(e.dataTransfer.files[0]);
    });

    preview.addEventListener('wheel', e => {
        e.preventDefault();
        const rect = preview.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const imagePointX = (mouseX - imageTransform.translateX) / imageTransform.scale;
        const imagePointY = (mouseY - imageTransform.translateY) / imageTransform.scale;
        const zoomFactor = 1.1;
        const newScale = e.deltaY < 0 ? imageTransform.scale * zoomFactor : imageTransform.scale / zoomFactor;
        imageTransform.scale = Math.max(0.5, Math.min(newScale, 5));
        imageTransform.translateX = mouseX - imagePointX * imageTransform.scale;
        imageTransform.translateY = mouseY - imagePointY * imageTransform.scale;
        applyTransform();
    }, { passive: false });

    preview.addEventListener('mousedown', e => {
        e.preventDefault();
        isPanning = true;
        startPan.x = e.clientX - imageTransform.translateX;
        startPan.y = e.clientY - imageTransform.translateY;
        preview.style.cursor = 'grabbing';
    });
    window.addEventListener('mouseup', () => { if (isPanning) { isPanning = false; preview.style.cursor = 'grab'; } });
    window.addEventListener('mousemove', e => {
        if (!isPanning) return;
        e.preventDefault();
        imageTransform.translateX = e.clientX - startPan.x;
        imageTransform.translateY = e.clientY - startPan.y;
        applyTransform();
    });

    preview.addEventListener('dblclick', e => { e.preventDefault(); resetTransform(); });
}

function initResourceCalculator() {
    const grid = document.getElementById('resource-calculator-grid');
    if (!grid) return;
    grid.innerHTML = '';
    CALCULATOR_RESOURCE_ORDER.forEach(name => {
        const data = RESOURCE_PRICES[name];
        if (!data) { console.warn(`Resource ${name} not found in RESOURCE_PRICES`); return; }
        const inputGroup = document.createElement('div');
        inputGroup.className = 'resource-input-group';
        inputGroup.innerHTML = `
            <img src="images/${data.img}" alt="${name}" title="${name}">
            <div style="flex:1;">
                <label for="calc-res-${name.replace(/ /g, '_')}">${name} ($${data.price.toLocaleString()})</label>
                <input type="text" id="calc-res-${name.replace(/ /g, '_')}" class="form-input" placeholder="0" oninput="calculateNetWorth()">
            </div>`;
        grid.appendChild(inputGroup);
    });
}

function initTileCalculator() {
    const grid = document.getElementById('tile-calculator-grid');
    if (!grid) return;
    grid.innerHTML = '';
    Object.entries(MASTER_TILE_DATABASE)
        .filter(([, data]) => data.cost > 0 && name !== 'Group Tile')
        .sort(([, a], [, b]) => a.cost - b.cost)
        .forEach(([name, data]) => {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'resource-input-group';
            inputGroup.innerHTML = `
                <div class="dot" style="background-color: ${data.color}; flex-shrink: 0;" title="${name}"></div>
                <div style="flex:1;">
                    <label for="calc-tile-${name.replace(/ /g, '_')}">${name} ($${data.cost.toLocaleString()})</label>
                    <input type="text" id="calc-tile-${name.replace(/ /g, '_')}" class="form-input" placeholder="0" oninput="calculateNetWorth()">
                </div>`;
            grid.appendChild(inputGroup);
        });
}

function calculateNetWorth() {
    let cashValue = parseNumberInput(document.getElementById('calc-cash').value);
    let resourceValue = 0;
    let tileAssetsValue = 0;

    // Calculate resource value
    Object.keys(RESOURCE_PRICES).forEach(name => {
        const input = document.getElementById(`calc-res-${name.replace(/ /g, '_')}`);
        if (input) resourceValue += parseNumberInput(input.value) * RESOURCE_PRICES[name].price;
    });

    // Apply friend and bell tower boosts to resources
    const friends = parseInt(document.getElementById('friends-slider').value);
    const hasBellTower = document.getElementById('bell-tower-toggle').checked;
    const boostPerFriend = hasBellTower ? 0.15 : 0.10;
    if (friends > 0) {
        resourceValue *= (1 + (friends * boostPerFriend));
    }

    // Calculate tile value
    const includeTilesToggle = document.getElementById('include-tiles-toggle');
    const tileGrid = document.getElementById('tile-calculator-grid');
    tileGrid.classList.toggle('hidden', !includeTilesToggle.checked);
    if (includeTilesToggle.checked) {
        Object.entries(MASTER_TILE_DATABASE).forEach(([name, data]) => {
            if (data.cost > 0) {
                const input = document.getElementById(`calc-tile-${name.replace(/ /g, '_')}`);
                if (input) tileAssetsValue += parseNumberInput(input.value) * data.cost;
            }
        });
    }

    const totalNetWorth = cashValue + resourceValue + tileAssetsValue;
    document.getElementById('total-net-worth').textContent = `$${totalNetWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    document.getElementById('total-net-worth-short').textContent = `(${formatNumberShort(totalNetWorth)})`;
    saveCalculatorState();
}

function updateFriendsSlider(slider) {
    const hasBellTower = document.getElementById('bell-tower-toggle').checked;
    const boostPerFriend = hasBellTower ? 15 : 10;
    document.getElementById('friends-count').textContent = slider.value;
    document.getElementById('friends-boost').textContent = slider.value * boostPerFriend;
    calculateNetWorth();
}

function clearCalculator() {
    if (!confirm('Are you sure you want to clear all calculator inputs?')) return;
    document.getElementById('calc-cash').value = '';
    const friendsSlider = document.getElementById('friends-slider');
    friendsSlider.value = 0;
    document.getElementById('bell-tower-toggle').checked = false;
    updateFriendsSlider(friendsSlider);
    document.getElementById('include-tiles-toggle').checked = true;
    document.getElementById('tile-calculator-grid').classList.remove('hidden');
    document.querySelectorAll('.form-input').forEach(input => {
        if (input.id !== 'calc-cash') input.value = '';
    });
    calculateNetWorth();
    toast('Calculator cleared!');
}

function saveCalculatorState() {
    try {
        const state = {
            cash: document.getElementById('calc-cash').value,
            resources: {},
            tiles: {},
            friends: document.getElementById('friends-slider').value,
            includeTiles: document.getElementById('include-tiles-toggle').checked,
            bellTower: document.getElementById('bell-tower-toggle').checked
        };
        Object.keys(RESOURCE_PRICES).forEach(name => {
            const input = document.getElementById(`calc-res-${name.replace(/ /g, '_')}`);
            if (input) state.resources[name] = input.value;
        });
        Object.entries(MASTER_TILE_DATABASE).forEach(([name, data]) => {
            if (data.cost > 0) {
                const input = document.getElementById(`calc-tile-${name.replace(/ /g, '_')}`);
                if (input) state.tiles[name] = input.value;
            }
        });
        localStorage.setItem('calculatorState_v9', JSON.stringify(state));
    } catch (e) { console.error("Could not save calculator state:", e); }
}

function loadCalculatorState() {
    const saved = localStorage.getItem('calculatorState_v9');
    if (!saved) return;
    try {
        const state = JSON.parse(saved);
        document.getElementById('calc-cash').value = state.cash || '';
        document.getElementById('friends-slider').value = state.friends || 0;
        document.getElementById('include-tiles-toggle').checked = state.includeTiles ?? true;
        document.getElementById('bell-tower-toggle').checked = state.bellTower || false;

        updateFriendsSlider(document.getElementById('friends-slider'));

        if(state.resources) {
            Object.entries(state.resources).forEach(([name, value]) => {
                const input = document.getElementById(`calc-res-${name.replace(/ /g, '_')}`);
                if (input) input.value = value;
            });
        }
        if(state.tiles) {
            Object.entries(state.tiles).forEach(([name, value]) => {
                const input = document.getElementById(`calc-tile-${name.replace(/ /g, '_')}`);
                if (input) input.value = value;
            });
        }
    } catch(e) { console.error("Could not load calculator state:", e); }
}
