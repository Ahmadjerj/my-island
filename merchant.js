document.addEventListener('DOMContentLoaded', async () => {
    // --- CONFIG ---
    const SUPABASE_URL = 'https://hrsbvguvsrdrjcukbdlc.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_kNDUBTOR4sthXqbgMosTjA_aLekCeLz';
    const PLACE_ID = '118648755816733';

    // --- TIMER LOGIC ---
    const WAIT_PERIOD = 45 * 60;    // 45 minutes in seconds
    const EVENT_DURATION = 15 * 60; // 15 minutes in seconds
    const WARNING_PERIOD = 5 * 60;  // 5 minutes warning
    const MAX_PLAYERS = 8;
    const JOINED_SERVER_GRACE_PERIOD = 45 * 60 * 1000; // 45 minutes in milliseconds
    const CYCLE_DURATION = WAIT_PERIOD + EVENT_DURATION; // 60 minutes total

    // --- STATE ---
    let serverData = [];
    let sortMode = 'soonest';
    let filterMode = 'all';
    let joinedServers = new Map();

    // --- UI ELEMENTS ---
    const loadingContainer = document.getElementById('loading-container');
    const serverListContainer = document.getElementById('server-list-container');
    const errorContainer = document.getElementById('error-container');
    const sortSelect = document.getElementById('sort-select');
    const filterButtonsContainer = document.getElementById('filter-buttons');
    const joinByIdInput = document.getElementById('join-by-id-input');
    const joinByIdBtn = document.getElementById('join-by-id-btn');

    const { createClient } = window.supabase;
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

    // --- ROBLOX-STYLE GAME LAUNCH FUNCTIONS ---

    /**
     * Roblox-style game launching function
     * This mimics how Roblox.com handles game launches
     */
    function launchRobloxGame(placeId, gameInstanceId = null) {
        // Build the Roblox protocol URL
        let robloxUrl;
        if (gameInstanceId) {
            // Join specific server
            robloxUrl = `roblox://placeId=${placeId}&gameInstanceId=${gameInstanceId}`;
        } else {
            // Join any server
            robloxUrl = `roblox://placeId=${placeId}`;
        }

        // Method 1: Roblox's primary approach - create invisible link and click it
        // This is the most compatible method across browsers
        const link = document.createElement('a');
        link.href = robloxUrl;
        link.style.display = 'none';
        document.body.appendChild(link);

        try {
            link.click();
            // Clean up after a short delay
            setTimeout(() => {
                if (link.parentNode) {
                    link.parentNode.removeChild(link);
                }
            }, 1000);
            return true;
        } catch (error) {
            console.error('Failed to launch via link click:', error);
            // Fallback to window.location.href
            try {
                window.location.href = robloxUrl;
                return true;
            } catch (fallbackError) {
                console.error('Failed to launch via window.location:', fallbackError);
                return false;
            }
        }
    }

    /**
     * Alternative method that some third-party sites use
     * Opens in a new tab/window to preserve the current page
     */
    function launchRobloxGameNewTab(placeId, gameInstanceId = null) {
        let robloxUrl;
        if (gameInstanceId) {
            robloxUrl = `roblox://placeId=${placeId}&gameInstanceId=${gameInstanceId}`;
        } else {
            robloxUrl = `roblox://placeId=${placeId}`;
        }

        // Try to open in new tab first
        const newTab = window.open(robloxUrl, '_blank');

        // If blocked by popup blocker, fall back to current tab
        if (!newTab || newTab.closed || typeof newTab.closed == 'undefined') {
            console.log('Popup blocked, falling back to current tab');
            return launchRobloxGame(placeId, gameInstanceId);
        }

        // Close the new tab after a short delay (it's just used to trigger the protocol)
        setTimeout(() => {
            if (newTab && !newTab.closed) {
                newTab.close();
            }
        }, 2000);

        return true;
    }

    /**
     * Enhanced launch function with user feedback and error handling
     */
    function safeLaunchRobloxGame(placeId, gameInstanceId = null, serverDisplayName = '') {
        const displayName = serverDisplayName || (gameInstanceId ? gameInstanceId.substring(0, 8) + '...' : 'Random Server');

        // Show loading state
        toast(`Launching Roblox... Joining ${displayName}`);

        // Detect browser for optimal launch method
        const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
        const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);

        let success = false;

        // Use different methods based on browser
        if (isChrome) {
            // Chrome works best with the link click method (Roblox's preferred method)
            success = launchRobloxGame(placeId, gameInstanceId);
        } else if (isFirefox) {
            // Firefox sometimes works better with window.open
            success = launchRobloxGameNewTab(placeId, gameInstanceId);
        } else {
            // For other browsers, try the standard method
            success = launchRobloxGame(placeId, gameInstanceId);
        }

        if (success) {
            // Show success message after a delay
            setTimeout(() => {
                toast(`✓ Roblox should be launching. If it doesn't open, make sure Roblox is installed.`);
            }, 1500);
        } else {
            toast(`❌ Failed to launch Roblox. Please make sure Roblox is installed and try again.`);
        }

        return success;
    }

    // --- EVENT LISTENERS ---
    sortSelect?.addEventListener('change', (e) => { sortMode = e.target.value; updateAndRender(); });
    filterButtonsContainer?.addEventListener('click', (e) => {
        const button = e.target.closest('.chip');
        if (!button) return;
        filterMode = button.dataset.filter;
        filterButtonsContainer.querySelectorAll('.chip').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        updateAndRender();
    });
    joinByIdBtn?.addEventListener('click', joinById);
    joinByIdInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinById();
    });

    // --- MAIN EXECUTION ---
    loadJoinedServers();
    await fetchData();
    initializeCustomSelects();
    setInterval(updateAndRender, 1000);
    setInterval(fetchData, 30 * 1000);

    // --- FUNCTIONS ---
    function joinById() {
        const serverId = joinByIdInput.value.trim();
        if (serverId.length < 36) {
            toast('Invalid Server ID format.');
            return;
        }

        // Use the enhanced Roblox-style launch function
        const success = safeLaunchRobloxGame(PLACE_ID, serverId, `Server ${serverId.substring(0, 8)}`);

        if (success) {
            joinByIdInput.value = '';
        }
    }

    async function fetchData() {
        try {
            // Only fetch servers that are:
            // 1. Currently active (not inactive/dead)
            // 2. Fresh data (seen in last scraper run - cycles_since_seen = 0)
            const { data, error } = await sb
                .from('servers')
                .select('*')
                .eq('status', 'active')
                .eq('cycles_since_seen', 0);

            if (error) throw error;

            // Additional safety filters on the client side
            serverData = (data || [])
                .filter(s => s.status === 'active') // Double-check status
                .filter(s => s.cycles_since_seen === 0) // Double-check freshness
                .filter(s => s.player_count < MAX_PLAYERS) // Not full
                .filter(s => s.player_count >= 0); // Valid player count

            console.log(`Fetched ${serverData.length} valid servers`);

            loadingContainer.style.display = 'none';
            serverListContainer.style.display = 'flex';
            errorContainer.style.display = 'none';
            updateAndRender();
        } catch (err) {
            console.error('Error fetching data:', err);
            showError(`Failed to fetch server data: ${err.message}. Ensure RLS is enabled.`);
        }
    }

    function getEventStatus(server) {
        const now = Date.now();
        const firstSeenTime = new Date(server.first_seen).getTime();

        // Use raw server age directly - scraper is accurate
        const serverAge = (now - firstSeenTime) / 1000;

        let status = {
            age: serverAge,
            rawAge: serverAge,
            cycles_since_seen: server.cycles_since_seen
        };

        if (serverAge < WAIT_PERIOD) {
            // Server is less than 45 minutes old - no event yet
            status.phase = 'far';
            status.timeLabel = 'Arrives In:';
            status.timeRemaining = WAIT_PERIOD - serverAge;
        } else {
            // Server is 45+ minutes old
            // The 45min timer continues running even during the 15min event
            const continuousTimer = serverAge % WAIT_PERIOD; // Position in the continuous 45min cycle
            const timeUntilNextEvent = WAIT_PERIOD - continuousTimer;

            // Check if we're currently in an event period
            const timeSinceFirstEvent = serverAge - WAIT_PERIOD;
            const isInEventPeriod = timeSinceFirstEvent >= 0 && (timeSinceFirstEvent % WAIT_PERIOD) < EVENT_DURATION;

            if (isInEventPeriod) {
                // Event is currently active
                const timeInCurrentEvent = timeSinceFirstEvent % WAIT_PERIOD;
                status.phase = 'active';
                status.timeLabel = 'Leaves In:';
                status.timeRemaining = EVENT_DURATION - timeInCurrentEvent;
            } else {
                // Waiting for next event
                status.phase = timeUntilNextEvent <= WARNING_PERIOD ? 'starting_soon' : 'far';
                status.timeLabel = 'Arrives In:';
                status.timeRemaining = timeUntilNextEvent;
            }

            // Debug logging
            console.log(`Debug - Age: ${Math.floor(serverAge/60)}min, ContinuousTimer: ${Math.floor(continuousTimer/60)}min, TimeUntilNext: ${Math.floor(timeUntilNextEvent/60)}min, InEvent: ${isInEventPeriod}`);
        }

        // Add timing confidence indicator
        status.confidence = calculateTimingConfidence(server, status);

        return { ...server, ...status };
    }

    function calculateTimingConfidence(server, status) {
        // High confidence: Fresh server with reasonable player count for age
        // Medium confidence: Older server or unusual player count
        // Low confidence: Very high player count for young server (might have existed before detection)

        const ageMinutes = status.rawAge / 60;
        const playersPerMinute = server.player_count / Math.max(ageMinutes, 1);

        if (server.cycles_since_seen > 0) return 'low'; // Stale data
        if (ageMinutes < 10 && playersPerMinute > 1) return 'medium'; // Fast growth might indicate pre-existing server
        if (ageMinutes < 5 && server.player_count > 6) return 'low'; // Too many players for very young server

        return 'high';
    }

    function updateAndRender() {
        if (!serverData.length) return;

        let processed = serverData.map(getEventStatus);

        // Clean up joined servers list
        const serversToDelete = [];
        joinedServers.forEach((data, serverId) => {
            const currentServer = processed.find(s => s.server_id === serverId);
            const timeSinceJoined = Date.now() - data.joinedAt;

            if (!currentServer || timeSinceJoined > JOINED_SERVER_GRACE_PERIOD) {
                serversToDelete.push(serverId);
            }
        });

        if (serversToDelete.length > 0) {
            serversToDelete.forEach(serverId => joinedServers.delete(serverId));
            saveJoinedServers();
        }

        // Add joined status to processed servers
        processed = processed.map(server => ({
            ...server,
            joinedAt: joinedServers.get(server.server_id)?.joinedAt || 0
        }));

        // Apply filters
        let displayList;
        if (filterMode === 'joined') {
            displayList = processed.filter(s => joinedServers.has(s.server_id));
        } else if (filterMode !== 'all') {
            displayList = processed.filter(s => s.phase === filterMode && !joinedServers.has(s.server_id));
        } else {
            displayList = processed.filter(s => !joinedServers.has(s.server_id));
        }

        // Apply sorting
        displayList.sort((a, b) => {
            switch (sortMode) {
                case 'oldest': return b.age - a.age;
                case 'newest': return a.age - b.age;
                case 'player_high': return b.player_count - a.player_count;
                case 'player_low': return a.player_count - b.player_count;
                case 'join_order':
                    if (filterMode !== 'joined') return 0;
                    return b.joinedAt - a.joinedAt;
                case 'furthest':
                    if (a.phase !== 'active' && b.phase === 'active') return -1;
                    if (a.phase === 'active' && b.phase !== 'active') return 1;
                    return b.timeRemaining - a.timeRemaining;
                case 'soonest':
                default:
                    if (a.phase === 'active' && b.phase !== 'active') return -1;
                    if (a.phase !== 'active' && b.phase === 'active') return 1;
                    return a.timeRemaining - b.timeRemaining;
            }
        });

        renderStats(processed);
        renderServers(displayList, filterMode === 'joined');
    }

    function renderStats(allServers) {
        document.getElementById('total-players').textContent = allServers.reduce((sum, s) => sum + s.player_count, 0).toLocaleString();
        document.getElementById('active-merchants').textContent = allServers.filter(s => s.phase === 'active').length;
        document.getElementById('soon-merchants').textContent = allServers.filter(s => s.phase === 'starting_soon').length;
        document.getElementById('total-servers').textContent = allServers.length;
    }

    function renderServers(servers, isJoinedList) {
        serverListContainer.innerHTML = '';
        if (servers.length === 0) {
            serverListContainer.innerHTML = `<div class="info-box" style="width:100%; text-align:center;">No servers match the current filter.</div>`;
            return;
        }
        servers.forEach(server => serverListContainer.appendChild(createServerCard(server, isJoinedList)));

        document.querySelectorAll('.join-btn').forEach(btn => btn.addEventListener('click', handleJoinClick));
        document.querySelectorAll('.return-btn').forEach(btn => btn.addEventListener('click', handleReturnClick));
        document.querySelectorAll('.copy-id-icon-btn').forEach(el => el.addEventListener('click', handleCopyId));
    }

    function createServerCard(server, isJoined) {
        const card = document.createElement('div');
        card.className = `server-card status-${server.phase} confidence-${server.confidence}`;
        card.id = `server-${server.server_id}`;

        // Add confidence indicator for timing accuracy
        let confidenceHTML = '';
        if (server.confidence === 'medium') {
            confidenceHTML = `<span class="info-item warning-info" title="Timing might be slightly inaccurate">
                <svg viewBox="0 0 24 24" width="12" height="12"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>~
            </span>`;
        } else if (server.confidence === 'low') {
            confidenceHTML = `<span class="info-item error-info" title="Timing may be inaccurate - server might be older than displayed">
                <svg viewBox="0 0 24 24" width="12" height="12"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>?
            </span>`;
        }

        const joinButtonHTML = `<button class="btn btn-success join-btn" data-server-id="${server.server_id}">Join</button>`;
        const returnButtonHTML = isJoined ? `<button class="btn btn-warning return-btn" data-server-id="${server.server_id}">Return</button>` : '';

        const copyElementHTML = `
            <div class="server-id-container">
                <span title="${server.server_id}">ID: ${server.server_id}</span>
                <button class="copy-id-icon-btn" title="Copy Server ID" data-server-id="${server.server_id}">
                    <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                </button>
            </div>`;

        card.innerHTML = `
            <div class="server-card-main">
                <div class="status-dot"></div>
                <div class="server-details">
                    <div class="server-info">
                        <span class="info-item" title="Player Count">${server.player_count}/${MAX_PLAYERS} Players</span>
                        <span class="info-item" title="Event Timer">${server.timeLabel} ${formatTime(server.timeRemaining)}</span>
                        ${confidenceHTML}
                    </div>
                    <div class="server-meta-info">
                        <span>Age: ${formatAge(server.rawAge)} ${server.rawAge !== server.age ? '(~' + formatAge(server.age) + ')' : ''}</span>
                        ${copyElementHTML}
                    </div>
                </div>
            </div>
            <div class="server-actions">
                ${joinButtonHTML}
                ${returnButtonHTML}
            </div>`;
        return card;
    }

    function handleJoinClick(e) {
        const serverId = e.target.dataset.serverId;
        const server = serverData.find(s => s.server_id === serverId);
        if (!server) return;

        const card = document.getElementById(`server-${serverId}`);
        card?.classList.add('highlighted');
        setTimeout(() => card?.classList.remove('highlighted'), 5000);

        joinedServers.set(serverId, {
            phase: getEventStatus(server).phase,
            joinedAt: Date.now()
        });
        saveJoinedServers();

        // Use the enhanced Roblox-style launch function
        safeLaunchRobloxGame(PLACE_ID, serverId, `Server ${serverId.substring(0, 8)}`);
        updateAndRender();
    }

    function handleReturnClick(e) {
        joinedServers.delete(e.target.dataset.serverId);
        saveJoinedServers();
        updateAndRender();
    }

    function handleCopyId(e) {
        const serverId = e.currentTarget.dataset.serverId;
        navigator.clipboard.writeText(serverId).then(() => {
            toast(`Copied Server ID: ${serverId.substring(0, 8)}...`);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            toast('Failed to copy ID.');
        });
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
        const minutes = Math.floor(Math.abs(s) / 60);
        const seconds = Math.floor(Math.abs(s) % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function formatAge(s) {
        const hours = Math.floor(s / 3600);
        const minutes = Math.floor((s % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }

    // Initialize custom selects if the function exists
    function initializeCustomSelects() {
        // This function should be defined elsewhere in your code
        if (typeof window.initializeCustomSelects === 'function') {
            window.initializeCustomSelects();
        }
    }

    // Toast notification function
    function toast(message) {
        // This function should be defined elsewhere in your code
        if (typeof window.toast === 'function') {
            window.toast(message);
        } else {
            console.log('Toast:', message);
        }
    }
});
