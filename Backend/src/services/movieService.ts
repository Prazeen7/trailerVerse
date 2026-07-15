import tmdb from "../config/tmdb";

interface RandomPageOptions {
    excludePages?: number[];
    signal?: AbortSignal;
    genre?: string;
}

export const buildDiscoverEndpoint = (
    filter:
        | "popular"
        | "top_rated"
        | "upcoming"
        | "now_playing"
        | "/tv/popular"
        | "/tv/airing_today"
        | "/tv/on_the_air"
        | "/tv/top_rated",
    genre?: string,
    region?: string
) => {
    const params = new URLSearchParams();

    const isTV = filter.startsWith("/tv/");

    if (!isTV && region) {
        params.set("region", region);
    }

    if (genre) {
        params.set("with_genres", genre);
    }

    if (isTV) {
        switch (filter) {
            case "/tv/popular":
                params.set("sort_by", "popularity.desc");
                break;

            case "/tv/top_rated":
                params.set("sort_by", "vote_average.desc");
                params.set("vote_count.gte", "100");
                break;

            case "/tv/on_the_air":
                params.set("sort_by", "popularity.desc");
                break;

            case "/tv/airing_today":
                params.set("sort_by", "popularity.desc");
                break;
        }

        return `/discover/tv?${params.toString()}`;
    }

    // movie logic
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
        genre,
    } = options ?? {};

    let cached = endpointCache.get(endpoint);

    if (!cached || cached.expires < Date.now()) {
        const firstResponse = await tmdb.get(endpoint, { signal });

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

    const response = await tmdb.get(
        `${endpoint}${separator}page=${selectedPage}`,
        { signal }
    );

    let results = response.data.results;

    if (genre) {
        const genreId = Number(genre);

        results = results.filter((item: any) =>
            item.genre_ids.includes(genreId)
        );
    }

    return {
        ...response.data,
        page: selectedPage,
        results: shuffleArray(results),
    };
};

export const getRandomFilteredTVData = async (
    endpoint: string,
    genre: string,
    options?: RandomPageOptions
) => {
    const {
        excludePages = [],
        signal,
    } = options ?? {};

    let cached = endpointCache.get(endpoint);

    if (!cached || cached.expires < Date.now()) {
        const firstResponse = await tmdb.get(endpoint, { signal });

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

    const triedPages = new Set<number>(usedPages);
    const collected = new Map<number, any>();

    const TARGET_RESULTS = 20;
    const MAX_ATTEMPTS = 8;

    let lastSelectedPage = 1;
    let lastResponse: any;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        if (triedPages.size >= cached.totalPages) break;

        const availablePages = [];

        for (let page = 1; page <= cached.totalPages; page++) {
            if (!triedPages.has(page)) {
                availablePages.push(page);
            }
        }

        if (availablePages.length === 0) break;

        const selectedPage =
            availablePages[Math.floor(Math.random() * availablePages.length)];

        triedPages.add(selectedPage);
        lastSelectedPage = selectedPage;

        const separator = endpoint.includes("?") ? "&" : "?";

        const response = await tmdb.get(
            `${endpoint}${separator}page=${selectedPage}`,
            { signal }
        );

        lastResponse = response;

        const filtered = response.data.results.filter((show: any) =>
            show.genre_ids?.includes(Number(genre))
        );

        for (const show of filtered) {
            collected.set(show.id, show);
        }

        if (collected.size >= TARGET_RESULTS) {
            break;
        }
    }

    return {
        ...lastResponse.data,
        results: shuffleArray([...collected.values()]).slice(0, TARGET_RESULTS),
        page: lastSelectedPage,
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
    genre?: string,
    region?: string
) => {
    return getRandomPageData(
        buildDiscoverEndpoint("popular", genre, region),
        {
            excludePages,
            signal,
        }
    );
};

export const getTopRatedMovies = (
    excludePages: number[] = [],
    signal?: AbortSignal,
    genre?: string,
    region?: string
) => {
    return getRandomPageData(
        buildDiscoverEndpoint("top_rated", genre, region),
        {
            excludePages,
            signal,
        }
    );
};

export const getUpcomingMovies = (
    excludePages: number[] = [],
    signal?: AbortSignal,
    genre?: string,
    region?: string
) => {
    return getRandomPageData(
        buildDiscoverEndpoint("upcoming", genre, region),
        {
            excludePages,
            signal,
        }
    );
};

export const getNowPlayingMovies = (
    excludePages: number[] = [],
    signal?: AbortSignal,
    genre?: string,
    region?: string
) => {
    return getRandomPageData(
        buildDiscoverEndpoint("now_playing", genre, region),
        {
            excludePages,
            signal,
        }
    );
};