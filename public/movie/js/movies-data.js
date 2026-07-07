/**
 * 🎬 영화 개봉 정보 - TMDB API 연동 및 데이터 처리
 * 
 * API Reference: https://developer.themoviedb.org/reference/getting-started
 */

// ============= TMDB API 설정 (js/config.js에서 로드됨) =============
if (typeof TMDB_CONFIG === 'undefined') {
    console.error('❌ TMDB_CONFIG가 정의되지 않았습니다. js/config.js 파일을 확인해주세요.');
}

/**
 * TMDB API 설정 업데이트 (다국어 지원)
 */
function updateTmdbConfig(lang) {
    if (lang === 'en') {
        TMDB_CONFIG.language = "en-US";
        TMDB_CONFIG.region = "US";
    } else {
        TMDB_CONFIG.language = "ko-KR";
        TMDB_CONFIG.region = "KR";
    }
}

// ============= TMDB 장르 ID 매핑 (한국어/영어) =============
const TMDB_GENRE_MAP = {
    ko: {
        28: "액션", 12: "모험", 16: "애니메이션", 35: "코미디", 80: "범죄",
        99: "다큐멘터리", 18: "드라마", 10751: "가족", 14: "판타지", 40: "역사",
        27: "공포", 10402: "음악", 9648: "미스터리", 10749: "로맨스",
        878: "SF", 10770: "TV 영화", 53: "스릴러", 10752: "전쟁", 37: "서부"
    },
    en: {
        28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
        99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 40: "History",
        27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance",
        878: "Science Fiction", 10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western"
    }
};

// 필터용 장르 매핑 (영어 키 -> 현재 언어)
const GENRE_MAPS = {
    ko: {
        action: "액션", drama: "드라마", comedy: "코미디", horror: "공포",
        animation: "애니메이션", sf: "SF", thriller: "스릴러", fantasy: "판타지",
        musical: "음악", adventure: "모험", history: "역사", romance: "로맨스",
        mystery: "미스터리", crime: "범죄", family: "가족", war: "전쟁"
    },
    en: {
        action: "Action", drama: "Drama", comedy: "Comedy", horror: "Horror",
        animation: "Animation", sf: "SF", thriller: "Thriller", fantasy: "Fantasy",
        musical: "Musical", adventure: "Adventure", history: "History", romance: "Romance",
        mystery: "Mystery", crime: "Crime", family: "Family", war: "War"
    }
};

let GENRE_MAP = GENRE_MAPS.ko;

// ============= 전역 영화 데이터 =============
let MOVIES_DATA = [];
let ALL_MOVIES_DATA = [];

