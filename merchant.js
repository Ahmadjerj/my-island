document.addEventListener('DOMContentLoaded', async () => {
    // --- CONFIG ---
    const SUPABASE_URL = 'https://hrsbvguvsrdrjcukbdlc.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_kNDUBTOR4sthXqbgMosTjA_aLekCeLz';
    const PLACE_ID = '118648755816733';
    const UNIVERSE_ID = '7800099223';

    // --- TIMER LOGIC ---
    const BACKGROUND_TIMER_CYCLE = 45 * 60; // 45 minutes
    const EVENT_DURATION = 15 * 60; // 15 minutes
    const WARNING_PERIOD = 5 * 60; // 5 minutes warning before event
    const MAX_PLAYERS = 8;

    // --- STATE ---
    let serverData = [];
    let sortMode = 'furthest';
    let previousSortMode = 'furthest';
    let filterMode = 'active';
    let showFullServers = false;
    let joinMethod = 'ropro';
    let joinedServers = new Map();
    let outOfSyncServers = new Set();
    let isSearching = false;

    // --- UI ELEMENTS ---
    const loadingContainer = document.getElementById('loading-container');
    const serverListContainer = document.getElementById('server-list-container');
    const errorContainer = document.getElementById('error-container');
    const sortSelect = document.getElementById('sort-select');
    const filterButtonsContainer = document.getElementById('filter-buttons');
    const joinMethodButtons = document.getElementById('join-method-buttons');
    const joinByIdInput = document.getElementById('join-by-id-input');
    const joinByIdBtn = document.getElementById('join-by-id-btn');
    const fullServersToggle = document.getElementById('toggle-full-servers');

    const { createClient } = window.supabase;
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

    // --- SETTINGS PERSISTENCE ---
    function saveSettings() {
        const settings = { sortMode, filterMode, showFullServers, joinMethod };
        localStorage.setItem('merchantTrackerSettings', JSON.stringify(settings));
    }

    function loadSettings() {
        const savedSettings = localStorage.getItem('merchantTrackerSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            sortMode = settings.sortMode || 'furthest';
            filterMode = settings.filterMode || 'active';
            showFullServers = settings.showFullServers || false;
            joinMethod = settings.joinMethod || 'ropro';
        }
        previousSortMode = sortMode;

        // Update UI to reflect loaded settings
        filterButtonsContainer.querySelector(`.chip[data-filter="${filterMode}"]`)?.classList.add('active');
        joinMethodButtons.querySelector(`.chip[data-method="${joinMethod}"]`)?.classList.add('active');
        fullServersToggle.checked = showFullServers;
        sortSelect.value = sortMode;
    }

    // --- EVENT LISTENERS ---
    sortSelect?.addEventListener('change', (e) => {
        sortMode = e.target.value;
        if (sortMode !== 'join_order') previousSortMode = sortMode;
        saveSettings();
        updateAndRender(true);
    });

    joinByIdBtn?.addEventListener('click', joinById);
    joinByIdInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') joinById(); });
    joinByIdInput?.addEventListener('input', debounce(() => {
        const searchTerm = joinByIdInput.value.trim();
        isSearching = searchTerm.length > 0;
        handleSearch(searchTerm);
        if (!isSearching) updateAndRender(true);
    }, 200));

    fullServersToggle?.addEventListener('change', (e) => {
        showFullServers = e.target.checked;
        saveSettings();
        updateAndRender(true);
    });

    filterButtonsContainer?.addEventListener('click', (e) => {
        const button = e.target.closest('.chip');
        if (!button) return;
        filterMode = button.dataset.filter;
        filterButtonsContainer.querySelectorAll('.chip').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        if (['joined', 'excluded'].includes(filterMode)) sortMode = 'join_order';
        else if (sortMode === 'join_order') sortMode = previousSortMode;
        saveSettings();
        rebuildSortOptions();
        updateAndRender(true);
    });

    joinMethodButtons?.addEventListener('click', (e) => {
        const button = e.target.closest('.chip');
        if (!button) return;
        joinMethod = button.dataset.method;
        joinMethodButtons.querySelectorAll('.chip').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        saveSettings();
        updateAndRender(true);
    });

    // --- ROPRO API HANDLER ---
    function joinWithRoProAPI(serverId) {
        const apiUrl = `https://api.ropro.io/createInvite.php?universeid=${UNIVERSE_ID}&serverid=${serverId}`;
        window.open(apiUrl, '_blank');
        toast('Opening RoPro page...');
    }

    // --- DROPDOWN REBUILDER ---
    function rebuildSortOptions() {
        const baseOptions = { 'soonest': 'Soonest Event', 'furthest': 'Furthest Event', 'player_high': 'Players (High to Low)', 'player_low': 'Players (Low to High)', 'oldest': 'Server Age (Oldest)', 'newest': 'Server Age (Newest)' };
        sortSelect.innerHTML = '';
        if (['joined', 'excluded'].includes(filterMode)) {
            const opt = document.createElement('option');
            opt.value = 'join_order';
            opt.textContent = (filterMode === 'joined') ? 'Join Order' : 'Report Order';
            sortSelect.appendChild(opt);
        }
        Object.entries(baseOptions).forEach(([value, text]) => {
            const opt = document.createElement('option');
            opt.value = value;
            opt.textContent = text;
            sortSelect.appendChild(opt);
        });
        sortSelect.value = sortMode;
        if (typeof window.initializeCustomSelects === 'function') window.initializeCustomSelects();
    }

    // --- MAIN EXECUTION ---
    loadSettings();
    loadJoinedServers();
    loadOutOfSyncServers();
    await fetchData();
    rebuildSortOptions();
    setInterval(() => updateAndRender(false), 1000);
    setInterval(fetchData, 30 * 1000);

    function joinById() {
        const serverId = joinByIdInput.value.trim();
        if (serverId.length < 36) return toast('Invalid Server ID format.');
        if (joinMethod === 'ropro') {
            joinWithRoProAPI(serverId);
        } else {
            const robloxUrl = `roblox://experiences/start?placeId=${PLACE_ID}&gameInstanceId=${serverId}`;
            navigator.clipboard.writeText(robloxUrl).then(() => toast('Copied Roblox join URL!'));
        }
    }

    function handleSearch(searchTerm) {
        const term = searchTerm.toLowerCase();
        serverListContainer.querySelectorAll('.server-card').forEach(card => {
            const serverId = card.id.replace('server-', '');
            const serverIdSpan = card.querySelector('.server-id-container span');
            if (!serverId || !serverIdSpan) return;
            card.classList.remove('highlighted');
            card.style.display = 'flex';
            serverIdSpan.innerHTML = `ID: ${serverId}`;
            if (term && serverId.toLowerCase().indexOf(term) === -1) {
                card.style.display = 'none';
            } else if (term) {
                card.classList.add('highlighted');
                const regex = new RegExp(`(${term})`, 'gi');
                serverIdSpan.innerHTML = `ID: ${serverId.replace(regex, `<mark>$1</mark>`)}`;
            }
        });
    }

    async function fetchData() {
        try {
            let { data, error } = await sb.from('servers').select('*').eq('cycles_since_seen', 0);
            if (error) throw error;
            let warningMode = false;
            if (!data || data.length === 0) {
                warningMode = true;
                const { data: fallbackData, error: fallbackError } = await sb.from('servers').select('*').in('cycles_since_seen', [1,2,3,4,5]);
                if (fallbackError) throw fallbackError;
                data = fallbackData || [];
            }
            const serverMap = new Map();
            data.forEach(server => {
                if (!serverMap.has(server.server_id) || new Date(server.first_seen) > new Date(serverMap.get(server.server_id).first_seen)) {
                    serverMap.set(server.server_id, server);
                }
            });
            const currentServerIds = new Set(serverMap.keys());
            let changed = Array.from(outOfSyncServers).some(id => !currentServerIds.has(id));
            if (changed) {
                outOfSyncServers = new Set(Array.from(outOfSyncServers).filter(id => currentServerIds.has(id)));
                saveOutOfSyncServers();
            }
            serverData = Array.from(serverMap.values()).map(s => ({ ...s, showWarning: warningMode }));
            loadingContainer.style.display = 'none';
            serverListContainer.style.display = 'flex';
            errorContainer.style.display = 'none';
            updateAndRender(true);
        } catch (err) { console.error('Error fetching data:', err); showError(`Failed to fetch server data: ${err.message}.`); }
    }

    function getEventStatus(server) {
        const now = Date.now();
        const firstSeenTime = new Date(server.first_seen).getTime();
        const serverAge = Math.max(0, (now - firstSeenTime) / 1000);
        let status = { rawAge: serverAge };
        const timeInCurrentBackgroundCycle = serverAge % BACKGROUND_TIMER_CYCLE;
        const timeUntilNextBackgroundTimer = BACKGROUND_TIMER_CYCLE - timeInCurrentBackgroundCycle;
        const completedBackgroundCycles = Math.floor(serverAge / BACKGROUND_TIMER_CYCLE);

        status.phase = 'far';
        status.timeLabel = 'Arrives In:';
        status.timeRemaining = timeUntilNextBackgroundTimer;

        if (timeUntilNextBackgroundTimer <= WARNING_PERIOD) status.phase = 'starting_soon';

        if (completedBackgroundCycles > 0) {
            const eventStartTime = completedBackgroundCycles * BACKGROUND_TIMER_CYCLE;
            const eventEndTime = eventStartTime + EVENT_DURATION;
            if (serverAge >= eventStartTime && serverAge < eventEndTime) {
                 status.phase = 'active';
                 status.timeLabel = 'Leaves In:';
                 status.timeRemaining = eventEndTime - serverAge;
            }
        }
        return { ...server, ...status };
    }

    function updateAndRender(forceFullRender = false) {
        if (!serverData.length) return;
        let processed = serverData.map(getEventStatus);
        let displayList;

        if (filterMode === 'joined') {
            displayList = processed.filter(s => joinedServers.has(s.server_id)).map(s => ({ ...s, managedAt: joinedServers.get(s.server_id).joinedAt }));
        } else if (filterMode === 'excluded') {
            displayList = processed.filter(s => outOfSyncServers.has(s.server_id)).map(s => ({ ...s, managedAt: 1 }));
        } else {
            let filtered = processed.filter(s => !outOfSyncServers.has(s.server_id));
            let filteredByFull = showFullServers ? filtered : filtered.filter(s => s.player_count < MAX_PLAYERS);
            displayList = (filterMode !== 'all') ? filteredByFull.filter(s => s.phase === filterMode) : filteredByFull;
        }

        displayList.sort((a, b) => {
            const stableSort = () => a.server_id.localeCompare(b.server_id);
            switch (sortMode) {
                case 'oldest': return b.rawAge - a.rawAge || stableSort();
                case 'newest': return a.rawAge - b.rawAge || stableSort();
                case 'player_high': return b.player_count - a.player_count || stableSort();
                case 'player_low': return a.player_count - b.player_count || stableSort();
                case 'join_order': return (b.managedAt || 0) - (a.managedAt || 0) || stableSort();
                case 'soonest': return a.timeRemaining - b.timeRemaining || stableSort();
                case 'furthest': return b.timeRemaining - a.timeRemaining || stableSort();
                default: return stableSort();
            }
        });

        renderStats(processed.filter(s => !outOfSyncServers.has(s.server_id)));
        if (forceFullRender || serverListContainer.children.length !== displayList.length) {
            fullRenderServers(displayList);
            handleSearch(joinByIdInput.value.trim());
        } else if (!isSearching) {
            smartUpdateServers(displayList);
        }
    }

    function renderStats(allServers) {
        document.getElementById('total-players').textContent = allServers.reduce((sum, s) => sum + s.player_count, 0).toLocaleString();
        document.getElementById('active-merchants').textContent = allServers.filter(s => s.phase === 'active').length;
        document.getElementById('soon-merchants').textContent = allServers.filter(s => s.phase === 'starting_soon').length;
        document.getElementById('total-servers').textContent = allServers.length;
    }

    function smartUpdateServers(servers) {
        servers.forEach((server, index) => {
            const card = serverListContainer.children[index];
            if (!card || card.id !== `server-${server.server_id}`) { fullRenderServers(servers); return; }
            card.className = card.className.split(' ').filter(c => !c.startsWith('status-')).join(' ') + ` status-${server.phase}`;
            card.querySelector('.server-player-count').textContent = `${server.player_count}/${MAX_PLAYERS} Players`;
            card.querySelector('.server-timer').textContent = `${server.timeLabel} ${formatTime(server.timeRemaining)}`;
            card.querySelector('.server-age').textContent = `Age: ${formatAge(server.rawAge)}`;
        });
    }

    function fullRenderServers(servers) {
        serverListContainer.innerHTML = (servers.length === 0) ? `<div class="info-box" style="width:100%; text-align:center;">No servers match the current filter.</div>` : '';
        servers.forEach(server => serverListContainer.appendChild(createServerCard(server)));
        document.querySelectorAll('.join-btn').forEach(btn => btn.addEventListener('click', handleJoinClick));
        document.querySelectorAll('.rejoin-btn').forEach(btn => btn.addEventListener('click', handleRejoinClick));
        document.querySelectorAll('.btn-manage-list').forEach(btn => btn.addEventListener('click', handleManageListClick));
        document.querySelectorAll('.copy-id-icon-btn').forEach(el => el.addEventListener('click', handleCopyId));
    }

    function createServerCard(server) {
        const card = document.createElement('div');
        card.className = `server-card status-${server.phase}`;
        card.id = `server-${server.server_id}`;
        let buttonsHTML = '';

        if (filterMode === 'joined') {
            buttonsHTML = `
                <button class="btn btn-warning btn-manage-list" data-server-id="${server.server_id}">Return</button>
                <button class="btn btn-success rejoin-btn" data-method="ropro" data-server-id="${server.server_id}">Rejoin</button>
                <button class="btn btn-secondary rejoin-btn" data-method="copy" data-server-id="${server.server_id}">Copy</button>
            `;
        } else if (filterMode === 'excluded') {
            buttonsHTML = `<button class="btn btn-secondary btn-manage-list" data-server-id="${server.server_id}">Restore</button>`;
        } else {
            const actionButtonText = (joinMethod === 'ropro') ? 'Join (RoPro)' : 'Copy URL';
            const actionButton = `<button class="btn btn-success join-btn" data-server-id="${server.server_id}">${actionButtonText}</button>`;
            const reportButton = `<button class="btn btn-secondary btn-small btn-mark-sync" title="Mark timer as out of sync" data-server-id="${server.server_id}">Report Sync</button>`;
            buttonsHTML = `${reportButton}${actionButton}`;
        }

        const copyElementHTML = `<div class="server-id-container"><span title="${server.server_id}">ID: ${server.server_id}</span><button class="copy-id-icon-btn" title="Copy Server ID" data-server-id="${server.server_id}"><svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg></button></div>`;
        card.innerHTML = `<div class="server-card-main"><div class="status-dot"></div><div class="server-details"><div class="server-info"><span class="info-item server-player-count">${server.player_count}/${MAX_PLAYERS} Players</span><span class="info-item server-timer">${server.timeLabel} ${formatTime(server.timeRemaining)}</span></div><div class="server-meta-info"><span class="server-age">Age: ${formatAge(server.rawAge)}</span>${copyElementHTML}</div></div></div><div class="server-actions">${buttonsHTML}</div>`;
        card.querySelector('.btn-mark-sync')?.addEventListener('click', handleMarkSyncClick);
        return card;
    }

    function addOrUpdateJoinedServer(serverId) {
        if (joinedServers.has(serverId)) joinedServers.delete(serverId);
        joinedServers.set(serverId, { joinedAt: Date.now() });
        saveJoinedServers();
    }

    function handleJoinClick(e) {
        const serverId = e.target.dataset.serverId;
        if (joinMethod === 'ropro') {
            addOrUpdateJoinedServer(serverId);
            joinWithRoProAPI(serverId);
            updateAndRender(true);
        } else {
            const robloxUrl = `roblox://experiences/start?placeId=${PLACE_ID}&gameInstanceId=${serverId}`;
            navigator.clipboard.writeText(robloxUrl).then(() => {
                toast('Copied Roblox join URL!');
                addOrUpdateJoinedServer(serverId);
                updateAndRender(true);
            });
        }
    }

    function handleRejoinClick(e) {
        const serverId = e.target.dataset.serverId;
        const method = e.target.dataset.method;
        addOrUpdateJoinedServer(serverId); // Bump to top
        if (method === 'ropro') {
            joinWithRoProAPI(serverId);
            updateAndRender(true);
        } else {
            const robloxUrl = `roblox://experiences/start?placeId=${PLACE_ID}&gameInstanceId=${serverId}`;
            navigator.clipboard.writeText(robloxUrl).then(() => {
                toast('Copied Roblox join URL!');
                updateAndRender(true);
            });
        }
    }

    function handleManageListClick(e) {
        const serverId = e.target.dataset.serverId;
        if (filterMode === 'joined') joinedServers.delete(serverId);
        else if (filterMode === 'excluded') outOfSyncServers.delete(serverId);
        saveJoinedServers();
        saveOutOfSyncServers();
        updateAndRender(true);
    }

    function handleMarkSyncClick(e) {
        const serverId = e.currentTarget.dataset.serverId;
        outOfSyncServers.add(serverId);
        saveOutOfSyncServers();
        toast(`Server moved to 'Excluded' list.`);
        updateAndRender(true);
    }

    function handleCopyId(e) {
        const serverId = e.currentTarget.dataset.serverId;
        navigator.clipboard.writeText(serverId).then(() => toast(`Copied Server ID`));
    }

    // --- LOCAL STORAGE & UTILS ---
    function saveJoinedServers() { localStorage.setItem('joinedMerchantServers', JSON.stringify(Array.from(joinedServers.entries()))); }
    function loadJoinedServers() { const s = localStorage.getItem('joinedMerchantServers'); if (s) joinedServers = new Map(JSON.parse(s)); }
    function saveOutOfSyncServers() { localStorage.setItem('outOfSyncServers', JSON.stringify(Array.from(outOfSyncServers))); }
    function loadOutOfSyncServers() { const s = localStorage.getItem('outOfSyncServers'); if (s) outOfSyncServers = new Set(JSON.parse(s)); }
    function showError(msg) { errorContainer.innerHTML = `<div class="info-box error-box">${msg}</div>`; errorContainer.style.display = 'block'; }
    function formatTime(s) { const t = Math.ceil(Math.max(0, s)), m = Math.floor(t/60), sec = t%60; return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`; }
    function formatAge(s) { const h = Math.floor(s/3600), m = Math.floor((s%3600)/60); return h>0 ? `${h}h ${m}m` : `${m}m`; }
    function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
    function toast(message) { if (typeof window.toast === 'function') window.toast(message); else console.log('Toast:', message); }
});
