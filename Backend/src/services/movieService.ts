import tmdb from "../config/tmdb";

interface RandomPageOptions {
    excludePages?: number[];
    signal?: AbortSignal;
}

export const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
};

const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

export const endpointCache = new Map<
    string,
    {
        totalPages: number;
        expires: number;
    }
>();

export const getRandomPageData = async (
    endpoint: string,
    options?: RandomPageOptions
) => {
    const {
        excludePages = [],
        signal,
    } = options ?? {};

    let cached = endpointCache.get(endpoint);

    let firstResponse;

    if (!cached || cached.expires < Date.now()) {
        firstResponse = await tmdb.get(endpoint, { signal });

        cached = {
            totalPages: Math.min(firstResponse.data.total_pages, 500),
            expires: Date.now() + CACHE_DURATION,
        };

        endpointCache.set(endpoint, cached);
    }

    const usedPages =
        excludePages.length >= cached.totalPages
            ? []
            : excludePages;


    let selectedPage: number;

    do {
        selectedPage =
            Math.floor(Math.random() * cached.totalPages) + 1;
    } while (usedPages.includes(selectedPage));

    const separator = endpoint.includes("?") ? "&" : "?";

    let response;

    if (selectedPage === 1 && firstResponse) {
        response = firstResponse;
    } else {
        response = await tmdb.get(
            `${endpoint}${separator}page=${selectedPage}`,
            { signal }
        );
    }

    return {
        ...response.data,
        page: selectedPage,
        results: shuffleArray(response.data.results),
    };
};

export const getTrendingMovies = async (signal?: AbortSignal) => {
    const response = await tmdb.get("/trending/movie/day", { signal });

    return {
        ...response.data,
        results: shuffleArray(response.data.results),
    };
};

export const getPopularMovies = async (
    excludePages: number[] = [],
    signal?: AbortSignal
) => {
    return getRandomPageData("/movie/popular", {
        excludePages,
        signal,
    });
};

export const getNowPlayingMovies = async (
    excludePages: number[] = [],
    signal?: AbortSignal
) => {
    return getRandomPageData("/movie/now_playing", {
        excludePages,
        signal,
    });
};

export const getUpcomingMovies = async (
    excludePages: number[] = [],
    signal?: AbortSignal
) => {
    return getRandomPageData("/movie/upcoming", {
        excludePages,
        signal,
    });
};

export const getTopRatedMovies = async (
    excludePages: number[] = [],
    signal?: AbortSignal
) => {
    return getRandomPageData("/movie/top_rated", {
        excludePages,
        signal,
    });
};