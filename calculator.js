document.addEventListener('DOMContentLoaded', () => {
    initCalculator();
    setupImageUpload();
});

function initCalculator() {
    initResourceCalculator();
    initTileCalculator();
    loadCalculatorState();

    document.getElementById('include-tiles-toggle').addEventListener('change', function() {
        const tileGrid = document.getElementById('tile-calculator-grid');
        if (this.checked) {
            tileGrid.classList.remove('hidden');
        } else {
            tileGrid.classList.add('hidden');
        }
        calculateNetWorth();
    });

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

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('active');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('active'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('active');
        showPreview(e.dataTransfer.files[0]);
    });

    // --- MOUSE Events (Desktop) ---
    preview.addEventListener('wheel', e => {
        e.preventDefault();
        const rect = preview.getBoundingClientRect();

        // Mouse position relative to the image's top-left corner
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // The point on the image that the mouse is over (before zoom)
        const imagePointX = (mouseX - imageTransform.translateX) / imageTransform.scale;
        const imagePointY = (mouseY - imageTransform.translateY) / imageTransform.scale;

        // Use a gentle zoom factor for smooth scaling
        const zoomFactor = 1.1;
        const newScale = e.deltaY < 0 ? imageTransform.scale * zoomFactor : imageTransform.scale / zoomFactor;

        // Clamp the scale to prevent extreme zoom levels
        imageTransform.scale = Math.max(0.5, Math.min(newScale, 5));

        // Adjust translation so the image point under the cursor stays there after zooming
        imageTransform.translateX = mouseX - imagePointX * imageTransform.scale;
        imageTransform.translateY = mouseY - imagePointY * imageTransform.scale;

        applyTransform();
    }, { passive: false }); // Add passive: false for better scroll handling

    preview.addEventListener('mousedown', e => {
        e.preventDefault();
        isPanning = true;
        startPan.x = e.clientX - imageTransform.translateX;
        startPan.y = e.clientY - imageTransform.translateY;
        preview.style.cursor = 'grabbing';
    });

    window.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            preview.style.cursor = 'grab';
        }
    });

    window.addEventListener('mousemove', e => {
        if (!isPanning) return;
        e.preventDefault();
        imageTransform.translateX = e.clientX - startPan.x;
        imageTransform.translateY = e.clientY - startPan.y;
        applyTransform();
    });

    // --- TOUCH Events (Mobile) ---
    const getDistance = (touches) => {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.hypot(dx, dy);
    };

    const getMidpoint = (touches) => {
        return {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2
        };
    };

    let lastMidpoint = { x: 0, y: 0 };

    preview.addEventListener('touchstart', e => {
        e.preventDefault();
        if (e.touches.length === 1) {
            isPanning = true;
            startPan.x = e.touches[0].clientX - imageTransform.translateX;
            startPan.y = e.touches[0].clientY - imageTransform.translateY;
        } else if (e.touches.length === 2) {
            isPanning = false;
            initialPinchDistance = getDistance(e.touches);
            lastMidpoint = getMidpoint(e.touches);
        }
    }, { passive: false });

    preview.addEventListener('touchmove', e => {
        e.preventDefault();

        if (isPanning && e.touches.length === 1) {
            imageTransform.translateX = e.touches[0].clientX - startPan.x;
            imageTransform.translateY = e.touches[0].clientY - startPan.y;
            applyTransform();
        } else if (e.touches.length === 2) {
            const newDist = getDistance(e.touches);
            const newMidpoint = getMidpoint(e.touches);
            const rect = preview.getBoundingClientRect();

            const scaleChange = newDist / initialPinchDistance;
            const oldScale = imageTransform.scale;
            imageTransform.scale = Math.max(0.5, Math.min(oldScale * scaleChange, 5));

            const zoomCenterX = newMidpoint.x - rect.left - containerSize.width / 2;
            const zoomCenterY = newMidpoint.y - rect.top - containerSize.height / 2;

            const scaleRatio = imageTransform.scale / oldScale;
            imageTransform.translateX = zoomCenterX - (zoomCenterX - imageTransform.translateX) * scaleRatio;
            imageTransform.translateY = zoomCenterY - (zoomCenterY - imageTransform.translateY) * scaleRatio;

            const deltaX = newMidpoint.x - lastMidpoint.x;
            const deltaY = newMidpoint.y - lastMidpoint.y;
            imageTransform.translateX += deltaX;
            imageTransform.translateY += deltaY;

            applyTransform();
            initialPinchDistance = newDist;
            lastMidpoint = newMidpoint;
        }
    }, { passive: false });

    preview.addEventListener('touchend', e => {
        if (e.touches.length < 2) {
            isPanning = e.touches.length === 1;
            if (isPanning) {
                startPan.x = e.touches[0].clientX - imageTransform.translateX;
                startPan.y = e.touches[0].clientY - imageTransform.translateY;
            }
        }
        if (e.touches.length === 0) {
            isPanning = false;
        }
    });

    window.addEventListener('resize', () => {
        if (preview.style.display !== 'none') {
            setTimeout(() => {
                updateContainerSize();
                applyTransform();
            }, 100);
        }
    });

    let lastTap = 0;
    preview.addEventListener('touchend', e => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 500 && tapLength > 0 && e.touches.length === 0) {
            resetTransform();
        }
        lastTap = currentTime;
    });

    preview.addEventListener('dblclick', e => {
        e.preventDefault();
        resetTransform();
    });
}

