document.addEventListener("DOMContentLoaded", () => {
  loadAllData();
});
function loadAllData() {
  setTimeout(() => fetchTransfers(), 100);
  setTimeout(() => fetchVideos(), 500);
  setTimeout(() => fetchTournaments(), 1000);
  setTimeout(() => fetchNews(), 1500);
}
function getUserTimeZoneOffset() {
    const offsetMinutes = new Date().getTimezoneOffset(); 
    const absMinutes = Math.abs(offsetMinutes);
    const hours = String(Math.floor(absMinutes / 60)).padStart(2, '0');
    const minutes = String(absMinutes % 60).padStart(2, '0');
    const sign = offsetMinutes <= 0 ? '+' : '-';
    return encodeURIComponent(`${sign}${hours}:${minutes}`);
}
const userTimeZone = getUserTimeZoneOffset();
// FINAL STABLE VERSION - PART 1 of 4
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc, collection, getDocs, addDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- CONFIG & GLOBAL VARS ---
const firebaseConfig = {
    apiKey: "AIzaSyB6ACvhgth3VXhoJJnNOZfIQBpXlTVWcGE",
    authDomain: "website-f388d.firebaseapp.com",
    projectId: "website-f388d",
    storageBucket: "website-f388d.appspot.com",
    messagingSenderId: "531820596793",
    appId: "1:531820596793:web:37dbfd0b9a3c7a3a0cc7e8",
    measurementId: "G-75KT28HL7H"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const ADMIN_PASSWORD = "Vbnb123@";
let allMatchesData = [];
let currentDate = new Date();
let allTournamentsData = [];
let longPressTimer;
let currentMatchDetailsCache = null;

// NEW: State for pagination
let allNewsData = [];
let newsCurrentPage = 1;
let allVideosData = [];
let videosCurrentPage = 1;

// --- DOM ELEMENT SELECTORS ---
const mainNav = document.getElementById('main-nav');
const views = document.querySelectorAll('.view');
const matchesContainer = document.getElementById('matches-container');
const matchesLoadingSpinner = document.getElementById('matches-loading-spinner');
const datePicker = document.getElementById('datePicker');
const todayBtn = document.getElementById('todayBtn');
const yesterdayBtn = document.getElementById('yesterdayBtn');
const tomorrowBtn = document.getElementById('tomorrowBtn');
const matchDetailsView = document.getElementById('match-details-view');
const backToMatchesBtn = document.getElementById('backToMatchesBtn');
const detailsTabsContainer = document.getElementById('details-tabs-container');
const modalMatchCard = document.getElementById('modalMatchCard');
const tabContentContainer = document.getElementById('tab-content-container');
const detailsTabsDrawerBtn = document.getElementById('details-tabs-drawer-btn');
const activeTabTitle = document.getElementById('active-tab-title');
const detailsTabsMenu = document.getElementById('details-tabs-menu');
const newsContainer = document.getElementById('news-container');
const newsLoadingSpinner = document.getElementById('news-loading-spinner');
const newsLoadMoreContainer = document.getElementById('news-load-more-container');
const videosContainer = document.getElementById('videos-container');
const videosLoadingSpinner = document.getElementById('videos-loading-spinner');
const videosLoadMoreContainer = document.getElementById('videos-load-more-container');
const videoPlayerModal = document.getElementById('videoPlayerModal');
const videoPlayerIframe = document.getElementById('videoPlayerIframe');
const tournamentsLoadingSpinner = document.getElementById('tournaments-loading-spinner');
const tournamentsGridContainer = document.getElementById('tournaments-grid-container');
const standingsDisplayContainer = document.getElementById('standings-display-container');
const tournamentsGrid = document.getElementById('tournaments-grid');
const transfersContainer = document.getElementById('transfers-container');
const transfersLoadingSpinner = document.getElementById('transfers-loading-spinner');
const drawerToggle = document.getElementById('drawer-toggle');
const adminModal = document.getElementById('adminModal');
const adminPasswordSection = document.getElementById('admin-password-section');
const adminContentSection = document.getElementById('admin-content-section');
const addStreamForm = document.getElementById('add-stream-form');
const streamTypeSelect = document.getElementById('stream-type');
const drmFields = document.getElementById('drm-fields');
const currentStreamsList = document.getElementById('current-streams-list');
const formTitle = document.getElementById('form-title');
const saveStreamBtn = document.getElementById('save-stream-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const newsArticleView = document.getElementById('news-article-view');
const newsArticleContent = document.getElementById('news-article-content');
const backToNewsBtn = document.getElementById('backToNewsBtn');

// --- RENDER & DISPLAY FUNCTIONS ---
function displayMatches(matches) {
    if (!matches || matches.length === 0) {
        matchesContainer.innerHTML = `<p style="text-align:center;">لا توجد مباريات في هذا اليوم.</p>`;
        return;
    }
    const matchesByCup = matches.reduce((acc, match) => {
        (acc[match['Cup-id']] = acc[match['Cup-id']] || {
            cupInfo: match,
            matches: []
        }).matches.push(match);
        return acc;
    }, {});
    matchesContainer.innerHTML = Object.values(matchesByCup).map(cupData => `
        <div class="match-card bg-gray-200 dark:bg-gray-900">
            <div class="cup-header bg-gray-200 dark:bg-gray-900"><img src="${cupData.cupInfo['Cup-Logo']}" alt="" class="cup-logo"><h2 class="cup-name">${cupData.cupInfo['Cup-Name']}</h2></div>
            ${cupData.matches.map(match => {
              function convertTo24Hour(timeStr) {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'م' && hours < 12) hours += 12;
        if (modifier === 'ص' && hours === 12) hours = 0;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }

      const datePart = match['match_date_time'].split(' ')[0];
      const timePart = convertTo24Hour(match['Match-Start-Time']);
      const fullDateTime = `${datePart}T${timePart}:00+02:00`;
      const localTime = new Date(fullDateTime);
      const localTimeString = localTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
                const detailsContent = (match['Match-Status'] === 'لم تبدأ' || match['Match-Status'] === 'تأجلت') ?
                     `<div class="match-time">${localTimeString}</div>`
    : `<div class="match-result">${match['Team-Left']['Goal']} - ${match['Team-Right']['Goal']}</div>`;
                let statusClass = 'status-not-started';
                if (match['Match-Status'] === 'انتهت' || match['Match-Status'] === 'بعد الوقت الإضافي' || match['Match-Status'] === 'بعد ركلات الترجيح' || match['Match-Status'] === 'انتهت للتو' ) statusClass = 'status-finished';
                else if (match['Match-Status'] === 'تأجلت') statusClass = 'status-postponed';
                else if (match['Match-Status'] !== 'لم تبدأ') statusClass = 'status-live';
                return `  <div class="match-body bg-gray-200 dark:bg-gray-900 mb-1 mt-1" data-match-id="${match['Match-id']}">
    <div class="match-part part-logo bg-gray-100 dark:bg-gray-700">
      <img src="${match['Team-Left']['Logo']}" alt="${match['Team-Left']['Name']}" class="match-logo" />
    </div>
    <div class="match-part part-name text-gray-800 dark:text-gray-100">
      <span class="team-name">${match['Team-Left']['Name']}</span>
    </div>
    <div class="match-part part-center ${statusClass}">
      ${detailsContent}
      <span class="match-status">${match['Match-Status']}</span>
    </div>
    <div class="match-part part-name text-gray-800 dark:text-gray-100">
      <span class="team-name">${match['Team-Right']['Name']}</span>
    </div>
    <div class="match-part part-logo bg-gray-100 dark:bg-gray-700">
      <img src=" ${match['Team-Right']['Logo']}" alt="${match['Team-Right']['Name']}" class="match-logo" />
    </div>
  </div>`;
            }).join('')}
        </div>`).join('');
}
function createMatchCard(match) {
  const isNotStarted = match['Match-Status'] === 'لم تبدأ' || match['Match-Status'] === 'تأجلت';
  const statusClass = match['Match-Status'] === 'انتهت للتو' ? 'status-finished'
    : match['Match-Status'] === 'انتهت' ? 'status-finished'
      : match['Match-Status'] === 'بعد الوقت الإضافي' ? 'status-finished'
        : match['Match-Status'] === 'بعد ركلات الترجيح' ? 'status-finished'
          : match['Match-Status'] === 'تأجلت' ? 'status-postponed'
            : match['Match-Status'] === 'لم تبدأ' ? 'status-not-started'
              : 'status-live';

  const matchTimeOrResult = isNotStarted
    ? `<div class="match-time">${new Date(match['Time-Start']).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>`
    : `<div class="match-result">${match['Team-Left']['Goal']} - ${match['Team-Right']['Goal']}</div>`;

  const div = document.createElement("div");
  div.className = "match-card";
  div.innerHTML = `
  <div class="match-body" data-match-id="${match['Match-id']}">
    <div class="match-part part-logo">
      <img src=" ${match['Team-Left']['Logo']}" alt="${match['Team-Left']['Name']}" class="match-logo" />
    </div>
    <div class="match-part part-name">
      <span class="team-name">${match['Team-Left']['Name']}</span>
    </div>
    <div class="match-part part-center ${statusClass}">
      ${matchTimeOrResult}
      <span class="match-status">${match['Match-Status']}</span>
    </div>
    <div class="match-part part-name">
      <span class="team-name">${match['Team-Right']['Name']}</span>
    </div>
    <div class="match-part part-logo">
      <img src=" ${match['Team-Right']['Logo']}" alt="${match['Team-Right']['Name']}" class="match-logo" />
    </div>
  </div>
  `;
  return div;
}
function displayNews() {
    newsContainer.innerHTML = allNewsData.map((item, index) => `<div class="news-card bg-gray-200 dark:bg-gray-900" data-news-index="${index}"><img src="${item.image}" alt="${item.title}" class="news-image"><div class="news-content"><h2 class="news-title">${item.title}</h2><p class="news-summary">${item.sub_link}</p><p class="news-time">${item.time}</p></div></div>`).join('');
}

function displayVideos() {
    videosContainer.innerHTML = allVideosData.map(item => `<div class="video-card bg-gray-200 dark:bg-gray-900" data-m3u8-url="${item.m3u8_url}"><div class="video-thumbnail-wrapper"><img src="${item.imageurl}" alt="${item.title}" class="video-thumbnail"><div class="play-icon"></div></div><div class="video-content"><h2 class="video-title">${item.title}</h2><p class="video-category">${item.category}</p></div></div>`).join('');
}

function displayTournamentsGrid(tournaments) {
    tournamentsGrid.innerHTML = tournaments.map((tour, index) => `<div class="tournament-card bg-gray-200 dark:bg-gray-900" data-index="${index}"><img src="${tour.image}" alt="${tour.title}" class="tournament-card-image"><h3 class="tournament-card-title">${tour.title}</h3></div>`).join('');
}

function displayStandings(tournament) {
    window.scrollTo(0, 0);
    tournamentsGridContainer.style.display = 'none';
    standingsDisplayContainer.style.display = 'block';
    let tablesHTML = '';
    if (!tournament.standings || tournament.standings.length === 0) {
        tablesHTML = "<p style='text-align:center; margin-top: 20px;'>لا يوجد ترتيب لهذه البطولة حاليًا.</p>";
    } else {
        tournament.standings.forEach(group => {
            tablesHTML += `<h3 class="group-title">${group.group_name}</h3><div style="overflow-x:auto;"><table class="standings-table bg-gray-200 dark:bg-gray-900"><thead><tr><th>#</th><th style="text-align:right;">الفريق</th><th>لعب</th><th>ف</th><th>ت</th><th>خ</th><th>له/عليه</th><th>ف.أ</th><th>نقاط</th></tr></thead><tbody>${group.teams.map((team, index) => `<tr><td>${index + 1}</td><td class="team-cell"><img src="${team.logo}" alt="" class="team-logo"><span class="team-name">${team.name.split(/\\n|\\r\n|\r/)[0].trim()}</span></td><td>${team.played}</td><td>${team.win}</td><td>${team.draw}</td><td>${team.lose}</td><td>${team.goals}</td><td>${team.diff}</td><td><strong>${team.points}</strong></td></tr>`).join('')}</tbody></table></div>`;
        });
    }
    standingsDisplayContainer.innerHTML = `<div class="standings-header"><div class="standings-title-info"><img src="${tournament.image}" alt="${tournament.title}" class="standings-logo"><h1 class="standings-title">${tournament.title}</h1></div><button class="back-to-grid-btn">العودة للبطولات</button></div><div id="standings-tables-container">${tablesHTML}</div>`;
    standingsDisplayContainer.querySelector('.back-to-grid-btn').addEventListener('click', () => {
        standingsDisplayContainer.style.display = 'none';
        tournamentsGridContainer.style.display = 'block';
        window.scrollTo(0, 0);
    });
}

function displayTransfers(transfers) {
    if (!transfers || transfers.length === 0) {
        transfersContainer.innerHTML = `<p style="text-align:center;">لا توجد انتقالات حالياً.</p>`;
        return;
    }
    transfersContainer.innerHTML = transfers.map(item => {
        const priceOrType = item.transfer_price ? item.transfer_price : item.transfer_type;
        const badgeClass = item.transfer_type === 'انتقال حر' ? 'free' : '';
        return `
        <div class="transfer-card bg-gray-200 dark:bg-gray-900">
            <div class="transfer-player-section">
                <img src="${item.player_image}" alt="${item.player_name}" class="transfer-player-image">
                <div class="transfer-player-details">
                    <div class="transfer-player-name">${item.player_name}</div>
                    <div class="transfer-player-position">${item.player_position}</div>
                </div>
                <div class="transfer-badge ${badgeClass}">${priceOrType}</div>
            </div>
            <div class="transfer-clubs-section">
                <div class="transfer-club">
                    <img src="${item.to_club_logo}" alt="" class="transfer-club-logo">
                </div>
                <span class="transfer-arrow">&rarr;</span>
                <div class="transfer-club">
                    <img src="${item.from_club_logo}" alt="" class="transfer-club-logo">
                </div>
            </div>
            <div class="transfer-footer">
                عقد حتى: ${item.contract_until}
            </div>
        </div>
    `;
    }).join('');
}

function renderInfo(info, match) {

  const panel = document.getElementById('tab-info');
  if (!info || !match) {
    panel.innerHTML = "<p style='text-align:center;'>التفاصيل غير متاحة.</p>";
    return;
  }

  // تجهيز القنوات والمعلقين
  const channels = [];
  for (let i = 1; i <= 5; i++) {
    const channel = info[`القناة_الناقلة_${i}`] || (i === 1 ? info[`القناة_الناقلة`] : null);
    const commentator = info[`المعلق_${i}`];

    if (channel) {
      const label = commentator ? `${channel} - ${commentator}` : channel;
      channels.push(label);
    }
  }

  // بناء باقي العناصر
  const ignoredKeys = new Set([
    "القناة_الناقلة", "القناة_الناقلة_1", "القناة_الناقلة_2", "القناة_الناقلة_3",
    "المعلق_1", "المعلق_2", "المعلق_3"
  ]);

  const otherInfo = Object.entries(info)
    .filter(([key]) => !ignoredKeys.has(key))
    .map(([key, value]) => {
      const label = key.replace(/_/g, ' ');
      return `
        <div class="info-item flex">
          <span class="info-label font-semibold text-gray-700 dark:text-gray-300 w-32">${label}:</span>
          <span class="info-value text-gray-800 dark:text-gray-100 flex-1">${value}</span>
        </div>
      `;
    });

  // إضافة القنوات الناقلة في الآخر
  if (channels.length > 0) {
    otherInfo.push(`
      <div class="info-item flex">
        <span class="info-label font-semibold text-gray-700 dark:text-gray-300 w-32">القنوات الناقلة:</span>
        <span class="info-value text-gray-800 dark:text-gray-100 flex-1">
          ${channels.map(ch => `<div>${ch}</div>`).join('')}
        </span>
      </div>
    `);
  }

  panel.innerHTML = `
    <div class="info-container grid grid-cols-1 sm:grid-cols-2 gap-3 p-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg">
      ${otherInfo.join('')}
    </div>
  `;
}

function renderLineup(lineup, match) {
const panel = document.getElementById('tab-lineup');
  if (!lineup || !match) {
    panel.innerHTML = "<p style='text-align:center;'>التشكيلة غير متاحة.</p>";
    return;
  }

  // 🧠 استخراج بيانات الفريقين من match
  const homeTeam = match['Team-Left'];
  const awayTeam = match['Team-Right'];

  // 🧠 استخراج التشكيلة من JSON الجديد
  const homePlayers = [...(lineup.Home_Lineup || []), ...(lineup.Home_Substitutes || [])];
  const awayPlayers = [...(lineup.Away_Lineup || []), ...(lineup.Away_Substitutes || [])];

  const homeCoach = lineup.Home_Coach?.title || 'غير معروف';
  const awayCoach = lineup.Away_Coach?.title || 'غير معروف';

  const renderTeam = (players, teamName, teamLogo, formation, coachName) => {
    const starters = players.filter(p => p.type === "lineup");
    const substitutes = players.filter(p => p.type === "substitutions");

    return `
    <div class="lineup-team space-y-4">
      <div class="lineup-header flex items-center gap-3">
        <img src="${teamLogo}" alt="${teamName}" class="w-12 h-12 rounded-full border border-gray-300 dark:border-gray-600" />
        <div>
          <div class="text-lg font-bold text-gray-800 dark:text-gray-100">${teamName}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">${formation}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">المدرب: ${coachName}</div>
        </div>
      </div>
      <div>
                 <div class="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">التشكيلة الأساسية</div>
        <ul class="player-list grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${starters.map(p => `
            <li class="player-item flex items-center gap-2">
              <img src="${p.player.image}" alt="${p.player.title}" class="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600" />
              <span class="player-name text-sm text-gray-800 dark:text-gray-100">${p.player.title}</span>
            </li>`).join('')}
        </ul>
      </div>

      <div>
        <div class="text-md font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-2">الاحتياطي</div>
        <ul class="player-list grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${substitutes.map(p => `
            <li class="player-item flex items-center gap-2">
              <img src="${p.player.image}" alt="${p.player.title}" class="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600" />
              <span class="player-name text-sm text-gray-800 dark:text-gray-100">${p.player.title}</span>
            </li>`).join('')}
        </ul>
        </div>
      </div>
    `;
  };

  panel.innerHTML = `
    <div class="lineup-container">
      ${renderTeam(homePlayers, homeTeam.Name, homeTeam.Logo, lineup.Home_Team_Formation, homeCoach)}
      ${renderTeam(awayPlayers, awayTeam.Name, awayTeam.Logo, lineup.Away_Team_Formation, awayCoach)}
    </div>
  `;
}
function renderEvents(events, match) {
  const panel = document.getElementById('tab-events');
  if (!events || events.length === 0) {
    panel.innerHTML = "<p style='text-align:center;'>لا توجد أحداث مسجلة.</p>";
    return;
  }

  // لتحديد الفريق يمين أو يسار بناءً على match object
  const teamRight = match['Team-Right']?.Name || 'Team-2';
  const teamLeft = match['Team-Left']?.Name || 'Team-1';

  panel.innerHTML = `
    <div class="events-container">
      <div class="timeline-line bg-gray-200 dark:bg-gray-900"></div>
      ${events.map(event => {
        const isLeft = event.team === 'Team-1'; // ممكن تعدله لو عندك فريقين باسماء صريحة
        const playerName = event.player_a || 'لاعب غير معروف';
        const playerImage = event.player_a_image || '';
        const subPlayer = event.player_s || null;
        let extraPlayerHTML = '';
        if (subPlayer) {
          if (event.event_name === 'تبديل لاعب') {
            extraPlayerHTML = `<div class="event-assist">خارج: ${subPlayer}</div>`;
          } else {
            if (event.event_name === 'هدف') {
              extraPlayerHTML = `<div class="event-assist">صناعة: ${subPlayer}</div>`;
            } else {
              extraPlayerHTML = `<div class="event-assist">${subPlayer}</div>`;
            }
          }
        }
        
        const time = event.Time || event.minute + `'` || '';

return `
  <div class="event-item ${isLeft ? 'left' : 'right'}">
    ${!isLeft ? '<div style="width:45%"></div>' : ''}
    <div class="event-details">
      <div class="event-icon"><svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" width="30" height="20">${event.event_icon}</svg></div>
      <div class="event-text">
        <div class="player-name">${playerName}</div>
        ${extraPlayerHTML}
      </div>
    </div>
    <div class="event-time bg-gray-200 dark:bg-gray-900">${time}</div>
    ${isLeft ? '<div style="width:45%"></div>' : ''}
  </div>
`;
}).join('')}</div>`;}


function renderStats(stats) {
  const panel = document.getElementById('tab-stats');
  if (!stats || stats.length === 0) {
    panel.innerHTML = "<p style='text-align:center;'>لا توجد إحصائيات متاحة.</p>";
    return;
  }

  const combinedStats = stats.map(stat => ({
    name: stat.Name,
    valueLeft: parseStatValue(stat.Team1_Value),
    valueRight: parseStatValue(stat.Team2_Value)
  }));

  // إزالة التكرارات بناءً على اسم الإحصائية
  const uniqueStats = [];
  const seenNames = new Set();
  for (const stat of combinedStats) {
    if (!seenNames.has(stat.name)) {
      uniqueStats.push(stat);
      seenNames.add(stat.name);
    }
  }

  // حساب القيم القصوى علشان الأعمدة تكون متوازنة
  const maxValues = {};
  uniqueStats.forEach(stat => {
    maxValues[stat.name] = Math.max(stat.valueLeft, stat.valueRight, 1);
  });

  panel.innerHTML = `
    <div class="stats-container space-y-3">
      ${uniqueStats.map(stat => {
        const max = maxValues[stat.name];
        const leftWidth = (stat.valueLeft / max) * 100;
        const rightWidth = (stat.valueRight / max) * 100;

        return `
        <div class="stat-row flex flex-col gap-1">
          <div class="stat-name text-center text-sm text-gray-700 dark:text-gray-300">${stat.name}</div>
          <div class="stat-bar-wrapper flex items-center justify-between gap-2">
            <div class="stat-side w-1/2 flex justify-start">
              <div class="stat-bar bg-blue-600 dark:bg-blue-400 h-2 rounded-r-full" style="width: ${leftWidth}%"></div>
            </div>
            <div class="stat-values text-sm text-gray-800 dark:text-gray-100 w-10 text-center">
              ${stat.valueLeft} - ${stat.valueRight}
            </div>
            <div class="stat-side w-1/2 flex justify-end">
              <div class="stat-bar bg-red-600 dark:bg-red-400 h-2 rounded-l-full" style="width: ${rightWidth}%"></div>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
}

function parseStatValue(value) {
  if (typeof value === 'string') {
    const percentMatch = value.match(/^(\d+(?:\.\d+)?)%$/);
    if (percentMatch) return parseFloat(percentMatch[1]);
    return parseFloat(value) || 0;
  }
  return value || 0;
}

// --- FETCH FUNCTIONS ---
async function fetchMatches(dateString) {
    matchesLoadingSpinner.style.display = 'flex';
    matchesContainer.innerHTML = '';
    datePicker.value = dateString;
    const apiUrl = `https://ko.best-goal.live/state.php?date=${dateString}`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        
        // استخراج الـ matches من كل دوري
        allMatchesData = []; // important!
const leagues = data?.Leagues || [];
leagues.forEach(league => {
  const leagueMatches = league.Matches || [];
  leagueMatches.forEach(match => {
    match['Cup-id'] = league['Cup-id'];
    match['Cup-Name'] = league['Cup-Name'];
    match['Cup-Logo'] = league['Cup-Logo'];
    allMatchesData.push(match);
  });
});
displayMatches(allMatchesData);

    } catch (error) {
        console.error("Fetch Matches Error:", error);
        matchesContainer.innerHTML = `<p style="text-align:center; color:red;">حدث خطأ في تحميل المباريات.</p>`;
    } finally {
        matchesLoadingSpinner.style.display = 'none';
    }
}


async function fetchNews(page = 1, isLoadMore = false) {
    if (!isLoadMore) {
        newsLoadingSpinner.style.display = 'flex';
        newsContainer.innerHTML = '';
        newsLoadMoreContainer.innerHTML = '';
        allNewsData = [];
        newsCurrentPage = 1;
    }
    const loadMoreBtn = document.getElementById('load-more-news-btn');
    if (loadMoreBtn) loadMoreBtn.disabled = true;

    try {
        const response = await fetch(`https://ko.best-goal.live/news.php?page=${page}`);
        const newsData = await response.json();
        if (Array.isArray(newsData) && newsData.length > 0) {
            allNewsData = allNewsData.concat(newsData);
            displayNews();
            newsCurrentPage = page;
            if (newsData.length > 0) {
                 newsLoadMoreContainer.innerHTML = `<button id="load-more-news-btn" class="load-more-btn">تحميل المزيد</button>`;
                 document.getElementById('load-more-news-btn').addEventListener('click', () => fetchNews(newsCurrentPage + 1, true));
            } else {
                 newsLoadMoreContainer.innerHTML = '';
            }
        } else {
            if (isLoadMore) {
                 newsLoadMoreContainer.innerHTML = `<p>لا يوجد المزيد من الأخبار.</p>`;
            } else {
                 newsContainer.innerHTML = '<p style="text-align:center;">لا توجد أخبار حاليًا.</p>';
            }
        }
    } catch (error) {
        console.error("Fetch News Error:", error);
        newsContainer.innerHTML = '<p style="text-align:center; color:red;">حدث خطأ في تحميل الأخبار.</p>';
    } finally {
        newsLoadingSpinner.style.display = 'none';
        if (loadMoreBtn) loadMoreBtn.disabled = false;
    }
}

async function fetchVideos(page = 1, isLoadMore = false) {
    if (!isLoadMore) {
        videosLoadingSpinner.style.display = 'flex';
        videosContainer.innerHTML = '';
        videosLoadMoreContainer.innerHTML = '';
        allVideosData = [];
        videosCurrentPage = 1;
    }
    const loadMoreBtn = document.getElementById('load-more-videos-btn');
    if (loadMoreBtn) loadMoreBtn.disabled = true;

    try {
        const response = await fetch(`https://ko.best-goal.live/videos.php?pages=${page}`);
        const videosData = await response.json();
        if (Array.isArray(videosData) && videosData.length > 0) {
            allVideosData = allVideosData.concat(videosData);
            displayVideos();
            videosCurrentPage = page;
             videosLoadMoreContainer.innerHTML = `<button id="load-more-videos-btn" class="load-more-btn">تحميل المزيد</button>`;
             document.getElementById('load-more-videos-btn').addEventListener('click', () => fetchVideos(videosCurrentPage + 1, true));
        } else {
            if (isLoadMore) {
                videosLoadMoreContainer.innerHTML = `<p>لا يوجد المزيد من الفيديوهات.</p>`;
            } else {
                videosContainer.innerHTML = '<p style="text-align:center;">لا توجد فيديوهات حاليًا.</p>';
            }
        }
    } catch (error) {
        console.error("Fetch Videos Error:", error);
        videosContainer.innerHTML = '<p style="text-align:center; color:red;">حدث خطأ في تحميل الفيديوهات.</p>';
    } finally {
        videosLoadingSpinner.style.display = 'none';
        if (loadMoreBtn) loadMoreBtn.disabled = false;
    }
}

async function fetchTournaments() {
    tournamentsLoadingSpinner.style.display = 'flex';
    tournamentsGridContainer.style.display = 'none';
    try {
        const apiUrl = 'https://ko.best-goal.live/get.php';
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('API Error for Tournaments');
        const responseData = await response.json();
        if (responseData && responseData.success === true) {
            allTournamentsData = responseData.data || [];
            displayTournamentsGrid(allTournamentsData);
        } else {
            throw new Error("API did not return success for tournaments");
        }
    } catch (error) {
        console.error("Fetch Tournaments Error:", error);
        tournamentsGridContainer.innerHTML = '<p style="text-align:center; color:red;">فشل تحميل البطولات.</p>';
    } finally {
        tournamentsLoadingSpinner.style.display = 'none';
        tournamentsGridContainer.style.display = 'block';
    }
}

async function fetchTransfers() {
    transfersLoadingSpinner.style.display = 'flex';
    transfersContainer.innerHTML = '';
    try {
        const response = await fetch('https://ko.best-goal.live/transation.php');
        if (!response.ok) throw new Error('Network response was not ok');
        const responseData = await response.json();
        if (responseData && responseData.success) {
            displayTransfers(responseData.data);
        } else {
            throw new Error('Failed to fetch transfers');
        }
    } catch (error) {
        console.error("Fetch Transfers Error:", error);
        transfersContainer.innerHTML = '<p style="text-align:center; color:red;">حدث خطأ في تحميل الانتقالات.</p>';
    } finally {
        transfersLoadingSpinner.style.display = 'none';
    }
}
async function fetchEventsAndLineup(match) {
  const matchId = match['Match-id'];
  ['#tab-info', '#tab-lineup', '#tab-events'].forEach(s => {
    document.querySelector(s).innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
  });

  const apiUrl = `https://ko.best-goal.live/state.php?match_id=${match['Match-id']}&time=${userTimeZone}`;

  try {
const response = await fetch(apiUrl);
const data = await response.json();
    const details = data;

    if (!details || !details['Match_Info']) {
  console.error("No Match_Info found in details!", details);
  throw new Error("Missing Match_Info");
}

    const matchStatus = match['Match-Status'] === 'انتهت للتو' ? 'status-finished'
      : match['Match-Status'] === 'انتهت' ? 'status-finished'
        : match['Match-Status'] === 'بعد الوقت الإضافي' ? 'status-finished'
          : match['Match-Status'] === 'بعد ركلات الترجيح' ? 'status-finished'
            : match['Match-Status'] === 'تأجلت' ? 'status-postponed'
              : match['Match-Status'] === 'لم تبدأ' ? 'status-not-started'
                : 'status-live';
    
        const startTime = new Date(match['Time-Start']);
    const now = new Date();
    const diffInSeconds = (startTime - now) / 1000;
    
    const shouldFetchStreams =
      matchStatus === 'status-live' ||
      (matchStatus === 'status-not-started' && diffInSeconds <= 1200 && diffInSeconds > 0);
    if (shouldFetchStreams) {
      await fetchAndDisplayStreams(match);
        }
    renderInfo(details['Match_Info'], match);
    renderLineup(details['Lineup'], match);
    renderEvents(details['Events'], match);

  } catch (e) {
    console.error("Fetch Details Error:", e);
    document.querySelector('#tab-info').innerHTML = '<p style="text-align:center; color:red;">فشل تحميل التفاصيل</p>';
    document.querySelector('#tab-lineup').innerHTML = '<p style="text-align:center; color:red;">فشل تحميل التشكيلة</p>';
    document.querySelector('#tab-events').innerHTML = '<p style="text-align:center; color:red;">فشل تحميل الأحداث</p>';
  }
}

async function fetchStats(Matchid) {
  document.querySelector('#tab-stats').innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
  const apiUrl = `https://ko.best-goal.live/state.php?match_id=${Matchid}`;
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    renderStats(data['Statistics']);
  } catch (e) {
    console.error("Fetch Stats Error:", e);
    document.querySelector('#tab-stats').innerHTML = '<p style="text-align:center; color:red;">فشل تحميل الإحصائيات</p>';
  }
}
async function fetchAndDisplayStreams(match) {
    const matchId = match['Match-id'].toString();
    const streamsRef = collection(db, "matches", matchId, "streams");
    
    document.querySelectorAll('.dynamic-tab, .dynamic-panel').forEach(el => el.remove());

    try {
        const querySnapshot = await getDocs(streamsRef);
        if (!querySnapshot.empty) {
            const streams = [];
            querySnapshot.forEach((doc) => {
                streams.push({ id: doc.id, ...doc.data() });
            });
            
            detailsTabsContainer.insertAdjacentHTML('beforeend', `<button class="tab-btn dynamic-tab text-gray-800 dark:text-gray-100" data-tab="live">البث المباشر</button>`);
            detailsTabsMenu.insertAdjacentHTML('beforeend', `<button class="tab-btn dynamic-tab text-gray-800 dark:text-gray-100" data-tab="live">البث المباشر</button>`);
            tabContentContainer.insertAdjacentHTML('beforeend', `<div id="tab-live" class="tab-panel dynamic-panel"><div id="live-stream-buttons"></div></div>`);

            const liveStreamButtonsContainer = document.getElementById('live-stream-buttons');
            liveStreamButtonsContainer.innerHTML = streams.map(stream => 
                `<button class="stream-button" data-url="${stream.streamUrl}" data-type="${stream.streamType}" data-keyid="${stream.keyId || ''}" data-key="${stream.key || ''}">${stream.channelName}</button>`
            ).join('');
        }
    } catch (error) {
        console.error("Error fetching streams from Firebase:", error);
    }
}