// ============= API 요청 헬퍼 =============
async function tmdbFetch(endpoint, params = {}) {
    if (!hasValidApiKey()) {
        throw new Error("API_KEY_MISSING");
    }

    const url = new URL(`${TMDB_CONFIG.baseUrl}${endpoint}`);
    url.searchParams.append('language', TMDB_CONFIG.language);

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.append(key, value);
        }
    });

    const headers = { 'Content-Type': 'application/json' };
    
    // Access Token이 제공된 경우 우선 적용, 아닐 경우 Api Key 적용
    const hasToken = TMDB_CONFIG.accessToken && 
                     TMDB_CONFIG.accessToken !== "YOUR_TMDB_ACCESS_TOKEN_HERE" && 
                     TMDB_CONFIG.accessToken.trim() !== "";
    
    if (hasToken) {
        headers['Authorization'] = `Bearer ${TMDB_CONFIG.accessToken}`;
    } else {
        const hasKey = TMDB_CONFIG.apiKey && 
                       TMDB_CONFIG.apiKey !== "YOUR_TMDB_API_KEY_HERE" && 
                       TMDB_CONFIG.apiKey.trim() !== "";
        if (hasKey) {
            url.searchParams.append('api_key', TMDB_CONFIG.apiKey);
        }
    }

    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`TMDB API Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('TMDB API 호출 실패:', error);
        throw error;
    }
}

// ============= 영화 목록 API =============

async function fetchNowPlayingMovies(page = 1) {
    return await tmdbFetch('/movie/now_playing', {
        region: TMDB_CONFIG.region,
        page: page
    });
}

async function fetchUpcomingMovies(page = 1) {
    return await tmdbFetch('/movie/upcoming', {
        region: TMDB_CONFIG.region,
        page: page
    });
}

async function fetchPopularMovies(page = 1) {
    return await tmdbFetch('/movie/popular', {
        region: TMDB_CONFIG.region,
        page: page
    });
}

async function fetchMovieDetails(movieId) {
    return await tmdbFetch(`/movie/${movieId}`, {
        append_to_response: 'credits,videos,release_dates'
    });
}

async function fetchMovieCredits(movieId) {
    return await tmdbFetch(`/movie/${movieId}/credits`);
}

async function fetchPersonDetails(personId, lang = null) {
    const params = {
        append_to_response: 'combined_credits,images'
    };
    if (lang) params.language = lang;

    return await tmdbFetch(`/person/${personId}`, params);
}

async function fetchMovieVideos(movieId) {
    try {
        // 한국어 비디오 우선 조회
        let data = await tmdbFetch(`/movie/${movieId}/videos`);

        // 한국어 예고편이 없으면 영어로 재조회
        if (!data.results || data.results.length === 0) {
            const hasToken = TMDB_CONFIG.accessToken && 
                             TMDB_CONFIG.accessToken !== "YOUR_TMDB_ACCESS_TOKEN_HERE" && 
                             TMDB_CONFIG.accessToken.trim() !== "";
            const url = new URL(`${TMDB_CONFIG.baseUrl}/movie/${movieId}/videos`);
            url.searchParams.append('language', 'en-US');

            const headers = { 'Content-Type': 'application/json' };
            if (hasToken) {
                headers['Authorization'] = `Bearer ${TMDB_CONFIG.accessToken}`;
            } else {
                url.searchParams.append('api_key', TMDB_CONFIG.apiKey);
            }

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: headers
            });
            data = await response.json();
        }

        return data;
    } catch (error) {
        console.error('영화 비디오 정보 로딩 실패:', error);
        return { results: [] };
    }
}

/**
 * 예고편 필터링 (YouTube 트레일러 우선순위 지정)
 */
function filterTrailers(videos) {
    if (!videos || !videos.results) return [];

    // YouTube 비디오만 필터링
    const youtubeVideos = videos.results.filter(v => v.site === 'YouTube');

    // 우선순위: Trailer > Teaser > Clip > Featurette
    const priority = ['Trailer', 'Teaser', 'Clip', 'Featurette', 'Behind the Scenes'];

    const officialTrailer = youtubeVideos.find(v =>
        v.type === 'Trailer' && (v.official === true || v.name.toLowerCase().includes('official'))
    );

    if (officialTrailer) {
        return [officialTrailer, ...youtubeVideos.filter(v => v.id !== officialTrailer.id)];
    }

    youtubeVideos.sort((a, b) => {
        const aIndex = priority.indexOf(a.type);
        const bIndex = priority.indexOf(b.type);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    return youtubeVideos;
}

// ============= 데이터 변환 =============

function transformMovieData(movie, details = null) {
    const currentLang = TMDB_CONFIG.language.split('-')[0]; // 'ko' or 'en'
    const isKo = currentLang === 'ko';

    // 한국 영화 판별 (제작 국가 또는 원어가 한국어인 경우)
    const isKorean = movie.original_language === 'ko' ||
        (details?.production_countries?.some(c => c.iso_3166_1 === 'KR'));

    // 국가 정보 변환
    let country = isKo ? '미국' : 'USA';
    if (isKorean) {
        country = isKo ? '한국' : 'South Korea';
    } else if (details?.production_countries?.length > 0) {
        const countryMapKo = {
            'US': '미국', 'GB': '영국', 'FR': '프랑스', 'JP': '일본',
            'CN': '중국', 'DE': '독일', 'IT': '이탈리아', 'ES': '스페인',
            'IN': '인도', 'AU': '호주', 'CA': '캐나다', 'NZ': '뉴질랜드'
        };
        const countryMapEn = {
            'US': 'USA', 'GB': 'UK', 'FR': 'France', 'JP': 'Japan',
            'CN': 'China', 'DE': 'Germany', 'IT': 'Italy', 'ES': 'Spain',
            'IN': 'India', 'AU': 'Australia', 'CA': 'Canada', 'NZ': 'New Zealand'
        };
        const countryMap = isKo ? countryMapKo : countryMapEn;
        const mainCountry = details.production_countries[0].iso_3166_1;
        country = countryMap[mainCountry] || details.production_countries[0].name;
    }

    // 장르 변환
    const langGenres = TMDB_GENRE_MAP[currentLang] || TMDB_GENRE_MAP['en'];
    const genres = (movie.genre_ids || details?.genres?.map(g => g.id) || [])
        .map(id => langGenres[id])
        .filter(Boolean);

    // 감독 정보
    let director = isKo ? '정보 없음' : 'Unknown';
    if (details?.credits?.crew) {
        const directorInfo = details.credits.crew.find(c => c.job === 'Director');
        if (directorInfo) director = directorInfo.name;
    }

    // 출연진 정보 (상위 8명)
    let cast = [];
    if (details?.credits?.cast) {
        cast = details.credits.cast.slice(0, 8).map(c => c.name);
    }

    // 출연진 상세 정보 (프로필 이미지 포함)
    let castDetails = [];
    if (details?.credits?.cast) {
        castDetails = details.credits.cast.slice(0, 8).map(c => ({
            id: c.id,
            name: c.name,
            character: c.character || '',
            profilePath: c.profile_path
                ? `${TMDB_CONFIG.imageBaseUrl}/w185${c.profile_path}`
                : null,
            order: c.order
        }));
    }

    // 감독 상세 정보
    let directorDetails = null;
    if (details?.credits?.crew) {
        const directorInfo = details.credits.crew.find(c => c.job === 'Director');
        if (directorInfo) {
            directorDetails = {
                id: directorInfo.id,
                name: directorInfo.name,
                profilePath: directorInfo.profile_path
                    ? `${TMDB_CONFIG.imageBaseUrl}/w185${directorInfo.profile_path}`
                    : null
            };
        }
    }

    return {
        id: movie.id,
        title: movie.title || movie.name,
        originalTitle: movie.original_title || movie.original_name,
        releaseDate: movie.release_date,
        poster: movie.poster_path
            ? `${TMDB_CONFIG.imageBaseUrl}/${TMDB_CONFIG.posterSize}${movie.poster_path}`
            : 'https://via.placeholder.com/500x750?text=No+Poster',
        backdrop: movie.backdrop_path
            ? `${TMDB_CONFIG.imageBaseUrl}/${TMDB_CONFIG.backdropSize}${movie.backdrop_path}`
            : null,
        rating: movie.vote_average || 0,
        runtime: details?.runtime || 0,
        country: country,
        isKorean: isKorean,
        genres: genres,
        director: director,
        directorDetails: directorDetails,
        cast: cast,
        castDetails: castDetails,
        overview: movie.overview || (isKo ? '줄거리 정보가 없습니다.' : 'Overview not available.'),
        popularity: movie.popularity || 0,
        voteCount: movie.vote_count || 0,
        videos: details?.videos ? filterTrailers(details.videos) : [],
        featured: false
    };
}

function transformPersonData(person) {
    const isKo = TMDB_CONFIG.language.split('-')[0] === 'ko';

    // 출연작 처리
    const credits = person.combined_credits?.cast || [];
    const actingTimeline = credits
        .filter(m => m.release_date || m.first_air_date)
        .sort((a, b) => {
            const dateA = new Date(a.release_date || a.first_air_date);
            const dateB = new Date(b.release_date || b.first_air_date);
            return dateB - dateA;
        })
        .map(m => ({
            id: m.id,
            title: m.title || m.name,
            year: new Date(m.release_date || m.first_air_date).getFullYear(),
            character: m.character || '',
            mediaType: m.media_type
        }));

    // 주요 출연작 (인기순 상위 10개)
    const filmography = credits
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 10)
        .map(m => ({
            id: m.id,
            title: m.title || m.name,
            role: m.character || m.job || '',
            poster: m.poster_path
                ? `${TMDB_CONFIG.imageBaseUrl}/w342${m.poster_path}`
                : 'https://via.placeholder.com/342x513?text=No+Poster',
            rating: m.vote_average || 0,
            year: (m.release_date || m.first_air_date || '').split('-')[0]
        }));

    // 프로필 사진 갤러리 (최대 12장)
    const profiles = (person.images?.profiles || [])
        .slice(0, 12)
        .map(img => ({
            aspectRatio: img.aspect_ratio,
            path: `${TMDB_CONFIG.imageBaseUrl}/h632${img.file_path}`,
            thumb: `${TMDB_CONFIG.imageBaseUrl}/w185${img.file_path}`
        }));

    return {
        id: person.id,
        name: person.name,
        originalName: person.name,
        biography: person.biography || (isKo ? '등록된 약력이 없습니다.' : 'No biography available.'),
        profilePath: person.profile_path
            ? `${TMDB_CONFIG.imageBaseUrl}/h632${person.profile_path}`
            : null,
        birthday: person.birthday,
        placeOfBirth: person.place_of_birth,
        actingTimeline,
        filmography,
        profiles
    };
}

// ============= 개봉 기간 필터링 =============

function filterThisWeekMovies(movies) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // 이번 주 일요일

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // 이번 주 토요일

    // 다음 주까지도 포함해 풍부한 데이터 노출
    const extendedEnd = new Date(weekEnd);
    extendedEnd.setDate(weekEnd.getDate() + 7);

    return movies.filter(movie => {
        if (!movie.releaseDate) return false;
        const releaseDate = new Date(movie.releaseDate);
        const twoWeeksAgo = new Date(today);
        twoWeeksAgo.setDate(today.getDate() - 14);

        return releaseDate >= twoWeeksAgo && releaseDate <= extendedEnd;
    });
}

function filterMoviesByPeriod(period, startDate = null, endDate = null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filterStart, filterEnd;

    switch (period) {
        case 'week':
            filterStart = new Date(today);
            filterStart.setDate(today.getDate() - today.getDay() - 7);
            filterEnd = new Date(today);
            filterEnd.setDate(today.getDate() + (6 - today.getDay()) + 7);
            break;

        case 'month':
            filterStart = new Date(today.getFullYear(), today.getMonth(), 1);
            filterEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;

        case 'year':
            filterStart = new Date(today.getFullYear(), 0, 1);
            filterEnd = new Date(today.getFullYear(), 11, 31);
            break;

        case 'custom':
            filterStart = startDate ? new Date(startDate) : new Date(today.getFullYear(), 0, 1);
            filterEnd = endDate ? new Date(endDate) : today;
            break;

        default:
            filterStart = new Date(today);
            filterStart.setDate(today.getDate() - 14);
            filterEnd = new Date(today);
            filterEnd.setDate(today.getDate() + 14);
    }

    filterStart.setHours(0, 0, 0, 0);
    filterEnd.setHours(23, 59, 59, 999);

    const filtered = ALL_MOVIES_DATA.filter(movie => {
        if (!movie.releaseDate) return false;
        const releaseDate = new Date(movie.releaseDate);
        return releaseDate >= filterStart && releaseDate <= filterEnd;
    });

    filtered.sort((a, b) => {
        const dateA = new Date(a.releaseDate || '1900-01-01');
        const dateB = new Date(b.releaseDate || '1900-01-01');
        return dateB - dateA;
    });

    // Featured 영화 재설정
    if (filtered.length > 0) {
        filtered.forEach(m => m.featured = false);
        const mostPopular = filtered.reduce((prev, current) =>
            (prev.popularity > current.popularity) ? prev : current
        );
        mostPopular.featured = true;
    }

    MOVIES_DATA = filtered;
    console.log(`📅 ${period} 기간 필터 결과: ${filtered.length}개 영화`);
    return filtered;
}

// ============= 메인 데이터 로딩 함수 =============

async function loadAllMovies() {
    if (!hasValidApiKey()) {
        console.warn('⚠️ 유효한 API Key가 없습니다. 폴백 데이터를 로드합니다.');
        return useFallbackData();
    }

    console.log('🎬 TMDB API에서 영화 데이터 로딩 중...');

    try {
        const [nowPlayingData, upcomingData] = await Promise.all([
            fetchNowPlayingMovies(),
            fetchUpcomingMovies()
        ]);

        const movieIds = new Set();
        const allMovies = [];

        // 현재 상영작 추가
        for (const movie of nowPlayingData.results || []) {
            if (!movieIds.has(movie.id)) {
                movieIds.add(movie.id);
                allMovies.push(movie);
            }
        }

        // 개봉 예정작 추가
        for (const movie of upcomingData.results || []) {
            if (!movieIds.has(movie.id)) {
                movieIds.add(movie.id);
                allMovies.push(movie);
            }
        }

        let transformedMovies = allMovies.map(movie => transformMovieData(movie));

        transformedMovies.sort((a, b) => {
            const dateA = new Date(a.releaseDate || '1900-01-01');
            const dateB = new Date(b.releaseDate || '1900-01-01');
            return dateB - dateA;
        });

        const thisWeekMovies = filterThisWeekMovies(transformedMovies);
        MOVIES_DATA = thisWeekMovies.length > 0 ? thisWeekMovies : transformedMovies.slice(0, 20);

        if (MOVIES_DATA.length > 0) {
            const mostPopular = MOVIES_DATA.reduce((prev, current) =>
                (prev.popularity > current.popularity) ? prev : current
            );
            mostPopular.featured = true;
        }

        return MOVIES_DATA;
    } catch (error) {
        console.error('❌ 영화 데이터 로딩 실패:', error);
        return useFallbackData();
    }
}

async function loadExtendedMovies() {
    if (!hasValidApiKey()) {
        console.warn('⚠️ 유효한 API Key가 없습니다. 폴백 데이터를 로드합니다.');
        return useFallbackData();
    }

    console.log('🎬 확장 영화 데이터 로딩 중...');

    try {
        const [
            nowPlaying1, nowPlaying2,
            upcoming1, upcoming2,
            popular1,
            tmdbStats
        ] = await Promise.all([
            fetchNowPlayingMovies(1),
            fetchNowPlayingMovies(2),
            fetchUpcomingMovies(1),
            fetchUpcomingMovies(2),
            fetchPopularMovies(1),
            fetchTMDBTotalStats()
        ]);

        const movieIds = new Set();
        const allMovies = [];

        const addMovies = (results) => {
            for (const movie of results || []) {
                if (!movieIds.has(movie.id)) {
                    movieIds.add(movie.id);
                    allMovies.push(movie);
                }
            }
        };

        addMovies(nowPlaying1.results);
        addMovies(nowPlaying2.results);
        addMovies(upcoming1.results);
        addMovies(upcoming2.results);
        addMovies(popular1.results);

        ALL_MOVIES_DATA = allMovies.map(movie => transformMovieData(movie));

        ALL_MOVIES_DATA.sort((a, b) => {
            const dateA = new Date(a.releaseDate || '1900-01-01');
            const dateB = new Date(b.releaseDate || '1900-01-01');
            return dateB - dateA;
        });

        // 기본값: 이번 주 개봉작 필터링
        filterMoviesByPeriod('week');
        return MOVIES_DATA;

    } catch (error) {
        console.error('❌ 확장 영화 데이터 로딩 실패:', error);
        return useFallbackData();
    }
}

async function loadMovieDetails(movieId) {
    // 폴백 모드 영화 체크
    const fallbackMovie = FALLBACK_MOVIES.find(m => m.id === movieId);
    if (fallbackMovie && !hasValidApiKey()) {
        return fallbackMovie;
    }

    try {
        const details = await fetchMovieDetails(movieId);
        const movieIndex = MOVIES_DATA.findIndex(m => m.id === movieId);

        if (movieIndex !== -1) {
            const updatedMovie = transformMovieData(details, details);
            updatedMovie.featured = MOVIES_DATA[movieIndex].featured;
            MOVIES_DATA[movieIndex] = updatedMovie;
            return updatedMovie;
        }

        return transformMovieData(details, details);
    } catch (error) {
        console.error('영화 상세 정보 로딩 실패:', error);
        return MOVIES_DATA.find(m => m.id === movieId) || fallbackMovie;
    }
}

async function loadPersonDetails(personId) {
    // 폴백 모드 인물 정보 연동
    if (!hasValidApiKey()) {
        const fallbackPerson = FALLBACK_PEOPLE[personId];
        if (fallbackPerson) return fallbackPerson;
        throw new Error("PERSON_NOT_FOUND_IN_FALLBACK");
    }

    try {
        let data = await fetchPersonDetails(personId);

        // 한국어 약력이 없는 경우 영어 데이터 조회
        const isKo = TMDB_CONFIG.language.split('-')[0] === 'ko';
        if (isKo && (!data.biography || data.biography.trim() === "")) {
            console.log(`ℹ️ ${data.name}의 한국어 약력이 없어 영어 데이터를 요청합니다.`);
            const enData = await fetchPersonDetails(personId, 'en-US');
            if (enData.biography && enData.biography.trim() !== "") {
                data.biography = enData.biography;
            }
        }

        return transformPersonData(data);
    } catch (error) {
        console.error('인물 상세 정보 로딩 실패:', error);
        throw error;
    }
}

async function loadMovieVideos(movieId) {
    if (!hasValidApiKey()) {
        const fallbackMovie = FALLBACK_MOVIES.find(m => m.id === movieId);
        return fallbackMovie ? fallbackMovie.videos : [];
    }

    try {
        const videos = await fetchMovieVideos(movieId);
        const trailers = filterTrailers(videos);

        const movieIndex = MOVIES_DATA.findIndex(m => m.id === movieId);
        if (movieIndex !== -1) {
            MOVIES_DATA[movieIndex].videos = trailers;
        }

        return trailers;
    } catch (error) {
        console.error('비디오 로딩 실패:', error);
        return [];
    }
}

async function searchMovies(query) {
    if (!query) return [];
    if (!hasValidApiKey()) {
        // 폴백 모드 검색: 제목 또는 장르에서 필터링
        const filtered = FALLBACK_MOVIES.filter(m => 
            m.title.toLowerCase().includes(query.toLowerCase()) || 
            m.originalTitle.toLowerCase().includes(query.toLowerCase()) ||
            m.genres.some(g => g.includes(query))
        );
        MOVIES_DATA = filtered;
        return filtered;
    }

    try {
        const url = `${TMDB_CONFIG.baseUrl}/search/movie?language=${TMDB_CONFIG.language}&query=${encodeURIComponent(query)}&page=1&include_adult=false&region=${TMDB_CONFIG.region}`;
        
        const hasToken = TMDB_CONFIG.accessToken && 
                         TMDB_CONFIG.accessToken !== "YOUR_TMDB_ACCESS_TOKEN_HERE" && 
                         TMDB_CONFIG.accessToken.trim() !== "";
        
        const headers = { 'Content-Type': 'application/json' };
        let finalUrl = url;
        
        if (hasToken) {
            headers['Authorization'] = `Bearer ${TMDB_CONFIG.accessToken}`;
        } else {
            finalUrl += `&api_key=${TMDB_CONFIG.apiKey}`;
        }

        const response = await fetch(finalUrl, { headers });
        const data = await response.json();

        if (!data.results) return [];

        const transformed = data.results.map(movie => transformMovieData(movie));

        transformed.forEach(movie => {
            if (!ALL_MOVIES_DATA.some(m => m.id === movie.id)) {
                ALL_MOVIES_DATA.push(movie);
            }
        });

        MOVIES_DATA = transformed;
        return transformed;
    } catch (error) {
        console.error('영화 검색 실패:', error);
        return [];
    }
}

// ============= TMDB 전체 데이터 규모 통계 =============
let TMDB_TOTAL_STATS = {
    totalMovies: 1040000,
    totalCountries: 195
};

async function fetchTMDBTotalStats() {
    if (!hasValidApiKey()) return TMDB_TOTAL_STATS;

    try {
        const [countriesData, latestMovie] = await Promise.all([
            tmdbFetch('/configuration/countries'),
            tmdbFetch('/movie/latest')
        ]);

        if (countriesData && countriesData.length > 0) {
            TMDB_TOTAL_STATS.totalCountries = countriesData.length;
        }

        if (latestMovie && latestMovie.id) {
            TMDB_TOTAL_STATS.totalMovies = latestMovie.id;
        }

        return TMDB_TOTAL_STATS;
    } catch (error) {
        console.warn('통계 정보 로드 실패 (기존 통계 유지):', error);
        return TMDB_TOTAL_STATS;
    }
}

function getGlobalStats() {
    return {
        totalMovies: TMDB_TOTAL_STATS.totalMovies,
        totalCountries: TMDB_TOTAL_STATS.totalCountries,
        countries: []
    };
}

function getCurrentStats() {
    const korean = MOVIES_DATA.filter(m => m.isKorean).length;
    const foreign = MOVIES_DATA.length - korean;

    return {
        total: MOVIES_DATA.length,
        korean: korean,
        foreign: foreign
    };
}

// ============= 고품질 폴백 데이터 (오프라인/무인증 모드 데모용) =============
const FALLBACK_MOVIES = [
    {
        id: 939243,
        title: "크레이븐 더 헌터",
        originalTitle: "Kraven the Hunter",
        releaseDate: "2024-12-11",
        poster: "https://image.tmdb.org/t/p/w500/i47IUSsN126K11JUzqQIOi1Mg1M.jpg",
        backdrop: "https://image.tmdb.org/t/p/original/v9Du2HC3hlknAvGlWhquRbeifwW.jpg",
        rating: 6.6,
        runtime: 127,
        country: "미국",
        isKorean: false,
        genres: ["액션", "SF", "스릴러"],
        director: "J.C. 챈더",
        directorDetails: { id: 74681, name: "J.C. Chandor", profilePath: "https://image.tmdb.org/t/p/w185/87r61C1e0iWqT9TqL5jUXm9G5mE.jpg" },
        cast: ["아론 테일러-존슨", "아리아나 드보즈", "프레드 헥킹거", "러셀 크로우"],
        castDetails: [
            { id: 2038, name: "Aaron Taylor-Johnson", character: "Sergei Kravinoff / Kraven", profilePath: "https://image.tmdb.org/t/p/w185/o85uq9Fj752HXYq5Y0T5119tP9.jpg" },
            { id: 1618683, name: "Ariana DeBose", character: "Calypso", profilePath: "https://image.tmdb.org/t/p/w185/hJdYt5WjJzH70Dksn5iicqK2nU9.jpg" },
            { id: 1845187, name: "Fred Hechinger", character: "Dmitri Smerdyakov / Chameleon", profilePath: "https://image.tmdb.org/t/p/w185/b5yYq5kM4BfE60iWn8t0r7V2U5o.jpg" },
            { id: 934, name: "Russell Crowe", character: "Nikolai Kravinoff", profilePath: "https://image.tmdb.org/t/p/w185/A8AOlK9GfP7G21GzT68e2t5F9mE.jpg" }
        ],
        overview: "세상을 바꿀 최강의 사냥꾼 크레이븐 더 헌터가 마블 스파이더맨 빌런 유니버스에 합류한다. 아버지 밑에서 자란 야만적이고 피비린내 나는 과거, 그리고 그가 마주한 진정한 거대 음모의 실체가 마침내 공개된다.",
        popularity: 1520.4,
        voteCount: 382,
        videos: [{ id: "fallback-v1", key: "zle9h9gM15c", name: "크레이븐 더 헌터 공식 예고편", site: "YouTube", type: "Trailer" }],
        featured: true
    },
    {
        id: 1022789,
        title: "모아나 2",
        originalTitle: "Moana 2",
        releaseDate: "2024-11-27",
        poster: "https://image.tmdb.org/t/p/w500/m04p1w7V0FmH3k2b86g5i2c1Q6g.jpg",
        backdrop: "https://image.tmdb.org/t/p/original/tE82402mH3k2b86g5i2c1Q6g.jpg",
        rating: 7.2,
        runtime: 100,
        country: "미국",
        isKorean: false,
        genres: ["애니메이션", "모험", "가족"],
        director: "데이빗 G. 데릭 주니어",
        directorDetails: { id: 1857999, name: "David G. Derrick Jr.", profilePath: null },
        cast: ["아우이 크라발호", "드웨인 존슨", "템uera 모리슨"],
        castDetails: [
            { id: 1561081, name: "Auli'i Cravalho", character: "Moana (voice)", profilePath: "https://image.tmdb.org/t/p/w185/n2lMIdqF0pQy7N4r7hUXm9G5mE.jpg" },
            { id: 18918, name: "Dwayne Johnson", character: "Maui (voice)", profilePath: "https://image.tmdb.org/t/p/w185/kuq7t5WjJzH70Dksn5iicqK2nU9.jpg" }
        ],
        overview: "조상들로부터 의문의 부름을 받은 모아나가 반신반인 마우이와 함께 새로운 항해를 떠난다. 오세아니아의 미개척 바다를 탐험하며 강력한 신비로운 전설의 괴물들을 만나는 경이로운 모험.",
        popularity: 920.8,
        voteCount: 512,
        videos: [{ id: "fallback-v2", key: "hDZ7y8fK15c", name: "모아나 2 메인 예고편", site: "YouTube", type: "Trailer" }],
        featured: false
    },
    {
        id: 558449,
        title: "글래디에이터 II",
        originalTitle: "Gladiator II",
        releaseDate: "2024-11-13",
        poster: "https://image.tmdb.org/t/p/w500/hJdYt5WjJzH70Dksn5iicqK2nU9.jpg",
        backdrop: "https://image.tmdb.org/t/p/original/v9Du2HC3hlknAvGlWhquRbeifwW.jpg",
        rating: 6.8,
        runtime: 148,
        country: "영국",
        isKorean: false,
        genres: ["액션", "드라마", "역사"],
        director: "리들리 스콧",
        directorDetails: { id: 578, name: "Ridley Scott", profilePath: "https://image.tmdb.org/t/p/w185/68735-090bea2cedf32faa.jpg" },
        cast: ["폴 메스칼", "페드로 파스칼", "덴젤 워싱턴", "코니 닐슨"],
        castDetails: [
            { id: 2577903, name: "Paul Mescal", character: "Lucius", profilePath: "https://image.tmdb.org/t/p/w185/o85uq9Fj752HXYq5Y0T5119tP9.jpg" },
            { id: 1253360, name: "Pedro Pascal", character: "Marcus Acacius", profilePath: "https://image.tmdb.org/t/p/w185/kuq7t5WjJzH70Dksn5iicqK2nU9.jpg" }
        ],
        overview: "위대한 검투사 막시무스의 죽음으로부터 20여 년이 흐른 로마. 황제들의 폭압 아래 콜로세움의 검투사로 거듭난 루시우스가 로마의 영광을 되찾기 위해 거대한 운명에 정면으로 맞선다.",
        popularity: 1105.2,
        voteCount: 940,
        videos: [{ id: "fallback-v3", key: "sfM7_K_K15c", name: "글래디에이터 II 공식 예고편", site: "YouTube", type: "Trailer" }],
        featured: false
    },
    {
        id: 402431,
        title: "위키드",
        originalTitle: "Wicked",
        releaseDate: "2024-11-20",
        poster: "https://image.tmdb.org/t/p/w500/yD7y8fK15cm04p1w7V0FmH3k2b86g5.jpg",
        backdrop: "https://image.tmdb.org/t/p/original/tE82402mH3k2b86g5i2c1Q6g.jpg",
        rating: 7.8,
        runtime: 160,
        country: "미국",
        isKorean: false,
        genres: ["판타지", "음악", "드라마"],
        director: "존 추",
        directorDetails: { id: 93077, name: "Jon M. Chu", profilePath: null },
        cast: ["신시아 에리보", "아리아나 그란데", "조나단 베일리"],
        castDetails: [
            { id: 1629804, name: "Cynthia Erivo", character: "Elphaba", profilePath: null },
            { id: 1172605, name: "Ariana Grande", character: "Glinda", profilePath: null }
        ],
        overview: "자신의 진짜 능력을 아직 발견하지 못한 초록색 피부의 엘파바와 야망 가득하고 인기 많은 금발 소녀 글린다가 오즈의 쉬즈 대학에서 만나 진정한 우정을 나누고 마침내 서쪽 마녀로 변화해 가는 스펙터클 판타지.",
        popularity: 840.4,
        voteCount: 302,
        videos: [{ id: "fallback-v4", key: "hDZ7y8fK15c", name: "위키드 메인 티저", site: "YouTube", type: "Trailer" }],
        featured: false
    },
    {
        id: 1150000,
        title: "하얼빈",
        originalTitle: "Harbin",
        releaseDate: "2024-12-25",
        poster: "https://image.tmdb.org/t/p/w500/i47IUSsN126K11JUzqQIOi1Mg1M.jpg", // 임시 포스터 매핑
        backdrop: "https://image.tmdb.org/t/p/original/v9Du2HC3hlknAvGlWhquRbeifwW.jpg",
        rating: 7.2,
        runtime: 120,
        country: "한국",
        isKorean: true,
        genres: ["액션", "드라마", "역사"],
        director: "우민호",
        directorDetails: { id: 1284560, name: "Woo Min-ho", profilePath: null },
        cast: ["현빈", "박정민", "조우진", "전여빈"],
        castDetails: [
            { id: 1092825, name: "Hyun Bin", character: "Ahn Jung-geun", profilePath: null },
            { id: 1285222, name: "Park Jeong-min", character: "Woo Deok-sun", profilePath: null }
        ],
        overview: "1909년, 조국을 빼앗긴 독립운동가들이 일본의 감시를 피해 하얼빈으로 향한다. 안중근 의사와 그의 동지들이 하얼빈에서 이토 히로부미를 저격하기까지 목숨을 건 비밀 요원들의 사투를 그린 대서사시.",
        popularity: 750.5,
        voteCount: 150,
        videos: [{ id: "fallback-v5", key: "zle9h9gM15c", name: "하얼빈 1차 예고편", site: "YouTube", type: "Trailer" }],
        featured: false
    }
];

// 폴백용 인물 상세 데이터 (영화에 연결된 주요 감독 및 배우 ID 맵)
const FALLBACK_PEOPLE = {
    74681: {
        id: 74681,
        name: "J.C. 챈더",
        originalName: "J.C. Chandor",
        biography: "J.C. 챈더(J.C. Chandor)는 미국의 영화 감독이자 각본가이다. 대표작으로는 금융 위기를 다룬 데뷔작 '마진 콜'(Margin Call, 2011), 로버트 레드퍼드 주연의 1인 극 '올 이즈 로스트'(All Is Lost, 2013), 범죄 드라마 '가장 폭력적인 한해'(A Most Violent Year, 2014) 등이 있다. 정밀한 서사 구조와 인간 심리의 갈등을 포착하는 데 뛰어난 연출 능력을 보여준다.",
        profilePath: "https://image.tmdb.org/t/p/w185/87r61C1e0iWqT9TqL5jUXm9G5mE.jpg",
        birthday: "1973-11-24",
        placeOfBirth: "미국 뉴저지주 모리스타운",
        profiles: [
            { aspectRatio: 0.7, path: "https://image.tmdb.org/t/p/h632/87r61C1e0iWqT9TqL5jUXm9G5mE.jpg", thumb: "https://image.tmdb.org/t/p/w185/87r61C1e0iWqT9TqL5jUXm9G5mE.jpg" }
        ],
        filmography: [
            { id: 939243, title: "크레이븐 더 헌터", role: "Director", poster: "https://image.tmdb.org/t/p/w342/i47IUSsN126K11JUzqQIOi1Mg1M.jpg", rating: 6.6, year: "2024" }
        ],
        actingTimeline: [
            { id: 939243, title: "크레이븐 더 헌터", year: 2024, character: "Director", mediaType: "movie" }
        ]
    },
    2038: {
        id: 2038,
        name: "아론 테일러-존슨",
        originalName: "Aaron Taylor-Johnson",
        biography: "아론 테일러-존슨(Aaron Taylor-Johnson)은 1990년생 영국의 배우이다. '킥 애스: 영웅의 탄생'(2010)에서 주인공 데이브 역을 맡아 이름을 널리 알렸다. 이후 '고질라'(2014), '어벤져스: 에이지 오브 울트론'(2015)에서 퀵실버(피에트로 막시모프) 역으로 열연했다. '녹터널 애니멀스'(2016)로 골든 글로브 남우조연상을 수상하며 연기력을 크게 공인받았으며, 2024년 마블 유니버스의 신작 '크레이븐 더 헌터'의 주인공 세르게이 크라비노프 역을 맡았다.",
        profilePath: "https://image.tmdb.org/t/p/w185/o85uq9Fj752HXYq5Y0T5119tP9.jpg",
        birthday: "1990-06-13",
        placeOfBirth: "영국 버킹엄셔 하이위컴",
        profiles: [
            { aspectRatio: 0.7, path: "https://image.tmdb.org/t/p/h632/o85uq9Fj752HXYq5Y0T5119tP9.jpg", thumb: "https://image.tmdb.org/t/p/w185/o85uq9Fj752HXYq5Y0T5119tP9.jpg" }
        ],
        filmography: [
            { id: 939243, title: "크레이븐 더 헌터", role: "Sergei Kravinoff", poster: "https://image.tmdb.org/t/p/w342/i47IUSsN126K11JUzqQIOi1Mg1M.jpg", rating: 6.6, year: "2024" }
        ],
        actingTimeline: [
            { id: 939243, title: "크레이븐 더 헌터", year: 2024, character: "Sergei Kravinoff", mediaType: "movie" }
        ]
    },
    934: {
        id: 934,
        name: "러셀 크로우",
        originalName: "Russell Crowe",
        biography: "러셀 크로우(Russell Crowe)는 뉴질랜드 출신의 명배우이자 영화 감독이다. 영화 '글래디에이터'(2000)에서 전사 막시무스 데시무스 메리디우스 역을 맡아 아카데미 남우주연상을 수상하며 세계적인 거장의 반열에 올랐다. '뷰티풀 마인드'(2001), '인사이더'(1999), '신데렐라 맨'(2005) 등 다수의 영화에서 선 굵고 신뢰도 높은 캐릭터 연기를 완성했다. 중후한 목소리와 깊은 연기 내공이 강점이다.",
        profilePath: "https://image.tmdb.org/t/p/w185/A8AOlK9GfP7G21GzT68e2t5F9mE.jpg",
        birthday: "1964-04-07",
        placeOfBirth: "뉴질랜드 웰링턴",
        profiles: [
            { aspectRatio: 0.7, path: "https://image.tmdb.org/t/p/h632/A8AOlK9GfP7G21GzT68e2t5F9mE.jpg", thumb: "https://image.tmdb.org/t/p/w185/A8AOlK9GfP7G21GzT68e2t5F9mE.jpg" }
        ],
        filmography: [
            { id: 939243, title: "크레이븐 더 헌터", role: "Nikolai Kravinoff", poster: "https://image.tmdb.org/t/p/w342/i47IUSsN126K11JUzqQIOi1Mg1M.jpg", rating: 6.6, year: "2024" }
        ],
        actingTimeline: [
            { id: 939243, title: "크레이븐 더 헌터", year: 2024, character: "Nikolai Kravinoff", mediaType: "movie" }
        ]
    }
};

function useFallbackData() {
    console.log('⚠️ API 키 미설정 또는 오류로 폴백 데이터를 활성화합니다.');
    MOVIES_DATA = [...FALLBACK_MOVIES];
    ALL_MOVIES_DATA = [...FALLBACK_MOVIES];
    return MOVIES_DATA;
}

// Export for module or global script tag usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MOVIES_DATA,
        ALL_MOVIES_DATA,
        GENRE_MAP,
        GENRE_MAPS,
        updateTmdbConfig,
        loadAllMovies,
        loadExtendedMovies,
        loadMovieDetails,
        loadMovieVideos,
        searchMovies,
        filterMoviesByPeriod,
        getGlobalStats,
        getCurrentStats,
        loadPersonDetails,
        useFallbackData
    };
}
