import tmdb from "../config/tmdb";
import { DiscoverFilters } from "../utils/discoverFilters";

interface RandomPageOptions {
    excludePages?: number[];
    signal?: AbortSignal;
}

export const buildDiscoverEndpoint = (
    filter:
        | "popular"
        | "top_rated"
        | "upcoming"
        | "now_playing"
        | "/tv/popular"
        | "/tv/top_rated",
    filters?: DiscoverFilters
) => {
    const params = new URLSearchParams();

    const isTV = filter.startsWith("/tv/");

    if (!isTV && filters?.region) {
        params.set("region", filters.region);
    }

    if (filters?.genre) {
        params.set("with_genres", filters.genre);
    }

    // Year
    if (filters?.releaseYear) {
        if (isTV) {
            params.set("first_air_date_year", filters.releaseYear);
        } else {
            params.set("primary_release_year", filters.releaseYear);
        }
    }

    // Country
    if (filters?.originCountry) {
        params.set("with_origin_country", filters.originCountry);
    }

    // Rating
    if (filters?.minVoteAverage) {
        params.set("vote_average.gte", filters.minVoteAverage);
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

    return {
        ...response.data,
        page: selectedPage,
        results: shuffleArray(results),
    };
};

export const getRandomFilteredTVData = async (
    endpoint: string,
    filters?: DiscoverFilters,
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


        const filtered = response.data.results.filter((show: any) => {
            if (
                filters?.genre &&
                !show.genre_ids?.includes(Number(filters.genre))
            ) {
                return false;
            }

            if (filters?.releaseYear) {
                const year = show.first_air_date?.split("-")[0];

                if (year !== filters.releaseYear) {
                    return false;
                }
            }

            if (
                filters?.originCountry &&
                !show.origin_country?.includes(filters.originCountry)
            ) {
                return false;
            }

            if (
                filters?.minVoteAverage &&
                show.vote_average < Number(filters.minVoteAverage)
            ) {
                return false;
            }

            return true;
        });

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
    filters?: DiscoverFilters
) => {
    return getRandomPageData(
        buildDiscoverEndpoint("popular", filters),
        {
            excludePages,
            signal,
        }
    );
};

export const getTopRatedMovies = (
    excludePages: number[] = [],
    signal?: AbortSignal,
    filters?: DiscoverFilters
) => {
    return getRandomPageData(
        buildDiscoverEndpoint("top_rated", filters),
        {
            excludePages,
            signal,
        }
    );
};

export const getUpcomingMovies = (
    excludePages: number[] = [],
    signal?: AbortSignal,
    filters?: DiscoverFilters
) => {
    return getRandomPageData(
        buildDiscoverEndpoint("upcoming", filters),
        {
            excludePages,
            signal,
        }
    );
};

export const getNowPlayingMovies = (
    excludePages: number[] = [],
    signal?: AbortSignal,
    filters?: DiscoverFilters
) => {
    return getRandomPageData(
        buildDiscoverEndpoint("now_playing", filters),
        {
            excludePages,
            signal,
        }
    );
};