import tmdb from "../config/tmdb";

interface RandomPageOptions {
    excludePages?: number[];
    signal?: AbortSignal;
}

const buildDiscoverEndpoint = (
    filter: "popular" | "top_rated" | "upcoming" | "now_playing",
    genre?: string
) => {
    const params = new URLSearchParams();

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const monthAgo = new Date(today);
    monthAgo.setDate(today.getDate() - 30);
    const monthAgoStr = monthAgo.toISOString().split("T")[0];

    switch (filter) {
        case "popular":
            params.set("sort_by", "popularity.desc");
            break;

        case "top_rated":
            params.set("sort_by", "vote_average.desc");
            params.set("vote_count.gte", "1000");
            break;

        case "upcoming":
            params.set("primary_release_date.gte", todayStr);
            params.set("sort_by", "popularity.desc");
            break;

        case "now_playing":
            params.set("primary_release_date.lte", todayStr);
            params.set("primary_release_date.gte", monthAgoStr);
            params.set("sort_by", "popularity.desc");
            break;
    }

    if (genre) {
        params.set("with_genres", genre);
    }

    return `/discover/movie?${params.toString()}`;
};

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

export const getPopularMovies = (
    excludePages: number[] = [],
    signal?: AbortSignal,
    genre?: string
) => {
    return getRandomPageData(
        buildDiscoverEndpoint("popular", genre),
        {
            excludePages,
            signal,
        }
    );
};

export const getTopRatedMovies = (
    excludePages: number[] = [],
    signal?: AbortSignal,
    genre?: string
) => {
    return getRandomPageData(
        buildDiscoverEndpoint("top_rated", genre),
        {
            excludePages,
            signal,
        }
    );
};

export const getUpcomingMovies = (
    excludePages: number[] = [],
    signal?: AbortSignal,
    genre?: string
) => {
    return getRandomPageData(
        buildDiscoverEndpoint("upcoming", genre),
        {
            excludePages,
            signal,
        }
    );
};

export const getNowPlayingMovies = (
    excludePages: number[] = [],
    signal?: AbortSignal,
    genre?: string
) => {
    return getRandomPageData(
        buildDiscoverEndpoint("now_playing", genre),
        {
            excludePages,
            signal,
        }
    );
};