// --- FIREBASE ADMIN FUNCTIONS ---
async function saveStream(matchId, streamId, streamData) {
    try {
        const docRef = streamId ? doc(db, "matches", matchId, "streams", streamId) : doc(collection(db, "matches", matchId, "streams"));
        await setDoc(docRef, streamData);
    } catch (e) {
        console.error("Error writing document: ", e);
        alert('حدث خطأ أثناء حفظ السيرفر.');
    }
}

async function deleteStream(matchId, streamId) {
    try {
        await deleteDoc(doc(db, "matches", matchId, "streams", streamId));
    } catch (e) {
        console.error("Error deleting document: ", e);
        alert('حدث خطأ أثناء الحذف.');
    }
}

async function refreshAdminStreamList(matchId) {
    currentStreamsList.innerHTML = '<div class="spinner-container"><div class="spinner"></div></div>';
    const streamsRef = collection(db, "matches", matchId, "streams");
    try {
        const querySnapshot = await getDocs(streamsRef);
        if (querySnapshot.empty) {
            currentStreamsList.innerHTML = 'لا توجد سيرفرات حاليًا.';
            return;
        }
        let html = '';
        querySnapshot.forEach((doc) => {
            const stream = doc.data();
            html += `<div class="current-stream-item bg-white dark:bg-gray-800 mt-2" style="border-radius: 12px;" ><span>${stream.channelName} (${stream.streamType})</span><div class="stream-actions"><button class="edit-stream-btn" data-id="${doc.id}">تعديل</button><button class="delete-stream-btn" data-id="${doc.id}">حذف</button></div></div>`;
        });
        currentStreamsList.innerHTML = html;
    } catch (error) {
        currentStreamsList.innerHTML = "<p style='color:red'>فشل تحميل قائمة السيرفرات.</p>";
    }
}

