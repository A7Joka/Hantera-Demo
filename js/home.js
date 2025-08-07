document.addEventListener("DOMContentLoaded", () => {
  loadMatches();
  loadTransfers();
  loadNews();
  loadVideos();
  loadTournaments();
});
import {
  showMatchDetailsPage,
  displayStandings,
  showNewsArticle,
  getUserTimeZoneOffset
} from './script.js';
let alllMatchesData = [];
let alllNewsData = [];
let alllTournamentsData = [];
const hmals = document.getElementById('home-matches-loading-spinner');
const htrls = document.getElementById('home-transfers-loading-spinner');
const hnels = document.getElementById('home-news-loading-spinner');
const hvils = document.getElementById('home-videos-loading-spinner');
const htols = document.getElementById('home-tournaments-loading-spinner');
const userTimeZone = getUserTimeZoneOffset();
// 1. تحميل المباريات
async function loadMatches() {
      hmals.style.display = 'flex';
const container = document.getElementById("home-matches-container");
  try {
    const res = await fetch(`https://ko.best-goal.live/yallashoot.php?date=2025-08-06&&time=${userTimeZone}`);
    const json = await res.json();
    const allMatches = json.Leagues.flatMap(league => league.Matches || []);
    const matches = allMatches.slice(0, 5);
    alllMatchesData = matches;
    matches.forEach(match => {
      const card = createMatchCard(match);
      container.appendChild(card);
    });
    if (!matches || matches.length === 0) {
container.innerHTML = `<p style="text-align:center;">لا توجد مباريات في هذا اليوم.</p>`;
      return;
    }
    const section = container.parentElement;
    const moreWrapper = document.createElement("div");
    moreWrapper.className = "w-full flex justify-center mt-4";
    moreWrapper.appendChild(createMoreCard("عرض المزيد", "matches-view"));
    section.appendChild(moreWrapper);
    section.addEventListener('click', (e) => {
      e.preventDefault();
      switchView("matches-view");
      const matchBody = e.target.closest('.match-body');
      if (matchBody) {
        const matchId = matchBody.dataset.matchId;
        const matchData = alllMatchesData.find(m => m['Match-id'] == matchId);
        if (matchData) showMatchDetailsPage(matchData);
      }
    });
  } catch (err) {
    container.innerHTML = `<p class="text-red-500">فشل تحميل المباريات</p>`;
    console.error("Matches Error:", err);
  } finally {
        hmals.style.display = 'none';
    }
}

// 2. تحميل الانتقالات
async function loadTransfers() {
        htrls.style.display = 'flex';
const container = document.getElementById("home-transfers-container");
  try {
    const res = await fetch("https://ko.best-goal.live/transation.php");
    const json = await res.json();
    const transfers = json.data.slice(0, 3);

    transfers.forEach(transfer => {
      const card = createTransferCard(transfer);
      container.appendChild(card);
    });
    if (!transfers || transfers.length === 0) {
        container.innerHTML = `<p style="text-align:center;">لا توجد انتقالات حالياً.</p>`;
        return;
    }
    const section = container.parentElement;
    const moreWrapper = document.createElement("div");
    moreWrapper.className = "w-full flex justify-center mt-4";
    moreWrapper.appendChild(createMoreCard("عرض المزيد", "transfers-view"));
    section.appendChild(moreWrapper);

  } catch (err) {
    container.innerHTML = `<p class="text-red-500">فشل تحميل الانتقالات</p>`;
    console.error("Transfers Error:", err);
  } finally {
        htrls.style.display = 'none';
    }
}

