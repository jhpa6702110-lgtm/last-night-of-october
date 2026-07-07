/**
 * 🎬 영화 개봉 정보 앱 - 메인 애플리케이션 JS
 * TMDB API + 다국어 지원 + 다이나믹 테마 + API 키 관리
 */

// ============= Global State =============
let currentFilter = 'all';
let currentPeriod = 'week';
let filteredMovies = [];
let isLoading = false;
let currentTheme = 'dark';
let currentLanguage = 'ko';
let currentVideoKey = null;

const TRANSLATIONS = {
    ko: {
        'brand-name': '톱니바꿈의',
        'app-title': '톱니바꿈의 영화 개봉 정보',
        'app-title-thin': '영화 개봉 정보',
        'app-subtitle': 'Movie Premiere Info',
        'filter': '필터',
        'genre': '장르',
        'genre-all': '전체',
        'genre-action': '액션',
        'genre-drama': '드라마',
        'genre-comedy': '코미디',
        'genre-horror': '공포',
        'genre-animation': '애니메이션',
        'genre-sf': 'SF',
        'genre-romance': '로맨스',
        'genre-thriller': '스릴러',
        'stat-movies': '개봉작',
        'stat-korean': '한국영화',
        'stat-foreign': '외국영화',
        'featured-badge': '주목할 영화',
        'featured-btn': '상세 정보',
        'trailer': '예고편',
        'cast': '주요 출연진',
        'director': '감독',
        'runtime': '러닝타임',
        'release-date': '개봉일',
        'country': '국가',
        'rating': '평점',
        'overview': '줄거리',
        'reserve': '예매하기',
        'share': '공유하기',
        'tmdb': 'TMDB',
        'no-trailer': '등록된 예고편이 없습니다',
        'search-youtube': 'YouTube에서 검색',
        'minutes': '분',
        'week': '이번 주 개봉하는 영화들을 한눈에 확인하세요',
        'month': '이번 달 개봉하는 영화들을 확인하세요',
        'year': '올해 개봉하는 모든 영화들을 확인하세요',
        'custom': '개봉작',
        'week-title': '이번 주 전체 개봉작',
        'month-title': '이번 달 전체 개봉작',
        'year-title': '올해 전체 개봉작',
        'custom-title': '검색 기간 개봉작',
        'loading-tmdb': 'TMDB API에서 영화 정보를 불러오는 중...',
        'searching-movies': '최신 개봉 영화를 검색하고 있습니다...',
        'no-movies': '해당 기간에 개봉 영화가 없습니다',
        'no-genre-movies': '해당 장르의 영화가 없습니다',
        'loading-details': '정보를 불러오는 중...',
        'no-cast': '출연진 정보가 없습니다',
        'no-overview': '줄거리 정보가 없습니다.',
        'copied': '클립보드에 복사되었습니다!',
        'ticket-search': ' 예매',
        'trailer-search-query': ' trailer',
        'hero-title-1': '극장에서 만나는',
        'hero-title-2': '새로운 이야기들',
        'stats-banner-1': '전세계 ',
        'stats-banner-2': '개 국가의 ',
        'stats-banner-3': '편의 영화정보를 제공합니다.',
        'featured-title': '주목할 영화',
        'period-week': '이번 주',
        'period-month': '이번 달',
        'period-year': '올해',
        'period-custom': '기간검색',
        'start-date': '시작일:',
        'end-date': '종료일:',
        'apply': '적용',
        'tmdb-info': '영화 정보는 TMDB API를 통해 제공됩니다.',
        'other-videos': '다른 영상',
        'no-info': '정보 없음',
        'view-on-youtube': 'YouTube에서 보기',
        'close': '닫기',
        'embed-restricted': '임베드가 제한된 영상입니다',
        'direct-youtube': 'YouTube에서 직접 보기',
        'search-placeholder': '영화 제목을 검색하세요...',
        'search-btn': '검색',
        'search-results': '검색 결과',
        'no-search-results': '검색 결과가 없습니다',
        'biography': '약력',
        'filmography': '주요 출연작',
        'timeline': '연기 타임라인',
        'person-tmdb': 'TMDB 인물 정보',
        'photos': '갤러리',
        'settings': '설정',
        'api-setup-title': 'TMDB API 설정',
        'api-setup-desc': '실시간 영화 데이터를 제공받으려면 API 키 또는 토큰을 입력해 주세요. 입력하지 않거나 미인증 시 내장된 데모 데이터를 사용합니다.',
        'api-key-label': 'API Key',
        'api-token-label': 'Bearer Token (선택)',
        'save': '저장 및 새로고침',
        'clear': '지우기',
        'demo-mode-active': '현재 오프라인 데모 모드로 작동 중입니다. 실시간 영화 정보를 보시려면 상단 [설정] 아이콘을 눌러 API 키를 입력해 주세요.',
        'live-mode-active': 'TMDB API 실시간 연동 모드가 활성화되어 있습니다.',
        'api-guide-title': 'API 키 발급 방법:',
        'api-guide-step1': 'TMDB(themoviedb.org) 회원가입 및 로그인',
        'api-guide-step2': "우측 상단 프로필 > '설정(Settings)' > 'API' 메뉴 이동",
        'api-guide-step3': "'API 키 요청' 클릭 후 개발자(Developer) 유형으로 신청서 작성",
        'api-guide-step4': '생성된 API 키 (v3 auth) 또는 읽기 액세스 토큰 (v4 auth)을 복사하여 아래에 입력'
    },
    en: {
        'brand-name': "Topnibakkum's",
        'app-title': "Topnibakkum's Movie Premiere Info",
        'app-title-thin': 'Movie Premiere Info',
        'app-subtitle': 'Global Movie Releases',
        'filter': 'Filter',
        'genre': 'Genre',
        'genre-all': 'All',
        'genre-action': 'Action',
        'genre-drama': 'Drama',
        'genre-comedy': 'Comedy',
        'genre-horror': 'Horror',
        'genre-animation': 'Animation',
        'genre-sf': 'Sci-Fi',
        'genre-romance': 'Romance',
        'genre-thriller': 'Thriller',
        'stat-movies': 'Releases',
        'stat-korean': 'Korean',
        'stat-foreign': 'Foreign',
        'featured-badge': 'Featured Movie',
        'featured-btn': 'Details',
        'trailer': 'Trailer',
        'cast': 'Main Cast',
        'director': 'Director',
        'runtime': 'Runtime',
        'release-date': 'Release Date',
        'country': 'Country',
        'rating': 'Rating',
        'overview': 'Overview',
        'reserve': 'Tickets',
        'share': 'Share',
        'tmdb': 'TMDB',
        'no-trailer': 'No trailers available',
        'search-youtube': 'Search on YouTube',
        'minutes': 'min',
        'week': 'Check out all new movies releasing this week at a glance',
        'month': 'Check out movies releasing this month',
        'year': 'Check out all movies releasing this year',
        'custom': 'Releases',
        'week-title': 'All This Week\'s Releases',
        'month-title': 'All This Month\'s Releases',
        'year-title': 'All This Year\'s Releases',
        'custom-title': 'Search Results',
        'loading-tmdb': 'Loading movie info from TMDB API...',
        'searching-movies': 'Searching for the latest releases...',
        'no-movies': 'No movies found for this period',
        'no-genre-movies': 'No movies found for this genre',
        'loading-details': 'Loading details...',
        'no-cast': 'No cast information available',
        'no-overview': 'Overview not available.',
        'copied': 'Copied to clipboard!',
        'ticket-search': ' Tickets',
        'trailer-search-query': ' trailer',
        'hero-title-1': 'Discover New Stories',
        'hero-title-2': 'At the Cinema',
        'stats-banner-1': 'Providing movie data for over ',
        'stats-banner-2': ' movies from ',
        'stats-banner-3': ' countries.',
        'featured-title': 'Featured Movie',
        'period-week': 'This Week',
        'period-month': 'This Month',
        'period-year': 'This Year',
        'period-custom': 'Custom Range',
        'start-date': 'Start Date:',
        'end-date': 'End Date:',
        'apply': 'Apply',
        'tmdb-info': 'Movie data provided by TMDB API.',
        'other-videos': 'Other Videos',
        'no-info': 'N/A',
        'view-on-youtube': 'View on YouTube',
        'close': 'Close',
        'embed-restricted': 'This video is restricted from embedding',
        'direct-youtube': 'Watch directly on YouTube',
        'search-placeholder': 'Search movie title...',
        'search-btn': 'Search',
        'search-results': 'Search Results',
        'searching': 'Searching...',
        'no-search-results': 'No search results found',
        'biography': 'Biography',
        'filmography': 'Featured Works',
        'timeline': 'Acting Timeline',
        'person-tmdb': 'TMDB Person Info',
        'photos': 'Gallery',
        'settings': 'Settings',
        'api-setup-title': 'TMDB API Configuration',
        'api-setup-desc': 'To fetch live global movie databases, please configure your TMDB API Key. If left empty, the application runs on pre-compiled demo datasets.',
        'api-key-label': 'API Key',
        'api-token-label': 'Bearer Token (Optional)',
        'save': 'Save & Refresh',
        'clear': 'Clear',
        'demo-mode-active': 'Operating in offline demo mode. Click [Settings] at the top header to connect your TMDB API Key for live global movie databases.',
        'live-mode-active': 'Live TMDB API integration is active.',
        'api-guide-title': 'How to get API Key:',
        'api-guide-step1': 'Sign up & log in to TMDB (themoviedb.org)',
        'api-guide-step2': "Go to Profile > Settings > 'API' menu on top-right",
        'api-guide-step3': "Click 'Request an API Key' and register as 'Developer'",
        'api-guide-step4': 'Copy the generated API Key (v3 auth) or Access Token (v4 auth) and paste below'
    }
};

