document.addEventListener('DOMContentLoaded', async () => {
    // --- CONFIG ---
    const SUPABASE_URL = 'https://hrsbvguvsrdrjcukbdlc.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_kNDUBTOR4sthXqbgMosTjA_aLekCeLz';
    const PLACE_ID = '118648755816733';

    // --- TIMER LOGIC ---
    const BACKGROUND_TIMER_CYCLE = 45 * 60; // 45 minutes - the continuous background timer
    const EVENT_DURATION = 15 * 60; // 15 minutes - but can vary (15-16 minutes in reality)
    const WARNING_PERIOD = 5 * 60;  // 5 minutes warning before event
    const MAX_PLAYERS = 8;
    const JOINED_SERVER_GRACE_PERIOD = 45 * 60 * 1000; // 45 minutes in milliseconds

    // --- STATE ---
    let serverData = [];
    let sortMode = 'soonest';
    let previousSortMode = 'soonest';
    let filterMode = 'all';
    let showFullServers = false;
    let joinedServers = new Map();

    // --- UI ELEMENTS ---
    const loadingContainer = document.getElementById('loading-container');
    const serverListContainer = document.getElementById('server-list-container');
    const errorContainer = document.getElementById('error-container');
    const sortSelect = document.getElementById('sort-select');
    const filterButtonsContainer = document.getElementById('filter-buttons');
    const joinByIdInput = document.getElementById('join-by-id-input');
    const joinByIdBtn = document.getElementById('join-by-id-btn');
    const fullServersToggle = document.getElementById('toggle-full-servers');

    const { createClient } = window.supabase;
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

    // --- ROBLOX LAUNCH FUNCTIONS ---
    function launchRobloxGame(placeId, gameInstanceId = null) {
        const robloxUrl = gameInstanceId ? `roblox://placeId=${placeId}&gameInstanceId=${gameInstanceId}` : `roblox://placeId=${placeId}`;
        const link = document.createElement('a');
        link.href = robloxUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function safeLaunchRobloxGame(placeId, gameInstanceId = null, serverDisplayName = '') {
        const displayName = serverDisplayName || (gameInstanceId ? gameInstanceId.substring(0, 8) + '...' : 'Random Server');
        toast(`Launching Roblox... Joining ${displayName}`);
        try {
            launchRobloxGame(placeId, gameInstanceId);
            setTimeout(() => { toast(`✓ Roblox should be launching.`); }, 1500);
            return true;
        } catch (error) {
            console.error('Failed to launch Roblox:', error);
            toast(`❌ Failed to launch Roblox.`);
            return false;
        }
    }

    // --- EVENT LISTENERS ---
    sortSelect?.addEventListener('change', (e) => {
        const newSortMode = e.target.value;
        if (!newSortMode) return;
        sortMode = newSortMode;
        if (newSortMode !== 'join_order') {
            previousSortMode = newSortMode;
        }
        updateAndRender(true);
    });

    joinByIdBtn?.addEventListener('click', joinById);
    joinByIdInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') joinById(); });
    fullServersToggle?.addEventListener('change', (e) => {
        showFullServers = e.target.checked;
        updateAndRender(true);
    });

    filterButtonsContainer?.addEventListener('click', (e) => {
        const button = e.target.closest('.chip');
        if (!button) return;
        const newFilterMode = button.dataset.filter;
        if (filterMode === newFilterMode) return;
        filterMode = newFilterMode;
        filterButtonsContainer.querySelectorAll('.chip').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        if (filterMode === 'joined') {
            sortMode = 'join_order';
        } else {
            if (sortMode === 'join_order') {
                sortMode = previousSortMode;
            }
        }
        rebuildSortOptions();
        updateAndRender(true);
    });

    // --- DROPDOWN REBUILDER ---
    function rebuildSortOptions() {
        const baseOptions = {
            'soonest': 'Soonest Event',
            'furthest': 'Furthest Event',
            'player_high': 'Players (High to Low)',
            'player_low': 'Players (Low to High)',
            'oldest': 'Server Age (Oldest)',
            'newest': 'Server Age (Newest)'
        };
        sortSelect.innerHTML = '';
        if (filterMode === 'joined') {
            const opt = document.createElement('option');
            opt.value = 'join_order';
            opt.textContent = 'Join Order';
            sortSelect.appendChild(opt);
        }
        for (const [value, text] of Object.entries(baseOptions)) {
            const opt = document.createElement('option');
            opt.value = value;
            opt.textContent = text;
            sortSelect.appendChild(opt);
        }
        sortSelect.value = sortMode;
        if (typeof window.initializeCustomSelects === 'function') {
            window.initializeCustomSelects();
        }
    }

    // --- MAIN EXECUTION ---
    loadJoinedServers();
    await fetchData();
    rebuildSortOptions();
    setInterval(() => updateAndRender(false), 1000);
    setInterval(fetchData, 30 * 1000);

    function joinById() {
        const serverId = joinByIdInput.value.trim();
        if (serverId.length < 36) { return toast('Invalid Server ID format.'); }
        if (safeLaunchRobloxGame(PLACE_ID, serverId)) {
            joinByIdInput.value = '';
        }
    }

    async function fetchData() {
        try {
            const { data, error } = await sb.from('servers').select('*').eq('status', 'active').eq('cycles_since_seen', 0);
            if (error) throw error;

            const serverMap = new Map();
            for (const server of data) {
                if (!serverMap.has(server.server_id) || new Date(server.first_seen) > new Date(serverMap.get(server.server_id).first_seen)) {
                    serverMap.set(server.server_id, server);
                }
            }

            const cleanedData = Array.from(serverMap.values());
            serverData = cleanedData.filter(s => s.player_count <= MAX_PLAYERS && s.player_count >= 0);
            loadingContainer.style.display = 'none';
            serverListContainer.style.display = 'flex';
            errorContainer.style.display = 'none';
            updateAndRender(true);
        } catch (err) {
            console.error('Error fetching data:', err);
            showError(`Failed to fetch server data: ${err.message}.`);
        }
    }

    // --- CORRECTED EVENT TIMING LOGIC ---
    function getEventStatus(server) {
        const now = Date.now();
        const firstSeenTime = new Date(server.first_seen).getTime();
        const serverAge = (now - firstSeenTime) / 1000; // Total server age in seconds

        let status = {
            rawAge: serverAge,
            age: serverAge
        };

        // The background timer runs continuously every 45 minutes since server creation
        const timeInCurrentBackgroundCycle = serverAge % BACKGROUND_TIMER_CYCLE;
        const timeUntilNextBackgroundTimer = BACKGROUND_TIMER_CYCLE - timeInCurrentBackgroundCycle;

        // Check if we're currently in an active event
        // Events start when the background timer hits 45min, and can last 15-16 minutes
        // But the background timer keeps running during the event
        let isInActiveEvent = false;
        let timeUntilEventEnds = 0;

        // Calculate how many complete 45-minute cycles have passed
        const completedBackgroundCycles = Math.floor(serverAge / BACKGROUND_TIMER_CYCLE);

        if (completedBackgroundCycles > 0) {
            // At least one background timer cycle has completed, so events could be happening
            // Check each possible event period to see if we're currently in one
            for (let cycle = 0; cycle < completedBackgroundCycles + 1; cycle++) {
                const eventStartTime = (cycle + 1) * BACKGROUND_TIMER_CYCLE; // Events start after each 45min cycle
                const eventEndTime = eventStartTime + EVENT_DURATION; // Events last ~15 minutes

                if (serverAge >= eventStartTime && serverAge < eventEndTime) {
                    // We're currently in an active event
                    isInActiveEvent = true;
                    timeUntilEventEnds = eventEndTime - serverAge;
                    break;
                }
            }
        }

        if (isInActiveEvent) {
            // Currently in an active event
            status.phase = 'active';
            status.timeLabel = 'Leaves In:';
            status.timeRemaining = timeUntilEventEnds;
        } else {
            // Waiting for next event (next background timer to complete)
            status.phase = timeUntilNextBackgroundTimer <= WARNING_PERIOD ? 'starting_soon' : 'far';
            status.timeLabel = 'Arrives In:';
            status.timeRemaining = timeUntilNextBackgroundTimer;
        }

        // Debug logging to help identify timing issues
        console.log(`Server ${server.server_id.substring(0,8)}: Age=${Math.floor(serverAge/60)}m, BackgroundTimer=${Math.floor(timeInCurrentBackgroundCycle/60)}m/${Math.floor(BACKGROUND_TIMER_CYCLE/60)}m, InEvent=${isInActiveEvent}, TimeRemaining=${Math.floor(status.timeRemaining/60)}m`);

        status.confidence = calculateTimingConfidence(server, status);
        return { ...server, ...status };
    }

    function calculateTimingConfidence(server, status) {
        const ageMinutes = status.rawAge / 60;
        const playersPerMinute = server.player_count / Math.max(ageMinutes, 1);

        if (server.cycles_since_seen > 0) return 'low';
        if (ageMinutes < 10 && playersPerMinute > 1) return 'medium';
        if (ageMinutes < 5 && server.player_count > 6) return 'low';
        return 'high';
    }

    function updateAndRender(forceFullRender = false) {
        if (!serverData.length) return;

        let processed = serverData.map(getEventStatus);
        let displayList;

        if (filterMode === 'joined') {
            displayList = processed.filter(s => joinedServers.has(s.server_id))
                .map(s => ({ ...s, joinedAt: joinedServers.get(s.server_id).joinedAt }));
        } else {
            let filteredByFull = showFullServers ? processed : processed.filter(s => s.player_count < MAX_PLAYERS);
            displayList = filteredByFull.filter(s => !joinedServers.has(s.server_id));
            if (filterMode !== 'all') {
                displayList = displayList.filter(s => s.phase === filterMode);
            }
        }

        displayList.sort((a, b) => {
            switch (sortMode) {
                case 'oldest': return b.age - a.age;
                case 'newest': return a.age - b.age;
                case 'player_high': return b.player_count - a.player_count;
                case 'player_low': return a.player_count - b.player_count;
                case 'join_order': return (b.joinedAt || 0) - (a.joinedAt || 0);
                case 'soonest': return a.timeRemaining - b.timeRemaining;
                case 'furthest': return b.timeRemaining - a.timeRemaining;
                default: return 0;
            }
        });

        renderStats(processed);

        if (forceFullRender || serverListContainer.children.length !== displayList.length) {
            fullRenderServers(displayList);
        } else {
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
            if (!card || card.id !== `server-${server.server_id}`) {
                fullRenderServers(servers);
                return;
            }
            card.className = `server-card status-${server.phase} confidence-${server.confidence}`;
            card.querySelector('.server-player-count').textContent = `${server.player_count}/${MAX_PLAYERS} Players`;
            card.querySelector('.server-timer').textContent = `${server.timeLabel} ${formatTime(server.timeRemaining)}`;
            card.querySelector('.server-age').textContent = `Age: ${formatAge(server.rawAge)}`;
        });
    }

    function fullRenderServers(servers) {
        serverListContainer.innerHTML = '';
        if (servers.length === 0) {
            serverListContainer.innerHTML = `<div class="info-box" style="width:100%; text-align:center;">No servers match the current filter.</div>`;
            return;
        }
        servers.forEach(server => serverListContainer.appendChild(createServerCard(server, filterMode === 'joined')));

        document.querySelectorAll('.join-btn').forEach(btn => btn.addEventListener('click', handleJoinClick));
        document.querySelectorAll('.return-btn').forEach(btn => btn.addEventListener('click', handleReturnClick));
        document.querySelectorAll('.copy-id-icon-btn').forEach(el => el.addEventListener('click', handleCopyId));
    }

    function createServerCard(server, isJoined) {
        const card = document.createElement('div');
        card.className = `server-card status-${server.phase} confidence-${server.confidence}`;
        card.id = `server-${server.server_id}`;

        let confidenceHTML = '';
        if (server.confidence === 'medium') confidenceHTML = `<span class="info-item warning-info" title="Timing might be slightly inaccurate"><svg viewBox="0 0 24 24" width="12" height="12"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>~</span>`;
        if (server.confidence === 'low') confidenceHTML = `<span class="info-item error-info" title="Timing may be inaccurate"><svg viewBox="0 0 24 24" width="12" height="12"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>?</span>`;

        const joinButtonHTML = `<button class="btn btn-success join-btn" data-server-id="${server.server_id}">Join</button>`;
        const returnButtonHTML = isJoined ? `<button class="btn btn-warning return-btn" data-server-id="${server.server_id}">Return</button>` : '';
        const copyElementHTML = `<div class="server-id-container"><span title="${server.server_id}">ID: ${server.server_id}</span><button class="copy-id-icon-btn" title="Copy Server ID" data-server-id="${server.server_id}"><svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg></button></div>`;

        card.innerHTML = `<div class="server-card-main">
            <div class="status-dot"></div>
            <div class="server-details">
                <div class="server-info">
                    <span class="info-item server-player-count">${server.player_count}/${MAX_PLAYERS} Players</span>
                    <span class="info-item server-timer">${server.timeLabel} ${formatTime(server.timeRemaining)}</span>
                    ${confidenceHTML}
                </div>
                <div class="server-meta-info">
                    <span class="server-age">Age: ${formatAge(server.rawAge)}</span>
                    ${copyElementHTML}
                </div>
            </div>
        </div>
        <div class="server-actions">${joinButtonHTML}${returnButtonHTML}</div>`;
        return card;
    }

    function handleJoinClick(e) {
        const serverId = e.target.dataset.serverId;
        joinedServers.set(serverId, { joinedAt: Date.now() });
        saveJoinedServers();
        safeLaunchRobloxGame(PLACE_ID, serverId);
        updateAndRender(true);
    }

    function handleReturnClick(e) {
        joinedServers.delete(e.target.dataset.serverId);
        saveJoinedServers();
        updateAndRender(true);
    }

    function handleCopyId(e) {
        const serverId = e.currentTarget.dataset.serverId;
        navigator.clipboard.writeText(serverId).then(() => toast(`Copied Server ID`));
    }

    function saveJoinedServers() {
        localStorage.setItem('joinedMerchantServers', JSON.stringify(Array.from(joinedServers.entries())));
    }

    function loadJoinedServers() {
        const stored = localStorage.getItem('joinedMerchantServers');
        if (stored) {
            joinedServers = new Map(JSON.parse(stored));
        }
    }

    function showError(msg) {
        errorContainer.innerHTML = `<div class="info-box error-box">${msg}</div>`;
        errorContainer.style.display = 'block';
    }

    function formatTime(s) {
        const totalSeconds = Math.ceil(Math.max(0, s));
        const m = Math.floor(totalSeconds / 60);
        const sec = totalSeconds % 60;
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }

    function formatAge(s) {
        const h = Math.floor(s/3600);
        const m = Math.floor((s%3600)/60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }

    function initializeCustomSelects() {
        if (typeof window.initializeCustomSelects === 'function') {
            window.initializeCustomSelects();
        }
    }

    function toast(message) {
        if (typeof window.toast === 'function') {
            window.toast(message);
        } else {
            console.log('Toast:', message);
        }
    }
});