// 3. تحميل الأخبار
async function loadNews() {
        hnels.style.display = 'flex';
const container = document.getElementById("home-news-container");
  try {
    const res = await fetch("https://ko.best-goal.live/news.php");
    const data = await res.json();
    const news = data.slice(0, 3);
    alllNewsData = news;

news.forEach((article, index) => {
  const card = createNewsCard(article, index);
      container.appendChild(card);
    });
    const section = container.parentElement;
    const moreWrapper = document.createElement("div");
    moreWrapper.className = "w-full flex justify-center mt-4";
    moreWrapper.appendChild(createMoreCard("عرض المزيد", "news-view"));
    section.appendChild(moreWrapper);
    section.addEventListener('click', (e) => {
      e.preventDefault();
    switchView("news-view");
      const newsCard = e.target.closest('.news-card');
      if (newsCard) {
        const newsIndex = newsCard.dataset.newsIndex;
        const article = alllNewsData[newsIndex];
        if (article) {
          showNewsArticle(article);
        }
      }
    });
  } catch (err) {
    container.innerHTML = `<p class="text-red-500">فشل تحميل الأخبار</p>`;
    console.error("News Error:", err);
  } finally {
        hnels.style.display = 'none';
    }
}

// 4. تحميل الفيديوهات
async function loadVideos() {     
  hvils.style.display = 'flex';
const container = document.getElementById("home-videos-container");
  try {
    const res = await fetch("https://ko.best-goal.live/videos.php");
    const data = await res.json();
    const videos = data.slice(0, 3);

    videos.forEach(video => {
      const card = createVideoCard(video);
      container.appendChild(card);
    });
    const section = container.parentElement;
    const moreWrapper = document.createElement("div");
    moreWrapper.className = "w-full flex justify-center mt-4";
    moreWrapper.appendChild(createMoreCard("عرض المزيد", "videos-view"));
    section.appendChild(moreWrapper);
    section.addEventListener('click', (e) => {
      e.preventDefault();
    switchView("videos-view");
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
  } catch (err) {
    container.innerHTML = `<p class="text-red-500">فشل تحميل الفيديوهات</p>`;
    console.error("Videos Error:", err);
  } finally {
        hvils.style.display = 'none';
    }
}

// 5. تحميل البطولات
async function loadTournaments() {
        htols.style.display = 'flex';
const container = document.getElementById("home-tournaments-container");
  try {
    const res = await fetch("https://ko.best-goal.live/get.php");
    const json = await res.json();
    const tournaments = json.data.slice(0, 3);
alllTournamentsData = tournaments;

tournaments.forEach((tournament, index) => {
  const card = createTournamentCard(tournament, index);
      container.appendChild(card);
    });
    const section = container.parentElement;
    const moreWrapper = document.createElement("div");
    moreWrapper.className = "w-full flex justify-center mt-4";
    moreWrapper.appendChild(createMoreCard("عرض المزيد", "tournaments-view"));
    section.appendChild(moreWrapper);
    section.addEventListener('click', (e) => {
      e.preventDefault();
    switchView("tournaments-view");
      const card = e.target.closest('.tournament-card');
      if (card) {
        const index = card.dataset.index;
        displayStandings(alllTournamentsData[index]);
      }
    });

  } catch (err) {
    container.innerHTML = `<p class="text-red-500">فشل تحميل البطولات</p>`;
    console.error("Tournaments Error:", err);
  } finally {
        htols.style.display = 'none';
    }
}

// ---------- الكروت ----------
function createMatchCard(match) {
  const isNotStarted = match['Match-Status'] === 'لم تبدأ' || match['Match-Status'] === 'تأجلت';
  const statusClass = match['Match-Status'] === 'انتهت للتو' ? 'status-finished'
    : match['Match-Status'] === 'انتهت' ? 'status-finished'
      : match['Match-Status'] === 'بعد الوقت الاضافي' ? 'status-finished'
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
  <div class="match-body bg-gray-200 dark:bg-gray-900" data-match-id="${match['Match-id']}">
    <div class="match-part part-logo  bg-gray-100 dark:bg-gray-700">
      <img src="${match['Team-Left']['Logo']}" alt="${match['Team-Left']['Name']}" class="match-logo" />
    </div>
    <div class="match-part part-name text-gray-800 dark:text-gray-100">
      <span class="team-name">${match['Team-Left']['Name']}</span>
    </div>
    <div class="match-part part-center ${statusClass}">
      ${matchTimeOrResult}
      <span class="match-status">${match['Match-Status']}</span>
    </div>
    <div class="match-part part-name text-gray-800 dark:text-gray-100">
      <span class="team-name">${match['Team-Right']['Name']}</span>
    </div>
    <div class="match-part part-logo  bg-gray-100 dark:bg-gray-700">
      <img src="${match['Team-Right']['Logo']}" alt="${match['Team-Right']['Name']}" class="match-logo" />
    </div>
  </div>
  `;
  return div;
}


function createTransferCard(t) {
  const div = document.createElement("div");
  div.className = "bg-gray-200 dark:bg-gray-900 p-4 rounded-lg shadow text-center";
  div.innerHTML = `
    <img src="${t.player_image}" alt="${t.player_name}" class="mx-auto w-16 h-16 rounded-full mb-2" />
    <p class="font-semibold">${t.player_name}</p>
    <p class="text-xs text-gray-400">${t.player_position}</p>
    <div class="flex justify-center items-center gap-2 mt-2">
      <img src="${t.to_club_logo}" alt="" class="w-8 h-8" />
      <span class="text-sm">→</span>
      <img src="${t.from_club_logo}" alt="" class="w-8 h-8" />
    </div>
  `;
  return div;
}
function createNewsCard(item, index) {
  const div = document.createElement("div");
  div.innerHTML = `
    <div class="news-card bg-gray-200 dark:bg-gray-900" data-news-index="${index}">
      <img src="${item.image}" alt="${item.title}" class="news-image">
      <div class="news-content">
        <h2 class="news-title">${item.title}</h2>
        <p class="news-summary">${item.sub_link}</p>
        <p class="news-time">${item.time}</p>
      </div>
    </div>
  `;
  return div;
}

function createVideoCard(item) {
  const div = document.createElement("div");
  div.innerHTML = `
    <div class="video-card bg-gray-200 dark:bg-gray-900" data-m3u8-url="${item.m3u8_url}">
      <div class="video-thumbnail-wrapper">
        <img src="${item.imageurl}" alt="${item.title}" class="video-thumbnail">
        <div class="play-icon"></div>
      </div>
      <div class="video-content">
        <h2 class="video-title">${item.title}</h2>
        <p class="video-category">${item.category}</p>
      </div>
    </div>
  `;
  return div;
}


function createTournamentCard(tour, index) {
  const div = document.createElement("div");
  div.innerHTML = `
    <div class="tournament-card bg-gray-200 dark:bg-gray-900" data-index="${index}">
      <img src="${tour.image}" alt="${tour.title}" class="tournament-card-image">
      <h3 class="tournament-card-title">${tour.title}</h3>
    </div>
  `;
  return div;
}

function createMoreCard(text, viewId) {
  const a = document.createElement("a");
  a.href = "#";
  a.dataset.view = viewId;
  a.className = "btn btn-outline-info font-semibold text-center";
  a.textContent = text;
  a.addEventListener("click", (e) => {
    e.preventDefault();
    switchView(viewId);
  });
  return a;
}
document.querySelectorAll('a[data-view]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const targetViewId = link.dataset.view;
    document.querySelectorAll('a[data-view]').forEach(el => el.classList.remove('text-primary'));
    link.classList.add('text-primary');
    switchView(targetViewId);
  });
});


// ---------- التنقل بين الـ views ----------

function switchView(viewId) {
  document.querySelectorAll(".view").forEach(view => view.classList.remove("active"));
  document.getElementById(viewId).classList.add("active");

  document.querySelectorAll('#main-nav .nav-link').forEach(link => link.classList.remove('active'));
  const targetLink = document.querySelector(`#main-nav .nav-link[data-view="${viewId}"]`);
  if (targetLink) {
    targetLink.classList.add('active');
  }
  window.scrollTo(0, 0);
}