// ============= DOM Elements =============
const elements = {
    movieGrid: null,
    featuredMovie: null,
    filterBtn: null,
    filterPanel: null,
    genreFilters: null,
    periodFilters: null,
    customDateRange: null,
    dateStart: null,
    dateEnd: null,
    applyDateRange: null,
    modal: null,
    modalBody: null,
    totalMovies: null,
    koreanMovies: null,
    foreignMovies: null,
    currentWeek: null,
    heroSection: null,
    themeToggle: null,
    themeIconDark: null,
    themeIconLight: null,
    totalCountries: null,
    totalAllMovies: null,
    periodDescription: null,
    movieSectionTitle: null,
    searchInput: null,
    searchBtn: null,
    personModal: null,
    personModalBody: null,
    splashModal: null,
    
    // API 설정 요소
    settingsBtn: null,
    apiModal: null,
    apiKeyInput: null,
    apiTokenInput: null,
    saveApiBtn: null,
    clearApiBtn: null,
    apiStatusAlert: null
};

// ============= Initialization =============
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initTheme();
    initLanguage();
    initApp();
});

function initElements() {
    elements.movieGrid = document.getElementById('movie-grid');
    elements.featuredMovie = document.getElementById('featured-movie');
    elements.filterBtn = document.getElementById('filter-btn');
    elements.filterPanel = document.getElementById('filter-panel');
    elements.genreFilters = document.getElementById('genre-filters');
    elements.periodFilters = document.getElementById('period-filters');
    elements.customDateRange = document.getElementById('custom-date-range');
    elements.dateStart = document.getElementById('date-start');
    elements.dateEnd = document.getElementById('date-end');
    elements.applyDateRange = document.getElementById('apply-date-range');
    elements.modal = document.getElementById('movie-modal');
    elements.modalBody = document.getElementById('modal-body');
    elements.totalMovies = document.getElementById('total-movies');
    elements.koreanMovies = document.getElementById('korean-movies');
    elements.foreignMovies = document.getElementById('foreign-movies');
    elements.currentWeek = document.getElementById('current-week');
    elements.heroSection = document.getElementById('hero');
    elements.themeToggle = document.getElementById('theme-toggle');
    elements.themeIconDark = document.getElementById('theme-icon-dark');
    elements.themeIconLight = document.getElementById('theme-icon-light');
    elements.totalCountries = document.getElementById('total-countries');
    elements.totalAllMovies = document.getElementById('total-all-movies');
    elements.periodDescription = document.getElementById('period-description');
    elements.movieSectionTitle = document.getElementById('movie-section-title');
    elements.searchInput = document.getElementById('movie-search-input');
    elements.searchBtn = document.getElementById('search-btn');
    elements.personModal = document.getElementById('person-modal');
    elements.personModalBody = document.getElementById('person-modal-body');
    elements.splashModal = document.getElementById('splash-modal');
    
    // API 설정 요소 바인딩
    elements.settingsBtn = document.getElementById('settings-btn');
    elements.apiModal = document.getElementById('api-modal');
    elements.apiKeyInput = document.getElementById('api-key-input');
    elements.apiTokenInput = document.getElementById('api-token-input');
    elements.saveApiBtn = document.getElementById('save-api-btn');
    elements.clearApiBtn = document.getElementById('clear-api-btn');
    elements.apiStatusAlert = document.getElementById('api-status-alert');
}