async function openAdminModal(matchId) {
    adminPasswordSection.style.display = 'block';
    adminContentSection.style.display = 'none';
    document.getElementById('admin-password-input').value = '';
    adminModal.style.display = 'flex';
    adminModal.dataset.currentMatchId = matchId;
}


// --- UI LOGIC & EVENT LISTENERS ---

function showMatchDetailsPage(match) {
  const matchStatus = match['Match-Status'] === 'انتهت للتو' ? 'status-finished'
    : match['Match-Status'] === 'انتهت' ? 'status-finished'
      : match['Match-Status'] === 'بعد الوقت الإضافي' ? 'status-finished'
        : match['Match-Status'] === 'بعد ركلات الترجيح' ? 'status-finished'
          : match['Match-Status'] === 'تأجلت' ? 'status-postponed'
            : match['Match-Status'] === 'لم تبدأ' ? 'status-not-started'
              : 'status-live';
  if (matchStatus === 'status-not-started' || matchStatus === 'status-postponed'){
    modalMatchCard.innerHTML = `<div class="modal-team"><img src=" ${match['Team-Left']['Logo']}" class="modal-team-logo"><span class="modal-team-name">${match['Team-Left']['Name']}</span></div><div class="modal-match-score">VS</div><div class="modal-team right"><span class="modal-team-name">${match['Team-Right']['Name']}</span><img src=" ${match['Team-Right']['Logo']}" class="modal-team-logo"></div>`;
  } else {
    modalMatchCard.innerHTML = `<div class="modal-team"><img src=" ${match['Team-Left']['Logo']}" class="modal-team-logo"><span class="modal-team-name">${match['Team-Left']['Name']}</span></div><div class="modal-match-score">${match['Team-Left']['Goal']} - ${match['Team-Right']['Goal']}</div><div class="modal-team right"><span class="modal-team-name">${match['Team-Right']['Name']}</span><img src=" ${match['Team-Right']['Logo']}" class="modal-team-logo"></div>`;
  }
    detailsTabsContainer.innerHTML = '<button class="tab-btn text-gray-800 dark:text-gray-100" data-tab="info">التفاصيل</button><button class="tab-btn text-gray-800 dark:text-gray-100" data-tab="lineup">التشكيلة</button><button class="tab-btn text-gray-800 dark:text-gray-100" data-tab="events">الأحداث</button><button class="tab-btn text-gray-800 dark:text-gray-100" data-tab="stats">الإحصائيات</button>';
    detailsTabsMenu.innerHTML = '<button class="tab-btn text-gray-800 dark:text-gray-100" data-tab="info">التفاصيل</button><button class="tab-btn text-gray-800 dark:text-gray-100" data-tab="lineup">التشكيلة</button><button class="tab-btn text-gray-800 dark:text-gray-100" data-tab="events">الأحداث</button><button class="tab-btn text-gray-800 dark:text-gray-100" data-tab="stats">الإحصائيات</button>';
    tabContentContainer.innerHTML = '<div id="tab-info" class="tab-panel"></div><div id="tab-lineup" class="tab-panel"></div><div id="tab-events" class="tab-panel"></div><div id="tab-stats" class="tab-panel"></div>';

    document.querySelector('#details-tabs-container .tab-btn[data-tab="info"]').classList.add('active');
    document.querySelector('#details-tabs-menu .tab-btn[data-tab="info"]').classList.add('active');
    document.getElementById('tab-info').classList.add('active');
    activeTabTitle.textContent = "التفاصيل";
    
    views.forEach(view => view.classList.remove('active'));
    matchDetailsView.classList.add('active');
    window.scrollTo(0, 0);

    matchDetailsView.dataset.matchId = match['Match-id'];
    fetchEventsAndLineup(match);
}