function initResourceCalculator() {
    const grid = document.getElementById('resource-calculator-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const sortedResources = CALCULATOR_RESOURCE_ORDER.map(name => [name, RESOURCE_PRICES[name]]);
    sortedResources.forEach(([name, data]) => {
        const imageName = data.img;
        const inputGroup = document.createElement('div');
        inputGroup.className = 'resource-input-group';
        let imageHTML = `<div class="dot" title="${name} (image not found)"></div>`;
        if (imageName) imageHTML = `<img src="images/${imageName}" alt="${name}" title="${name}">`;
        inputGroup.innerHTML = `
            ${imageHTML}
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
        .filter(([, data]) => data.cost > 0)
        .filter(([name]) => name !== 'Group Tile')
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
    let cashValue = 0;
    let resourceValue = 0;
    let tileAssetsValue = 0;

    cashValue = parseNumberInput(document.getElementById('calc-cash').value);

    Object.keys(RESOURCE_PRICES).forEach(name => {
        const input = document.getElementById(`calc-res-${name.replace(/ /g, '_')}`);
        if (input) {
            resourceValue += parseNumberInput(input.value) * RESOURCE_PRICES[name].price;
        }
    });

    const friends = parseInt(document.getElementById('friends-slider').value);
    if (friends > 0) {
        resourceValue *= (1 + (friends * 0.10));
    }

    const includeTiles = document.getElementById('include-tiles-toggle').checked;
    if (includeTiles) {
        Object.entries(MASTER_TILE_DATABASE).forEach(([name, data]) => {
            if (data.cost > 0) {
                const input = document.getElementById(`calc-tile-${name.replace(/ /g, '_')}`);
                if (input) {
                    tileAssetsValue += parseNumberInput(input.value) * data.cost;
                }
            }
        });
    }

    const totalNetWorth = cashValue + resourceValue + tileAssetsValue;

    document.getElementById('total-net-worth').textContent = `$${totalNetWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    document.getElementById('total-net-worth-short').textContent = `(${formatNumberShort(totalNetWorth)})`;

    saveCalculatorState();
}

function updateFriendsSlider(slider) {
    document.getElementById('friends-count').textContent = slider.value;
    document.getElementById('friends-boost').textContent = slider.value * 10;
    calculateNetWorth();
}

function clearCalculator() {
    if (!confirm('Are you sure you want to clear all calculator inputs?')) return;

    document.getElementById('calc-cash').value = '';
    const friendsSlider = document.getElementById('friends-slider');
    friendsSlider.value = 0;
    updateFriendsSlider(friendsSlider);

    document.getElementById('include-tiles-toggle').checked = true;

    const tileGrid = document.getElementById('tile-calculator-grid');
    if (tileGrid) {
        tileGrid.classList.remove('hidden');
    }

    Object.keys(RESOURCE_PRICES).forEach(name => {
        const input = document.getElementById(`calc-res-${name.replace(/ /g, '_')}`);
        if (input) input.value = '';
    });
    Object.entries(MASTER_TILE_DATABASE).forEach(([name, data]) => {
        if (data.cost > 0) {
            const input = document.getElementById(`calc-tile-${name.replace(/ /g, '_')}`);
            if (input) input.value = '';
        }
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
            includeTiles: document.getElementById('include-tiles-toggle').checked
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
        localStorage.setItem('calculatorState_v8', JSON.stringify(state));
    } catch (e) {
        console.error("Could not save calculator state:", e);
    }
}

function loadCalculatorState() {
    const saved = localStorage.getItem('calculatorState_v8');
    if (!saved) return;
    try {
        const state = JSON.parse(saved);
        document.getElementById('calc-cash').value = state.cash || '';

        const friendsSlider = document.getElementById('friends-slider');
        friendsSlider.value = state.friends || 0;
        updateFriendsSlider(friendsSlider);

        const includeTilesToggle = document.getElementById('include-tiles-toggle');
        includeTilesToggle.checked = state.includeTiles ?? true;

        const tileGrid = document.getElementById('tile-calculator-grid');
        if (tileGrid) {
            if (includeTilesToggle.checked) {
                tileGrid.classList.remove('hidden');
            } else {
                tileGrid.classList.add('hidden');
            }
        }

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
    } catch(e) {
        console.error("Could not load calculator state:", e);
    }
}