// ============= Theme Management =============
function initTheme() {
    const savedTheme = localStorage.getItem('movie-app-theme') || 'dark';
    setTheme(savedTheme);
}

function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.remove('dark-mode', 'light-mode');
    document.body.classList.add(`${theme}-mode`);

    if (elements.themeIconDark && elements.themeIconLight) {
        if (theme === 'dark') {
            elements.themeIconDark.classList.remove('hidden');
            elements.themeIconLight.classList.add('hidden');
        } else {
            elements.themeIconDark.classList.add('hidden');
            elements.themeIconLight.classList.remove('hidden');
        }
    }

    localStorage.setItem('movie-app-theme', theme);
}

function toggleTheme() {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// ============= Language Management =============
function toggleLanguage() {
    const nextLang = currentLanguage === 'ko' ? 'en' : 'ko';
    changeLanguage(nextLang);
}

function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('movie-app-lang', lang);

    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
        langBtn.textContent = lang === 'ko' ? 'KO' : 'EN';
    }

    updateTmdbConfig(lang);
    GENRE_MAP = GENRE_MAPS[lang];

    translatePage();
    initApp();
}

function translatePage() {
    const t = TRANSLATIONS[currentLanguage];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.textContent = t[key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) {
            el.placeholder = t[key];
        }
    });

    document.title = `🎬 ${t['app-title']} | ${t['app-subtitle']}`;
    document.documentElement.lang = currentLanguage;
}

function initLanguage() {
    const savedLang = localStorage.getItem('movie-app-lang') || 'ko';
    currentLanguage = savedLang;

    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
        langBtn.textContent = savedLang === 'ko' ? 'KO' : 'EN';
    }

    updateTmdbConfig(savedLang);
    GENRE_MAP = GENRE_MAPS[savedLang];
    translatePage();
}

// ============= API Key Management =============
function openApiModal() {
    if (elements.apiModal) {
        elements.apiModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // 입력 필드 세팅
        const currentKey = localStorage.getItem('tmdb_api_key') || '';
        const currentToken = localStorage.getItem('tmdb_access_token') || '';
        
        if (elements.apiKeyInput) elements.apiKeyInput.value = currentKey;
        if (elements.apiTokenInput) elements.apiTokenInput.value = currentToken;
    }
}

function closeApiModal() {
    if (elements.apiModal) {
        elements.apiModal.classList.add('hidden');
        if (elements.modal.classList.contains('hidden') && 
            elements.personModal.classList.contains('hidden') && 
            elements.splashModal.classList.contains('hidden')) {
            document.body.style.overflow = '';
        }
    }
}

function saveApiCredentials() {
    const key = elements.apiKeyInput ? elements.apiKeyInput.value.trim() : '';
    const token = elements.apiTokenInput ? elements.apiTokenInput.value.trim() : '';
    
    if (!key && !token) {
        clearApiCredentials();
        return;
    }
    
    saveApiKey(key, token);
    closeApiModal();
    window.location.reload();
}

function clearApiCredentials() {
    clearApiKey();
    if (elements.apiKeyInput) elements.apiKeyInput.value = '';
    if (elements.apiTokenInput) elements.apiTokenInput.value = '';
    closeApiModal();
    window.location.reload();
}

// ============= App Initialization =============
async function initApp() {
    updateCurrentWeek();
    initEventListeners();
    setDefaultDates();
    updateModeBanner();

    showLoadingState();

    try {
        // 영화 및 데이터 정보 로딩
        await loadExtendedMovies();

        // 전세계 통계 갱신
        updateGlobalStats();

        // 히어로배경 월페이퍼 생성
        setupHeroBackground();

        // UI 갱신
        updateStats();
        renderFeaturedMovie();
        renderMovieGrid();
        animateCounters();

        console.log('🎬 앱 초기화 완료!');
    } catch (error) {
        console.error('❌ 앱 초기화 실패:', error);
        useFallbackData();
        updateStats();
        renderFeaturedMovie();
        renderMovieGrid();
        animateCounters();
        showErrorMessage('영화 정보를 로딩하는데 실패했습니다. 샘플 데이터를 표출합니다.');
    }
}

function updateModeBanner() {
    const isLive = hasValidApiKey();
    const t = TRANSLATIONS[currentLanguage];
    
    if (elements.apiStatusAlert) {
        if (isLive) {
            elements.apiStatusAlert.innerHTML = `<i class="fas fa-wifi text-emerald-400 mr-2 animate-pulse"></i><span>${t['live-mode-active']}</span>`;
            elements.apiStatusAlert.className = "flex items-center text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-full backdrop-blur-md";
        } else {
            elements.apiStatusAlert.innerHTML = `<i class="fas fa-exclamation-triangle text-amber-400 mr-2"></i><span>${t['demo-mode-active']}</span>`;
            elements.apiStatusAlert.className = "flex items-center text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-3 py-1.5 rounded-full backdrop-blur-md cursor-pointer hover:bg-amber-500/20 transition-all";
            elements.apiStatusAlert.onclick = openApiModal;
        }
    }
}

// ============= Default Dates =============
function setDefaultDates() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    if (elements.dateStart) elements.dateStart.value = formatDateForInput(firstDayOfMonth);
    if (elements.dateEnd) elements.dateEnd.value = formatDateForInput(lastDayOfMonth);
}

function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

// ============= Global Stats =============
function updateGlobalStats() {
    const stats = getGlobalStats();
    const displayCountries = stats.totalCountries;
    const displayMovies = stats.totalMovies;

    const bannerText = document.getElementById('stats-banner-text');
    if (bannerText) {
        if (currentLanguage === 'ko') {
            bannerText.innerHTML = `
                <i class="fas fa-globe-americas text-sky-400 mr-2"></i>
                전세계 <span id="total-countries" class="font-bold text-blue-400">${displayCountries.toLocaleString()}</span>개 국가의
                <span id="total-all-movies" class="font-bold text-indigo-400">${displayMovies.toLocaleString()}</span>편의 영화정보를 제공합니다.
            `;
        } else {
            bannerText.innerHTML = `
                <i class="fas fa-globe-americas text-sky-400 mr-2"></i>
                Providing movie data for <span id="total-all-movies" class="font-bold text-indigo-400">${displayMovies.toLocaleString()}</span> movies from 
                <span id="total-countries" class="font-bold text-blue-400">${displayCountries.toLocaleString()}</span> countries.
            `;
        }
    }
}