function showNewsArticle(article) {
    newsArticleContent.innerHTML = `
        <h1 class="article-title">${article.title}</h1>
        <img src="${article.image}" alt="${article.title}" class="article-image">
        <div class="article-body">${article.content}</div>
    `;
    views.forEach(view => view.classList.remove('active'));
    newsArticleView.classList.add('active');
    window.scrollTo(0, 0);
}


mainNav.addEventListener('click', (e) => {
    if (e.target.matches('a.nav-link')) {
        e.preventDefault();
        window.scrollTo(0, 0);
        const targetViewId = e.target.dataset.view;
        mainNav.querySelector('.active')?.classList.remove('active');
        e.target.classList.add('active');
        views.forEach(view => view.classList.remove('active'));
        document.getElementById(targetViewId).classList.add('active');
        if (targetViewId === 'news-view' && allNewsData.length === 0) fetchNews();
        if(mainNav.classList.contains('open')) {
            mainNav.classList.remove('open');
            drawerToggle.classList.remove('open');
        }
    }
});

drawerToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
    drawerToggle.classList.toggle('open');
});

function formatDateToString(date) { return date.toISOString().split('T')[0]; }

todayBtn.addEventListener('click', () => { currentDate = new Date(); fetchMatches(formatDateToString(currentDate)); });
yesterdayBtn.addEventListener('click', () => { currentDate.setDate(currentDate.getDate() - 1); fetchMatches(formatDateToString(currentDate)); });
tomorrowBtn.addEventListener('click', () => { currentDate.setDate(currentDate.getDate() + 1); fetchMatches(formatDateToString(currentDate)); });
datePicker.addEventListener('change', () => {
    const dateParts = datePicker.value.split('-').map(part => parseInt(part, 10));
    currentDate = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
    fetchMatches(datePicker.value);
});

