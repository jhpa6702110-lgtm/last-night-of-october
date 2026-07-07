/**
 * 🔐 TMDB API Configuration
 * 이 파일은 기본 설정을 제공하며, 브라우저 LocalStorage에서 사용자의 API Key 및 Token을 동적으로 불러올 수 있습니다.
 */
const DEFAULT_KEY = "d008251cb8ae9d6eb36ff317e47e5ffd";
const DEFAULT_TOKEN = "YOUR_TMDB_ACCESS_TOKEN_HERE";

const TMDB_CONFIG = {
    // Bearer Token (읽기 액세스 토큰)
    accessToken: localStorage.getItem('tmdb_access_token') || DEFAULT_TOKEN,

    // API 키 (대체 인증 방식)
    apiKey: localStorage.getItem('tmdb_api_key') || DEFAULT_KEY,

    // Base URLs
    baseUrl: "https://api.themoviedb.org/3",
    imageBaseUrl: "https://image.tmdb.org/t/p",

    // Image sizes
    posterSize: "w500",
    backdropSize: "original",

    // 기본 설정
    language: "ko-KR",
    region: "KR"
};

/**
 * API 키가 올바르게 설정되었는지 확인
 */
function hasValidApiKey() {
    const hasKey = TMDB_CONFIG.apiKey && 
                   TMDB_CONFIG.apiKey !== "YOUR_TMDB_API_KEY_HERE" && 
                   TMDB_CONFIG.apiKey.trim() !== "";
    const hasToken = TMDB_CONFIG.accessToken && 
                     TMDB_CONFIG.accessToken !== "YOUR_TMDB_ACCESS_TOKEN_HERE" && 
                     TMDB_CONFIG.accessToken.trim() !== "";
    return hasKey || hasToken;
}

/**
 * LocalStorage에 API 키 저장
 */
function saveApiKey(apiKey, accessToken) {
    if (apiKey) {
        localStorage.setItem('tmdb_api_key', apiKey.trim());
        TMDB_CONFIG.apiKey = apiKey.trim();
    } else {
        localStorage.removeItem('tmdb_api_key');
        TMDB_CONFIG.apiKey = DEFAULT_KEY;
    }
    
    if (accessToken) {
        localStorage.setItem('tmdb_access_token', accessToken.trim());
        TMDB_CONFIG.accessToken = accessToken.trim();
    } else {
        localStorage.removeItem('tmdb_access_token');
        TMDB_CONFIG.accessToken = DEFAULT_TOKEN;
    }
}

/**
 * LocalStorage에서 API 키 삭제
 */
function clearApiKey() {
    localStorage.removeItem('tmdb_api_key');
    localStorage.removeItem('tmdb_access_token');
    TMDB_CONFIG.apiKey = DEFAULT_KEY;
    TMDB_CONFIG.accessToken = DEFAULT_TOKEN;
}