// ============= Period Filter =============
function applyPeriodFilter(period, startDate = null, endDate = null) {
    currentPeriod = period;

    filterMoviesByPeriod(period, startDate, endDate);

    updatePeriodDescription(period, startDate, endDate);
    updateStats();
    renderFeaturedMovie();
    renderMovieGrid();
    animateCounters();
    updateSectionTitle(period);
}

function updatePeriodDescription(period, startDate, endDate) {
    const t = TRANSLATIONS[currentLanguage];
    const descriptions = {
        'week': t['week'],
        'month': t['month'],
        'year': t['year'],
        'custom': `${formatDateShort(startDate)} ~ ${formatDateShort(endDate)} ${t['custom']}`
    };

    if (elements.periodDescription) {
        elements.periodDescription.textContent = descriptions[period] || descriptions['week'];
    }
}

function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (currentLanguage === 'en') {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function updateSectionTitle(period, query = '') {
    const t = TRANSLATIONS[currentLanguage];
    if (period === 'search') {
        elements.movieSectionTitle.textContent = query ? `"${query}" ${t['search-results']}` : t['search-results'];
        return;
    }
    const titles = {
        'week': t['week-title'],
        'month': t['month-title'],
        'year': t['year-title'],
        'custom': t['custom-title']
    };

    if (elements.movieSectionTitle) {
        elements.movieSectionTitle.textContent = titles[period] || titles['week'];
    }
}

// ============= Search Action =============
async function handleSearch() {
    const query = elements.searchInput.value.trim();
    if (!query) return;

    elements.movieGrid.innerHTML = `
        <div class="col-span-full py-20 text-center">
            <div class="loading-spinner mx-auto mb-4"></div>
            <p class="text-gray-400">${TRANSLATIONS[currentLanguage]['searching']}</p>
        </div>
    `;

    try {
        const results = await searchMovies(query);
        
        updateSectionTitle('search', query);
        elements.periodDescription.textContent = results.length > 0
            ? `"${query}" ${TRANSLATIONS[currentLanguage]['search-results']} (${results.length})`
            : TRANSLATIONS[currentLanguage]['no-search-results'];

        renderMovieGrid('all');
        animateCounters();

        const movieSection = document.getElementById('movies');
        if (movieSection) {
            movieSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } catch (error) {
        console.error('검색 진행 중 에러:', error);
        showErrorMessage('검색 과정 중 에러가 발생했습니다.');
    }
}

// ============= Loading State =============
function showLoadingState() {
    isLoading = true;
    const t = TRANSLATIONS[currentLanguage];

    elements.featuredMovie.innerHTML = `
        <div class="flex items-center justify-center py-20">
            <div class="loading-spinner"></div>
        </div>
    `;

    elements.movieGrid.innerHTML = `
        <div class="col-span-full py-24 text-center">
            <div class="loading-spinner mx-auto mb-4"></div>
            <p class="text-gray-400 mt-2">${t['loading-tmdb']}</p>
        </div>
    `;
}

function showErrorMessage(message) {
    const errorHtml = `
        <div class="fixed bottom-4 right-4 bg-red-950/90 text-white px-6 py-4 rounded-xl shadow-2xl z-50 max-w-md backdrop-blur-xl border border-red-500/20">
            <div class="flex items-center gap-3">
                <i class="fas fa-exclamation-triangle text-amber-400"></i>
                <p class="text-sm font-medium">${message}</p>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-gray-400 hover:text-white transition-colors">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', errorHtml);

    setTimeout(() => {
        const errorEl = document.querySelector('.fixed.bottom-4.right-4');
        if (errorEl) errorEl.remove();
    }, 5000);
}

// ============= Current Week Display =============
function updateCurrentWeek() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const weekOfMonth = Math.ceil(now.getDate() / 7);
    
    if (currentLanguage === 'en') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        elements.currentWeek.textContent = `${months[now.getMonth()]} Week ${weekOfMonth}, ${year}`;
    } else {
        elements.currentWeek.textContent = `${year}년 ${month}월 ${weekOfMonth}주차`;
    }
}

// ============= Hero Background =============
function setupHeroBackground() {
    const heroBg = document.getElementById('hero-background');
    if (!heroBg || MOVIES_DATA.length === 0) return;

    const posters = MOVIES_DATA
        .map(m => m.poster)
        .filter(p => !p.includes('placeholder') && !p.includes('via.placeholder.com'))
        .sort(() => 0.5 - Math.random())
        .slice(0, 18);

    if (posters.length === 0) {
        heroBg.innerHTML = '';
        return;
    }

    heroBg.innerHTML = posters.map((poster, index) => `
        <div class="hero-background-item" style="animation: fadeInPoster 0.8s ease forwards ${index * 0.08}s; opacity: 0;">
            <img src="${poster}" alt="Poster Background">
        </div>
    `).join('');
}

// ============= Statistics =============
function updateStats() {
    const stats = getCurrentStats();

    elements.totalMovies.dataset.target = stats.total;
    elements.koreanMovies.dataset.target = stats.korean;
    elements.foreignMovies.dataset.target = stats.foreign;
}

function animateCounters() {
    const counters = [elements.totalMovies, elements.koreanMovies, elements.foreignMovies];

    counters.forEach(counter => {
        if (!counter) return;
        const target = parseInt(counter.dataset.target) || 0;
        const duration = 1200;
        const start = 0;
        const startTime = performance.now();

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * easeOut);

            counter.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        }

        requestAnimationFrame(updateCounter);
    });
}

// ============= D-Day Calculator =============
function calculateDDay(releaseDate) {
    if (!releaseDate) return { text: '미정', class: '' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const release = new Date(releaseDate);
    release.setHours(0, 0, 0, 0);

    const diffTime = release - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return { text: 'TODAY', class: 'today' };
    } else if (diffDays > 0) {
        return { text: `D-${diffDays}`, class: '' };
    } else {
        return { text: currentLanguage === 'ko' ? '상영중' : 'Now Playing', class: 'now-playing' };
    }
}

// ============= Date Formatter =============
function formatDate(dateString) {
    if (!dateString) return currentLanguage === 'ko' ? '개봉일 미정' : 'TBA';

    const date = new Date(dateString);
    if (currentLanguage === 'en') {
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' });
    }
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];

    return `${year}년 ${month}월 ${day}일 (${weekday})`;
}

// ============= Featured Movie Render =============
function renderFeaturedMovie() {
    const featured = MOVIES_DATA.find(m => m.featured) || MOVIES_DATA[0];
    const t = TRANSLATIONS[currentLanguage];

    if (!featured) {
        elements.featuredMovie.innerHTML = `
            <div class="empty-state py-12 text-center text-gray-500">
                <i class="fas fa-film text-3xl mb-3 block"></i>
                <p>${t['no-movies']}</p>
            </div>
        `;
        return;
    }

    const dday = calculateDDay(featured.releaseDate);
    const ddayClass = dday.class === 'today' ? 'dday-today' : (dday.class === 'now-playing' ? 'dday-now' : 'dday-upcoming');

    elements.featuredMovie.innerHTML = `
        <div class="featured-inner">
            <div class="featured-poster">
                <img src="${featured.poster}" alt="${featured.title}" loading="lazy" 
                     onerror="this.src='https://via.placeholder.com/500x750?text=No+Poster'">
                <div class="dday-badge ${ddayClass}">${dday.text}</div>
            </div>
            <div class="featured-info">
                <div class="featured-badge">
                    <i class="fas fa-star text-amber-400"></i>
                    ${t['featured-badge']}
                </div>
                <h2 class="featured-title">${featured.title}</h2>
                <p class="featured-original-title">${featured.originalTitle || ''}</p>
                <div class="featured-meta">
                    <span><i class="fas fa-calendar-alt text-amber-500"></i> ${formatDate(featured.releaseDate)}</span>
                    ${featured.runtime ? `<span><i class="fas fa-clock text-pink-500"></i> ${featured.runtime}${t['minutes']}</span>` : ''}
                    <span><i class="fas fa-globe text-purple-500"></i> ${featured.country}</span>
                    ${featured.rating > 0 ? `<span><i class="fas fa-star text-yellow-500"></i> ${featured.rating.toFixed(1)}</span>` : ''}
                </div>
                <div class="featured-genres">
                    ${featured.genres.map(g => `<span class="genre-tag">${g}</span>`).join('')}
                </div>
                <p class="featured-overview">${featured.overview}</p>
                <button class="featured-btn" onclick="openModal(${featured.id})">
                    <i class="fas fa-info-circle"></i>
                    ${t['featured-btn']}
                </button>
            </div>
        </div>
    `;
}

// ============= Movie Grid Render =============
function renderMovieGrid(filter = currentFilter) {
    const t = TRANSLATIONS[currentLanguage];
    if (MOVIES_DATA.length === 0) {
        elements.movieGrid.innerHTML = `
            <div class="empty-state col-span-full py-20 text-center">
                <i class="fas fa-calendar-times text-5xl text-gray-600 mb-4 block"></i>
                <p class="text-lg font-bold">${t['no-movies']}</p>
                <p class="text-sm text-gray-500 mt-2">${currentLanguage === 'ko' ? '다른 기간을 선택해 보세요' : 'Try selecting a different period'}</p>
            </div>
        `;
        return;
    }

    filteredMovies = filter === 'all'
        ? MOVIES_DATA
        : MOVIES_DATA.filter(movie => {
            const genreKorean = GENRE_MAP[filter];
            return movie.genres.some(g =>
                g.includes(genreKorean) ||
                g.toLowerCase().includes(filter) ||
                genreKorean?.includes(g)
            );
        });

    if (filteredMovies.length === 0) {
        elements.movieGrid.innerHTML = `
            <div class="empty-state col-span-full py-20 text-center">
                <i class="fas fa-search text-5xl text-gray-600 mb-4 block"></i>
                <p class="text-lg font-bold">${t['no-genre-movies']}</p>
            </div>
        `;
        return;
    }

    elements.movieGrid.innerHTML = filteredMovies.map(movie => {
        const dday = calculateDDay(movie.releaseDate);
        const ddayClass = dday.class === 'today' ? 'dday-today' : (dday.class === 'now-playing' ? 'dday-now' : 'dday-upcoming');
        const countryLabel = movie.isKorean
            ? (currentLanguage === 'ko' ? '🇰🇷 한국' : '🇰🇷 Korea')
            : (currentLanguage === 'ko' ? '🌍 외국' : '🌍 Foreign');

        return `
            <div class="movie-card" onclick="openModal(${movie.id})">
                <div class="movie-poster">
                    <img src="${movie.poster}" alt="${movie.title}" loading="lazy"
                         onerror="this.src='https://via.placeholder.com/500x750?text=No+Poster'">
                    <div class="movie-poster-overlay"></div>
                    
                    ${movie.rating > 0 ? `
                    <div class="movie-rating">
                        <i class="fas fa-star text-amber-400"></i>
                        ${movie.rating.toFixed(1)}
                    </div>
                    ` : ''}
                    
                    <div class="movie-country ${movie.isKorean ? 'korean' : 'foreign'}">
                        ${countryLabel}
                    </div>
                    
                    <div class="dday-badge ${ddayClass}">${dday.text}</div>
                    
                    <div class="movie-play-btn">
                        <i class="fas fa-play text-white"></i>
                    </div>
                </div>
                <div class="movie-info">
                    <h3 class="movie-title">${movie.title}</h3>
                    <p class="movie-date">
                        <i class="fas fa-calendar-alt text-amber-500 mr-1"></i>
                        ${formatDate(movie.releaseDate)}
                    </p>
                </div>
            </div>
        `;
    }).join('');

    // Grid 카드의 페이드인 등장 애니메이션
    const cards = elements.movieGrid.querySelectorAll('.movie-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(15px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 40);
    });
}

// ============= Modal Functions =============
async function openModal(movieId) {
    let movie = MOVIES_DATA.find(m => m.id === movieId);
    if (!movie) {
        movie = ALL_MOVIES_DATA.find(m => m.id === movieId);
    }
    if (!movie) return;

    elements.modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    const dday = calculateDDay(movie.releaseDate);
    renderModalContent(movie, dday, true);

    try {
        const [detailedMovie, videos] = await Promise.all([
            loadMovieDetails(movieId),
            loadMovieVideos(movieId)
        ]);

        if (detailedMovie) {
            movie = detailedMovie;
            movie.videos = videos || [];
        }

        renderModalContent(movie, dday, false);
    } catch (error) {
        console.log('상세 데이터 연동 실패, 로컬 캐시/폴백 데이터로 표출합니다.');
        renderModalContent(movie, dday, false);
    }
}

function renderModalContent(movie, dday, isLoadingDetails = false) {
    const hasVideos = movie.videos && movie.videos.length > 0;
    const mainTrailer = hasVideos ? movie.videos[0] : null;
    const t = TRANSLATIONS[currentLanguage];
    const ddayClass = dday.class === 'today' ? 'bg-emerald-600/90 text-emerald-100 border border-emerald-500/20' : (dday.class === 'now-playing' ? 'bg-indigo-600/90 text-indigo-100 border border-indigo-500/20' : 'bg-rose-600/90 text-rose-100 border border-rose-500/20');

    elements.modalBody.innerHTML = `
        <div class="modal-header">
            <img src="${movie.backdrop || movie.poster}" alt="${movie.title}"
                 onerror="this.src='${movie.poster}'">
            <div class="modal-header-overlay"></div>
            <div class="modal-poster">
                <img src="${movie.poster}" alt="${movie.title}"
                     onerror="this.src='https://via.placeholder.com/150x225?text=No+Poster'">
            </div>
        </div>
        <div class="modal-body">
            <h2 class="modal-title">${movie.title}</h2>
            <p class="modal-original-title">${movie.originalTitle || ''}</p>
            
            <!-- 예고편 섹션 -->
            <div class="trailer-section mb-8">
                <h4 class="text-sm font-bold mb-3 text-amber-500 flex items-center gap-2 tracking-wide">
                    <i class="fab fa-youtube"></i>
                    ${t['trailer']}
                </h4>
                <div id="trailer-container" class="trailer-container">
                    ${isLoadingDetails ? `
                        <div class="trailer-loading">
                            <div class="loading-spinner"></div>
                            <p class="text-xs text-gray-500 mt-2">${t['loading-details']}</p>
                        </div>
                    ` : hasVideos ? `
                        <div class="trailer-player" id="trailer-player">
                            <div class="trailer-thumbnail" onclick="playTrailer('${mainTrailer.key}', this)">
                                <img src="https://img.youtube.com/vi/${mainTrailer.key}/maxresdefault.jpg" 
                                     alt="${mainTrailer.name}"
                                     onerror="this.src='https://img.youtube.com/vi/${mainTrailer.key}/hqdefault.jpg'">
                                <div class="trailer-play-overlay">
                                    <div class="trailer-play-btn">
                                        <i class="fas fa-play"></i>
                                    </div>
                                    <p class="trailer-name">${mainTrailer.name}</p>
                                </div>
                            </div>
                        </div>
                        ${movie.videos.length > 1 ? `
                            <div class="trailer-list">
                                <p class="text-xs text-gray-500 mb-2 font-semibold">${t['other-videos']} (${movie.videos.length - 1})</p>
                                <div class="trailer-thumbnails">
                                    ${movie.videos.slice(1, 5).map(video => `
                                        <div class="trailer-thumb-item" onclick="playTrailer('${video.key}', document.getElementById('trailer-player'))">
                                            <img src="https://img.youtube.com/vi/${video.key}/mqdefault.jpg" alt="${video.name}">
                                            <div class="trailer-thumb-overlay">
                                                <i class="fas fa-play"></i>
                                            </div>
                                            <span class="trailer-thumb-type">${video.type}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    ` : `
                        <div class="trailer-empty">
                            <i class="fas fa-video-slash text-2xl text-gray-500 mb-2"></i>
                            <p>${t['no-trailer']}</p>
                            <button class="trailer-search-btn" onclick="searchTrailer('${movie.title} ${movie.originalTitle || ''} ${t['trailer-search-query']}')">
                                <i class="fab fa-youtube mr-1"></i>
                                ${t['search-youtube']}
                            </button>
                        </div>
                    `}
                </div>
            </div>
            
            <div class="modal-meta">
                <div class="modal-meta-item">
                    <span class="modal-meta-label">${t['release-date']}</span>
                    <span class="modal-meta-value flex items-center gap-2">
                        ${formatDate(movie.releaseDate)}
                        <span class="px-2 py-0.5 text-xs font-bold rounded ${ddayClass}">${dday.text}</span>
                    </span>
                </div>
                ${movie.runtime ? `
                <div class="modal-meta-item">
                    <span class="modal-meta-label">${t['runtime']}</span>
                    <span class="modal-meta-value">${movie.runtime}${t['minutes']}</span>
                </div>
                ` : ''}
                <div class="modal-meta-item">
                    <span class="modal-meta-label">${t['country']}</span>
                    <span class="modal-meta-value">${movie.country}</span>
                </div>
                ${movie.rating > 0 ? `
                <div class="modal-meta-item">
                    <span class="modal-meta-label">${t['rating']}</span>
                    <span class="modal-meta-value">
                        <i class="fas fa-star text-amber-400 mr-1"></i>
                        ${movie.rating.toFixed(1)}
                        ${movie.voteCount ? `<span class="text-gray-500 text-xs ml-1">(${movie.voteCount.toLocaleString()})</span>` : ''}
                    </span>
                </div>
                ` : ''}
                <div class="modal-meta-item">
                    <span class="modal-meta-label">${t['genre']}</span>
                    <span class="modal-meta-value">${movie.genres.join(', ') || t['no-info']}</span>
                </div>
            </div>
            
            <!-- 감독 섹션 -->
            <div class="credits-section mb-6">
                <h4 class="text-sm font-bold mb-3 text-indigo-400 flex items-center gap-2 tracking-wide">
                    <i class="fas fa-video"></i>
                    ${t['director']}
                </h4>
                ${isLoadingDetails ? `
                    <div class="credits-loading">
                        <div class="loading-spinner small"></div>
                        <span>${t['loading-details']}</span>
                    </div>
                ` : movie.directorDetails ? `
                    <div onclick="openPersonModal(${movie.directorDetails.id})" class="director-card">
                        <div class="person-avatar">
                            ${movie.directorDetails.profilePath
                                ? `<img src="${movie.directorDetails.profilePath}" alt="${movie.directorDetails.name}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-user\\'></i>'">`
                                : `<i class="fas fa-user"></i>`
                            }
                        </div>
                        <div class="person-info">
                            <span class="person-name">${movie.directorDetails.name}</span>
                            <span class="person-role">Director</span>
                        </div>
                    </div>
                ` : `<p class="text-gray-500 text-xs">${t['no-info']}</p>`}
            </div>
            
            <!-- 출연진 섹션 -->
            <div class="credits-section mb-6">
                <h4 class="text-sm font-bold mb-3 text-pink-400 flex items-center gap-2 tracking-wide">
                    <i class="fas fa-users"></i>
                    ${t['cast']}
                </h4>
                ${isLoadingDetails ? `
                    <div class="credits-loading">
                        <div class="loading-spinner small"></div>
                        <span>${t['loading-details']}</span>
                    </div>
                ` : movie.castDetails && movie.castDetails.length > 0 ? `
                    <div class="cast-grid-container">
                        <div class="cast-grid">
                            ${movie.castDetails.map(person => `
                                <div onclick="openPersonModal(${person.id})" class="cast-card">
                                    <div class="cast-avatar">
                                        ${person.profilePath
                                            ? `<img src="${person.profilePath}" alt="${person.name}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-user\\'></i>'">`
                                            : `<i class="fas fa-user"></i>`
                                        }
                                    </div>
                                    <div class="cast-info">
                                        <span class="cast-name">${person.name}</span>
                                        ${person.character ? `<span class="cast-character">${person.character}</span>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : `<p class="text-gray-500 text-xs">${t['no-cast']}</p>`}
            </div>
            
            <div class="modal-overview mt-6">
                <h4 class="text-sm font-bold mb-2 text-amber-500">${t['overview']}</h4>
                <p class="text-sm leading-relaxed text-gray-300">${movie.overview || t['no-overview']}</p>
            </div>
            
            <div class="modal-actions mt-8 flex flex-wrap gap-3">
                <button class="modal-btn modal-btn-primary" onclick="searchTicket('${movie.title}')">
                    <i class="fas fa-ticket-alt"></i>
                    ${t['reserve']}
                </button>
                <button class="modal-btn modal-btn-secondary" onclick="shareMovie('${movie.title}')">
                    <i class="fas fa-share-alt"></i>
                    ${t['share']}
                </button>
                <a href="https://www.themoviedb.org/movie/${movie.id}" target="_blank" class="modal-btn modal-btn-secondary flex items-center justify-center gap-1">
                    <i class="fas fa-external-link-alt"></i>
                    ${t['tmdb']}
                </a>
            </div>
        </div>
    `;
}

// ============= Trailer Functions =============
function playTrailer(videoKey, containerElement) {
    const t = TRANSLATIONS[currentLanguage];
    currentVideoKey = videoKey;
    const container = containerElement.closest('.trailer-player') || containerElement;

    // 유튜브 플레이어 임베드
    const embedUrl = `https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}`;

    container.innerHTML = `
        <div class="trailer-iframe-wrapper">
            <iframe 
                id="youtube-player-${videoKey}"
                src="${embedUrl}"
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen>
            </iframe>
            <div class="trailer-controls">
                <button class="trailer-youtube-btn" onclick="openYouTube('${videoKey}')" title="${t['view-on-youtube']}">
                    <i class="fab fa-youtube"></i>
                    ${t['view-on-youtube']}
                </button>
                <button class="trailer-close-btn" onclick="closeTrailer('${videoKey}')" title="${t['close']}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="trailer-error-fallback" id="trailer-error-${videoKey}">
                <i class="fas fa-exclamation-triangle mb-2 text-xl text-amber-500"></i>
                <p class="text-xs mb-2">${t['embed-restricted']}</p>
                <button class="trailer-youtube-btn-large" onclick="openYouTube('${videoKey}')">
                    <i class="fab fa-youtube"></i>
                    ${t['direct-youtube']}
                </button>
            </div>
        </div>
    `;

    const iframe = document.getElementById(`youtube-player-${videoKey}`);
    if (iframe) {
        iframe.onerror = () => showTrailerError(videoKey);
    }
}

function showTrailerError(videoKey) {
    const errorDiv = document.getElementById(`trailer-error-${videoKey}`);
    if (errorDiv) {
        errorDiv.classList.add('show');
    }
}

function openYouTube(videoKey) {
    window.open(`https://www.youtube.com/watch?v=${videoKey}`, '_blank');
}

function closeTrailer(videoKey) {
    const container = document.getElementById('trailer-player');
    if (!container) return;

    container.innerHTML = `
        <div class="trailer-thumbnail" onclick="playTrailer('${videoKey}', this)">
            <img src="https://img.youtube.com/vi/${videoKey}/maxresdefault.jpg" 
                 alt="Trailer thumbnail"
                 onerror="this.src='https://img.youtube.com/vi/${videoKey}/hqdefault.jpg'">
            <div class="trailer-play-overlay">
                <div class="trailer-play-btn">
                    <i class="fas fa-play"></i>
                </div>
            </div>
        </div>
    `;

    currentVideoKey = null;
}

function closeModal() {
    elements.modal.classList.add('hidden');
    document.body.style.overflow = '';
    currentVideoKey = null;
}

// ============= Person Modal Functions =============
async function openPersonModal(personId) {
    elements.personModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    elements.personModalBody.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20">
            <div class="loading-spinner"></div>
            <p class="text-gray-400 mt-4">${TRANSLATIONS[currentLanguage]['loading-details']}</p>
        </div>
    `;

    try {
        const person = await loadPersonDetails(personId);
        renderPersonModal(person);
    } catch (error) {
        console.error('인물 로딩 오류:', error);
        elements.personModalBody.innerHTML = `
            <div class="text-center py-20 text-gray-500">
                <i class="fas fa-exclamation-triangle text-4xl text-amber-500 mb-4 block"></i>
                <p class="text-sm font-medium">${TRANSLATIONS[currentLanguage]['no-info']}</p>
                <button onclick="closePersonModal()" class="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full text-xs transition-colors">
                    ${TRANSLATIONS[currentLanguage]['close']}
                </button>
            </div>
        `;
    }
}

function renderPersonModal(person) {
    const t = TRANSLATIONS[currentLanguage];
    const isKo = currentLanguage === 'ko';

    let ageInfo = '';
    if (person.birthday) {
        const birthDate = new Date(person.birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        ageInfo = isKo ? `${age}세` : `${age} years old`;
    }

    elements.personModalBody.innerHTML = `
        <div class="person-detail-header">
            <div class="person-detail-main">
                <div class="person-detail-photo">
                    ${person.profilePath
                        ? `<img src="${person.profilePath}" alt="${person.name}">`
                        : `<i class="fas fa-user text-4xl text-gray-600"></i>`
                    }
                </div>
                <div class="person-detail-info">
                    <h2 class="person-detail-name">${person.name}</h2>
                    <p class="person-detail-subname">${person.originalName || ''}</p>
                    <div class="person-basic-meta">
                        ${person.birthday ? `<span><i class="fas fa-birthday-cake mr-1"></i> ${person.birthday} ${ageInfo ? `(${ageInfo})` : ''}</span>` : ''}
                        ${person.placeOfBirth ? `<span><i class="fas fa-map-marker-alt mr-1"></i> ${person.placeOfBirth}</span>` : ''}
                    </div>
                </div>
            </div>
        </div>

        <div class="person-detail-content">
            <!-- 약력 -->
            <div class="person-section mb-6">
                <h3 class="person-section-title">
                    <i class="fas fa-book-open"></i>
                    ${t['biography']}
                </h3>
                <div class="person-bio-text">
                    ${person.biography}
                </div>
            </div>

            <!-- 주요 출연작 -->
            <div class="person-section mb-6">
                <h3 class="person-section-title">
                    <i class="fas fa-film"></i>
                    ${t['filmography']}
                </h3>
                <div class="person-filmography-container">
                    <div class="person-filmography">
                        ${person.filmography.map(movie => `
                            <div class="film-item" onclick="closePersonModal(); openModal(${movie.id})">
                                <div class="film-poster">
                                    <img src="${movie.poster}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/342x513?text=No+Poster'">
                                    <div class="film-rating">
                                        <i class="fas fa-star"></i> ${movie.rating.toFixed(1)}
                                    </div>
                                </div>
                                <div class="film-info">
                                    <p class="film-title">${movie.title}</p>
                                    <p class="film-role">${movie.role}</p>
                                    <p class="film-year">${movie.year}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- 사진 갤러리 -->
            ${person.profiles && person.profiles.length > 0 ? `
            <div class="person-section mb-6">
                <h3 class="person-section-title">
                    <i class="fas fa-images"></i>
                    ${t['photos']}
                </h3>
                <div class="person-photo-grid-container">
                    <div class="person-photo-grid">
                        ${person.profiles.map(photo => `
                            <div class="photo-item" onclick="window.open('${photo.path}', '_blank')">
                                <img src="${photo.thumb}" alt="${person.name}" loading="lazy">
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- 타임라인 -->
            <div class="person-section mb-6">
                <h3 class="person-section-title">
                    <i class="fas fa-history"></i>
                    ${t['timeline']}
                </h3>
                <div class="person-timeline">
                    ${person.actingTimeline.slice(0, 15).map(item => `
                        <div class="timeline-item">
                            <span class="timeline-year">${item.year}</span>
                            <div class="timeline-content">
                                <span class="timeline-title">${item.title}</span>
                                <span class="timeline-char">${item.character}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="person-actions mt-8">
                <a href="https://www.themoviedb.org/person/${person.id}" target="_blank" class="person-tmdb-link">
                    <i class="fas fa-external-link-alt mr-1"></i>
                    ${t['person-tmdb']}
                </a>
            </div>
        </div>
    `;
}

function closePersonModal() {
    elements.personModal.classList.add('hidden');
    if (elements.modal.classList.contains('hidden') && elements.splashModal.classList.contains('hidden')) {
        document.body.style.overflow = '';
    }
}

// ============= Splash Modal Functions =============
function openSplashModal() {
    elements.splashModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeSplashModal() {
    elements.splashModal.classList.add('hidden');
    if (elements.modal.classList.contains('hidden') && elements.personModal.classList.contains('hidden') && elements.apiModal.classList.contains('hidden')) {
        document.body.style.overflow = '';
    }
}

// ============= External Actions =============
function searchTrailer(query) {
    const searchQuery = encodeURIComponent(query);
    window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, '_blank');
}

function searchTicket(movieTitle) {
    const t = TRANSLATIONS[currentLanguage];
    const searchQuery = encodeURIComponent(movieTitle + t['ticket-search']);
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
}

function shareMovie(movieTitle) {
    const t = TRANSLATIONS[currentLanguage];
    if (navigator.share) {
        navigator.share({
            title: `🎬 ${movieTitle}`,
            text: `${t['app-title']}: ${movieTitle}`,
            url: window.location.href
        }).catch(err => console.log('Share failed', err));
    } else {
        const text = `🎬 ${movieTitle} - ${t['app-title']}! ${window.location.href}`;
        navigator.clipboard.writeText(text).then(() => {
            alert(t['copied']);
        });
    }
}

// ============= Event Listeners =============
function initEventListeners() {
    // 테마 토글
    elements.themeToggle?.addEventListener('click', toggleTheme);

    // 다국어 토글
    const langBtn = document.getElementById('lang-toggle');
    langBtn?.addEventListener('click', toggleLanguage);

    // 필터 패널 토글
    elements.filterBtn?.addEventListener('click', () => {
        elements.filterPanel?.classList.toggle('hidden');
    });

    // 기간 필터 선택
    elements.periodFilters?.addEventListener('click', (e) => {
        const btn = e.target.closest('.period-btn');
        if (btn) {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const period = btn.dataset.period;

            if (period === 'custom') {
                elements.customDateRange?.classList.remove('hidden');
            } else {
                elements.customDateRange?.classList.add('hidden');
                applyPeriodFilter(period);
            }
        }
    });

    // 기간검색 적용
    elements.applyDateRange?.addEventListener('click', () => {
        const startDate = elements.dateStart?.value;
        const endDate = elements.dateEnd?.value;

        if (startDate && endDate) {
            applyPeriodFilter('custom', startDate, endDate);
        } else {
            alert('시작일과 종료일을 모두 선택해주세요.');
        }
    });

    // 장르 필터 선택
    elements.genreFilters?.addEventListener('click', (e) => {
        const btn = e.target.closest('.genre-btn');
        if (btn) {
            document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const genre = btn.dataset.genre;
            currentFilter = genre;
            renderMovieGrid(genre);
        }
    });

    // ESC 키 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closePersonModal();
            closeSplashModal();
            closeApiModal();
        }
    });

    // 검색 엔터키
    elements.searchInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // 검색 버튼 클릭
    elements.searchBtn?.addEventListener('click', handleSearch);
    
    // 설정 버튼 바인딩
    elements.settingsBtn?.addEventListener('click', openApiModal);
    elements.saveApiBtn?.addEventListener('click', saveApiCredentials);
    elements.clearApiBtn?.addEventListener('click', clearApiCredentials);
}