matchesContainer.addEventListener('mousedown', (e) => {
    const matchBody = e.target.closest('.match-body');
    if (matchBody) {
        longPressTimer = setTimeout(() => {
            longPressTimer = null;
            openAdminModal(matchBody.dataset.matchId);
        }, 6000);
    }
});
matchesContainer.addEventListener('mouseup', () => clearTimeout(longPressTimer));
matchesContainer.addEventListener('mouseleave', () => clearTimeout(longPressTimer));
matchesContainer.addEventListener('click', (e) => {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        const matchBody = e.target.closest('.match-body');
        if (matchBody) {
            const matchId = matchBody.dataset.matchId;
            // فحص احتياطي
            if (!matchId) return;
          console.log("Matches loaded:", allMatchesData.length);
console.log(allMatchesData.map(m => m['Match-id']));
console.log("Clicked Match ID:", matchId);
            const matchData = allMatchesData.find(m => {
                // نعمل تطابق آمن، سواء كان رقم أو نص
                return String(m['Match-id']) === String(matchId);
            });

            if (matchData) {
                showMatchDetailsPage(matchData);
            } else {
                console.warn("Match not found:", matchId);
            }
        }
    }
});

matchesContainer.addEventListener('touchstart', (e) => {
    const matchBody = e.target.closest('.match-body');
    if (matchBody) {
        longPressTimer = setTimeout(() => {
            longPressTimer = null;
            openAdminModal(matchBody.dataset.matchId);
        }, 6000);
    }
}, { passive: true });
matchesContainer.addEventListener('touchend', () => clearTimeout(longPressTimer));

