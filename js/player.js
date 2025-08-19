let setupConfig;
document.addEventListener('DOMContentLoaded', () => {
    const expandSvg = `<svg fill="currentColor" version="1.1" xmlns="http://www.w3.org/2000/svg" width="22px" height="22px" viewBox="0 0 100 100"><g><path d="M22.661,20.5H36c1.104,0,2-0.896,2-2s-0.896-2-2-2H19c-1.104,0-2.5,1.276-2.5,2.381v17c0,1.104,0.896,2,2,2s2-0.896,2-2V24.876l16.042,15.791c0.391,0.391,1.027,0.586,1.539,0.586s1.086-0.195,1.477-0.586c0.781-0.781,0.812-2.237,0.031-3.019L22.661,20.5z"/><path d="M83,16.5H66c-1.104,0-2,0.896,2,2s0.896,2,2,2h12.605L61.647,37.648c-0.781,0.781-0.781,2.142,0,2.923c0.39,0.391,0.902,0.633,1.414,0.633s0.774-0.171,1.164-0.562l16.274-16.5v11.738c0,1.104,0.896,2,2,2s2-0.896,2-2v-17C84.5,17.776,84.104,16.5,83,16.5z"/><path d="M36.542,60.962L20.5,76.754V65.881c0-1.104-0.896-2-2-2s-2,0.896,2,2v17c0,1.104,1.396,1.619,2.5,1.619h17c1.104,0,2-0.896,2-2s-0.896-2-2-2H22.529L39.62,63.6c0.781-0.781,0.656-1.951-0.125-2.732C38.715,60.086,37.322,60.181,36.542,60.962z"/><path d="M82.5,63.881c-1.104,0-2,0.896-2,2v11.606L64.226,60.962c-0.78-0.781-1.923-0.781-2.703,0c-0.781,0.781-0.719,1.856,0.062,2.638l17.152,16.9H66c-1.104,0-2,0.896-2,2s0.896,2,2,2h17c1.104,0,1.5-0.515,1.5-1.619v-17C84.5,64.776,83.604,63.881,82.5,63.881z"/></g></svg>`;
    const MAX_RETRIES = 5;
    const RETRY_DELAY_MS = 1500; 

    const elements = {
        video: document.getElementById('video'), playerContainer: document.getElementById('player-container'), videoWrapper: document.getElementById('video-wrapper'),
        centerControls: document.getElementById('center-controls'), bottomControls: document.getElementById('bottom-controls-container'), 
        playPauseBtn: document.getElementById('play-pause-btn'), playPauseCenterBtn: document.getElementById('play-pause-center-btn'),
        muteBtn: document.getElementById('mute-btn'), pipBtn: document.getElementById('pip-btn'), expandBtn: document.getElementById('expand-btn'),
        fullscreenBtn: document.getElementById('fullscreen-btn'),
        liveIndicator: document.getElementById('live-indicator'), progressPlayed: document.querySelector('.progress-played'),
        progressBarContainer: document.querySelector('.progress-bar-container'),
        qualityBtn: document.getElementById('quality-btn'), audioBtn: document.getElementById('audio-btn'),
        qualityPopup: document.getElementById('quality-popup'), audioPopup: document.getElementById('audio-popup'),
        loadingSpinner: document.getElementById('loading-spinner'), errorOverlay: document.getElementById('error-overlay'), 
        errorTitle: document.getElementById('error-title'), errorMessage: document.getElementById('error-message'),
    };

    let controlsTimeout, clickTimer, expandModeIndex = 0;
    const expandModes = ['contain', 'cover', 'fill'];
    
    elements.expandBtn.innerHTML = expandSvg;
    feather.replace();
    const player = new shaka.Player(elements.video);

    player.configure({
        manifest: { dash: { ignoreMinBufferTime: true } },
        streaming: { rebufferingGoal: 2, bufferingGoal: 10, alwaysStreamText: true },
        abr: { defaultBandwidthEstimate: 3000000, enabled: true }
    });

    async function initializeApp() {
        elements.loadingSpinner.style.display = 'flex';
        console.log("setupConfig",setupConfig);
        const streamInfoUrl = setupConfig.file;
	    const manualDrmKeys = setupConfig.drm;

        const clearKeys = {};
        for (const keyId in manualDrmKeys) {
            if (manualDrmKeys.hasOwnProperty(keyId)) {
                clearKeys[keyId] = manualDrmKeys[keyId];
            }
        }
        
        player.configure({
            drm: { clearKeys: clearKeys }
        });

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                console.log(`[INFO] Attempt ${attempt}: Fetching stream info from: ${streamInfoUrl}`);
                const response = await fetch(streamInfoUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch stream info: HTTP status ${response.status}`);
                }
                const streamData = await response.json();
                
                const finalStreamUrl = streamData.channelUrl;

                if (!finalStreamUrl || !finalStreamUrl.startsWith('http')) {
                    throw new Error("No valid stream URL (channelUrl) found in the response.");
                }
                  if (Object.keys(clearKeys).length === 0) {
                      console.warn("[WARN] No DRM keys provided. Attempting to play without encryption.");
                  }
                
                console.log(`[INFO] Attempt ${attempt}: Loading stream from: ${finalStreamUrl}`);
                await player.load(finalStreamUrl);
                
                console.log('[SUCCESS] Stream loaded successfully.');
                elements.loadingSpinner.style.display = 'none';
                showControls();
                return;

            } catch (error) {
                console.warn(`[WARN] Attempt ${attempt} failed:`, error.message || error);
                if (attempt === MAX_RETRIES) {
                    console.error('[FATAL] All retry attempts failed.', error);
                    showError('فشل تحميل البث', `لم نتمكن من تشغيل البث بعد ${MAX_RETRIES} محاولات. تأكد من أنك تشغل الصفحة من سيرفر محلي.`);
                    return;
                }
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
        }
    }
    
    function showError(title, message) {
        elements.loadingSpinner.style.display = 'none';
        elements.errorTitle.textContent = title;
        elements.errorMessage.textContent = message;
        elements.errorOverlay.style.display = 'flex';
        feather.replace();
    }
    
    const showControls = () => {[elements.bottomControls, elements.centerControls].forEach(el => el.classList.add('visible')); clearTimeout(controlsTimeout); if (!elements.video.paused) { controlsTimeout = setTimeout(hideControls, 3000); }};
    const hideControls = () => {if (document.fullscreenElement && elements.video.paused) return; [elements.bottomControls, elements.centerControls].forEach(el => el.classList.remove('visible')); [elements.qualityPopup, elements.audioPopup].forEach(p => p.style.display = 'none');};
    const togglePlay = () => elements.video.paused ? elements.video.play() : elements.video.pause();
    const updatePlayButton = () => {const icon = elements.video.paused ? 'play' : 'pause'; elements.playPauseBtn.innerHTML = `<i data-feather="${icon}"></i>`; elements.playPauseCenterBtn.innerHTML = `<i data-feather="${icon}"></i>`; feather.replace();};
    async function toggleFullscreen() {if (!document.fullscreenElement) {await elements.playerContainer.requestFullscreen();} else {await document.exitFullscreen();}}
    function updateFullscreenIcon() {elements.fullscreenBtn.innerHTML = `<i data-feather="${document.fullscreenElement ? 'minimize' : 'maximize'}"></i>`; feather.replace();}
    
    const togglePopup = (button, popup, populator) => {
        const otherPopups = [elements.qualityPopup, elements.audioPopup].filter(p => p !== popup);
        otherPopups.forEach(p => p.style.display = 'none');

        if (popup.style.display === 'block') {
            popup.style.display = 'none';
        } else {
            if(populator) populator();

            const containerRect = elements.playerContainer.getBoundingClientRect();
            const buttonRect = button.getBoundingClientRect();
            const popupWidth = popup.offsetWidth || 200;

            const buttonCenter = (buttonRect.left - containerRect.left) + (buttonRect.width / 2);
            let popupLeft = buttonCenter - (popupWidth / 2);

            if (popupLeft < 10) {
                popupLeft = 10;
            }
            if (popupLeft + popupWidth > containerRect.width - 10) {
                popupLeft = containerRect.width - popupWidth - 10;
            }

            popup.style.left = `${popupLeft}px`;
            popup.style.display = 'block';
        }
    };

    const formatTime = (timeInSeconds) => {if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00'; const date = new Date(null); date.setSeconds(timeInSeconds); const isoString = date.toISOString(); return timeInSeconds >= 3600 ? isoString.substr(11, 8) : isoString.substr(14, 5);};
    const populateQualityMenu = () => {const list = document.getElementById('quality-list'); list.innerHTML = ''; const isAbrEnabled = player.getConfiguration().abr.enabled, tracks = player.getVariantTracks(), activeTrack = tracks.find(t => t.active); const auto = document.createElement('li'); auto.className = `menu-item ${isAbrEnabled ? 'active' : ''}`; auto.textContent = 'تلقائي'; auto.onclick = () => { player.configure('abr.enabled', true); togglePopup(elements.qualityBtn, elements.qualityPopup); }; list.appendChild(auto); [...new Set(tracks.map(t => t.height))].filter(Boolean).sort((a,b)=>b-a).forEach(h => {const trackForHeight = tracks.find(t => t.height === h); const item = document.createElement('li'); item.className = `menu-item ${!isAbrEnabled && activeTrack && activeTrack.height === h ? 'active' : ''}`; item.textContent = `${h}p`; item.onclick = () => { player.configure('abr.enabled', false); player.selectVariantTrack(trackForHeight, true); togglePopup(elements.qualityBtn, elements.qualityPopup); }; list.appendChild(item);});};
    const populateAudioMenu = () => {const list = document.getElementById('audio-list'); list.innerHTML = ''; const audioTracks = player.getAudioLanguagesAndRoles(), currentAudioLang = player.getAudioLanguages()[0]; audioTracks.forEach(track => {const item = document.createElement('li'); item.className = `menu-item ${track.language === currentAudioLang ? 'active' : ''}`; item.textContent = track.label || track.language; item.onclick = () => { player.selectAudioLanguage(track.language, track.role); togglePopup(elements.audioBtn, elements.audioPopup); }; list.appendChild(item);});};
    elements.videoWrapper.addEventListener('click', (e) => { if(e.target !== elements.videoWrapper) return; clearTimeout(clickTimer); clickTimer = setTimeout(() => { elements.bottomControls.classList.contains('visible') ? hideControls() : showControls(); }, 200); });
    elements.videoWrapper.addEventListener('dblclick', async (e) => { if(e.target !== elements.videoWrapper) return; clearTimeout(clickTimer); await toggleFullscreen(); });
    elements.playerContainer.addEventListener('mousemove', showControls);
    elements.playPauseBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });
    elements.playPauseCenterBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePlay(); });
    document.getElementById('seek-forward-center-btn').addEventListener('click', (e) => { e.stopPropagation(); elements.video.currentTime -= 10; });
    document.getElementById('seek-backward-center-btn').addEventListener('click', (e) => { e.stopPropagation(); elements.video.currentTime += 10; });
    elements.muteBtn.addEventListener('click', (e) => { e.stopPropagation(); elements.video.muted = !elements.video.muted; });
    elements.pipBtn.addEventListener('click', (e) => { e.stopPropagation(); document.pictureInPictureElement ? document.exitPictureInPicture() : elements.video.requestPictureInPicture(); });
    elements.expandBtn.addEventListener('click', (e) => { e.stopPropagation(); expandModeIndex = (expandModeIndex + 1) % expandModes.length; elements.video.style.objectFit = expandModes[expandModeIndex]; });
    elements.fullscreenBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFullscreen(); });
    document.addEventListener('fullscreenchange', updateFullscreenIcon);
    elements.video.addEventListener('play', () => { updatePlayButton(); showControls(); });
    elements.video.addEventListener('pause', () => { updatePlayButton(); showControls(); });
    elements.video.addEventListener('volumechange', () => { elements.muteBtn.innerHTML = `<i data-feather="${elements.video.muted || elements.video.volume === 0 ? 'volume-x' : 'volume-2'}"></i>`; feather.replace(); });
    
    // ★★★ تم حل مشكلة ظهور النقطة كرموز عن طريق استخدام كود HTML الخاص بها
    elements.video.addEventListener('timeupdate', () => {
        const range = player.seekRange(); 
        if (!isFinite(range.end)) return; 
        if (player.isLive()) {
            elements.liveIndicator.style.display = 'inline-block'; 
            const isBehind = elements.video.paused || (range.end - elements.video.currentTime) > 15; 
            elements.liveIndicator.className = isBehind ? 'is-not-live' : 'is-live'; 
            // استخدام innerHTML مع كود النقطة لضمان العرض الصحيح
            elements.liveIndicator.innerHTML = isBehind ? '&#9679; متأخر' : '&#9679; مباشر'; 
        } else if (range.end > 0) {
            elements.liveIndicator.style.display = 'inline-block'; 
            elements.liveIndicator.className = ''; 
            elements.liveIndicator.style.backgroundColor = 'transparent'; 
            elements.liveIndicator.style.cursor = 'default'; 
            elements.liveIndicator.innerHTML = `${formatTime(elements.video.currentTime)} / ${formatTime(range.end)}`; 
            elements.progressPlayed.style.width = `${((elements.video.currentTime - range.start) / (range.end - range.start)) * 100}%`;
        } else {
            elements.liveIndicator.style.display = 'none';
        }
    });

    elements.progressBarContainer.addEventListener('click', (e) => { if (player.isLive()) return; const rect = elements.progressBarContainer.getBoundingClientRect(); elements.video.currentTime = player.seekRange().start + ((e.clientX - rect.left) / rect.width) * (player.seekRange().end - player.seekRange().start); });
    elements.liveIndicator.addEventListener('click', (e) => { e.stopPropagation(); if (elements.liveIndicator.classList.contains('is-not-live') && player.isLive()) elements.video.currentTime = player.seekRange().end; });
    
    elements.qualityBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePopup(e.currentTarget, elements.qualityPopup, populateQualityMenu); });
    elements.audioBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePopup(e.currentTarget, elements.audioPopup, populateAudioMenu); });
    
    player.addEventListener('error', (event) => { showError('حدث خطأ في المشغل', `فشل تشغيل البث. (${event.detail.message})`); });
    player.addEventListener('trackschanged', () => { populateQualityMenu(); populateAudioMenu(); });
    player.addEventListener('buffering', e => { elements.loadingSpinner.style.display = e.buffering ? 'flex' : 'none'; });
    
window.addEventListener('message', (event) => {
    setupConfig = event.data;
    initializeApp();
});
});