function goBackToMatches() {
    matchDetailsView.classList.remove('active');
    document.getElementById('matches-view').classList.add('active');
}
backToMatchesBtn.addEventListener('click', goBackToMatches);

backToNewsBtn.addEventListener('click', () => {
    newsArticleView.classList.remove('active');
    document.getElementById('news-view').classList.add('active');
});

newsContainer.addEventListener('click', (e) => {
    const newsCard = e.target.closest('.news-card');
    if (newsCard) {
        const newsIndex = newsCard.dataset.newsIndex;
        const article = allNewsData[newsIndex];
        if (article) {
            showNewsArticle(article);
        }
    }
});

videoPlayerModal.querySelector('.modal-close-btn').addEventListener('click', () => {
    videoPlayerModal.style.display = 'none';
    videoPlayerIframe.srcdoc = 'about:blank';
});
adminModal.querySelector('.modal-close-btn').addEventListener('click', () => { adminModal.style.display = 'none'; });

function handleTabClick(e) {
    const target = e.target;
    if (target.matches('button.tab-btn')) {
        const action = target.dataset.action;
        const tabName = target.dataset.tab;
        
        if(action === 'back') {
            goBackToMatches();
            detailsTabsMenu.classList.remove('open');
            return;
        }

        if(tabName) {
            [detailsTabsContainer, detailsTabsMenu].forEach(container => {
                container.querySelector('.active')?.classList.remove('active');
                container.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
            });
            document.querySelector('#tab-content-container .tab-panel.active')?.classList.remove('active');
            const targetPanel = document.getElementById(`tab-${tabName}`);
            if(targetPanel) {
                targetPanel.classList.add('active');
                targetPanel.scrollTop = 0;
            }
            activeTabTitle.textContent = target.textContent;
            detailsTabsMenu.classList.remove('open');
            
            const matchId = matchDetailsView.dataset.matchId;
            if (tabName === 'stats' && targetPanel.innerHTML.trim() === '') {
                fetchStats(matchId);
            }
        }
    }
}
detailsTabsContainer.addEventListener('click', handleTabClick);
detailsTabsMenu.addEventListener('click', handleTabClick);
detailsTabsDrawerBtn.addEventListener('click', (e) => { e.stopPropagation(); detailsTabsMenu.classList.toggle('open'); });
document.body.addEventListener('click', () => detailsTabsMenu.classList.remove('open'), true);

videosContainer.addEventListener('click', (e) => {
    const videoCard = e.target.closest('.video-card');
    if (videoCard) {
        const m3u8Url = videoCard.dataset.m3u8Url;
        if (m3u8Url) {
            const playerHtml = `<!DOCTYPE html><html><head><style>body,html{margin:0;padding:0;height:100%;width:100%;background-color:#000;}#player{height:100%!important;width:100%!important;}</style><script src="https://ssl.p.jwpcdn.com/player/v/8.36.5/jwplayer.js"><\/script><script>jwplayer.key = 'XSuP4qMl+9tK17QNb+4+th2Pm9AWgMO/cYH8CI0HGGr7bdjo';<\/script></head><body><div id="player"></div><script>jwplayer("player").setup({file:"${m3u8Url}",type:'hls',width:"100%",height:"100%",autostart: true});<\/script></body></html>`;
            videoPlayerIframe.srcdoc = playerHtml;
            videoPlayerModal.style.display = 'flex';
        }
    }
});
tournamentsGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.tournament-card');
    if (card) {
        const index = card.dataset.index;
        displayStandings(allTournamentsData[index]);
    }
});
tabContentContainer.addEventListener('click', (e) => {
    if(e.target.matches('.stream-button')) {
        const button = e.target;
        const setupConfig = {
            file: button.dataset.url,
            type: button.dataset.type === 'hls' ? 'hls' : 'dash',
            width: "100%",
            height: "100%",
            autostart: true
        };
        if(button.dataset.type === 'dash-drm') {
            setupConfig.drm = { "clearkey": { "keyId": button.dataset.keyid, "key": button.dataset.key } };
        }
        const playerHtml = `<!DOCTYPE html><html><head><link rel="stylesheet" href="./css/jw_ako.css"><style>body,html{margin:0;padding:0;height:100%;width:100%;background-color:#000;}#player{height:100%!important;width:100%!important;}</style><script src="https://ssl.p.jwpcdn.com/player/v/8.36.5/jwplayer.js"><\/script><script>jwplayer.key = 'XSuP4qMl+9tK17QNb+4+th2Pm9AWgMO/cYH8CI0HGGr7bdjo';<\/script></head><body><div id="player"></div><script>jwplayer("player").setup(${JSON.stringify(setupConfig)});<\/script></body></html>`;
        videoPlayerIframe.srcdoc = playerHtml;
        videoPlayerModal.style.display = 'flex';
    }
});
document.getElementById('admin-login-btn').addEventListener('click', () => {
    const password = document.getElementById('admin-password-input').value;
    const matchId = adminModal.dataset.currentMatchId;
    if (password === ADMIN_PASSWORD) {
        adminPasswordSection.style.display = 'none';
        adminContentSection.style.display = 'block';
        refreshAdminStreamList(matchId);
    } else {
        alert('كلمة المرور خاطئة!');
    }
});
addStreamForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const matchId = adminModal.dataset.currentMatchId;
    const streamId = document.getElementById('stream-id').value;
    const streamData = {
        channelName: document.getElementById('stream-name').value,
        streamType: document.getElementById('stream-type').value,
        streamUrl: document.getElementById('stream-url').value,
        keyId: document.getElementById('stream-key-id').value || null,
        key: document.getElementById('stream-key').value || null,
    };
    saveStreamBtn.textContent = "جاري الحفظ...";
    saveStreamBtn.disabled = true;
    try {
        await saveStream(matchId, streamId || Date.now().toString(), streamData);
        alert('تم الحفظ بنجاح!');
        addStreamForm.reset();
        streamTypeSelect.dispatchEvent(new Event('change'));
        document.getElementById('stream-id').value = '';
        formTitle.textContent = "إضافة سيرفر جديد";
        saveStreamBtn.textContent = "حفظ السيرفر";
        cancelEditBtn.style.display = 'none';
        await refreshAdminStreamList(matchId);
    } catch (error) {
        alert('فشل الحفظ.');
    } finally {
        saveStreamBtn.disabled = false;
    }
});
streamTypeSelect.addEventListener('change', () => { drmFields.style.display = streamTypeSelect.value === 'dash-drm' ? 'flex' : 'none'; });
cancelEditBtn.addEventListener('click', () => {
    addStreamForm.reset();
    document.getElementById('stream-id').value = '';
    formTitle.textContent = "إضافة سيرفر جديد";
    saveStreamBtn.textContent = "حفظ السيرفر";
    cancelEditBtn.style.display = 'none';
    streamTypeSelect.dispatchEvent(new Event('change'));
});
currentStreamsList.addEventListener('click', async (e) => {
    const matchId = adminModal.dataset.currentMatchId;
    if (e.target.matches('.delete-stream-btn')) {
        const streamId = e.target.dataset.id;
        if (confirm('هل أنت متأكد من حذف هذا السيرفر؟')) {
            await deleteStream(matchId, streamId);
            await refreshAdminStreamList(matchId);
        }
    }
    if(e.target.matches('.edit-stream-btn')) {
        const streamId = e.target.dataset.id;
        const streamRef = doc(db, "matches", matchId, "streams", streamId);
        const docSnap = await getDoc(streamRef);
        if (docSnap.exists()) {
            const stream = docSnap.data();
            document.getElementById('stream-id').value = docSnap.id;
            document.getElementById('stream-name').value = stream.channelName;
            document.getElementById('stream-type').value = stream.streamType;
            document.getElementById('stream-url').value = stream.streamUrl;
            document.getElementById('stream-key-id').value = stream.keyId || '';
            document.getElementById('stream-key').value = stream.key || '';
            formTitle.textContent = "تعديل السيرفر";
            saveStreamBtn.textContent = "تحديث البيانات";
            cancelEditBtn.style.display = 'block';
            streamTypeSelect.dispatchEvent(new Event('change'));
            addStreamForm.scrollIntoView({ behavior: 'smooth' });
        }
    }
});

// --- INITIAL LOAD ---
fetchMatches(formatDateToString(new Date()));
export {
  showMatchDetailsPage,
  displayStandings,
  showNewsArticle,
  getUserTimeZoneOffset
};


































