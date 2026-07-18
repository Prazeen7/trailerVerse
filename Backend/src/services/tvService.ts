import tmdb from "../config/tmdb";
import {
    getRandomPageData,
    getRandomFilteredTVData,
    shuffleArray,
    buildDiscoverEndpoint
} from "./movieService";

import { DiscoverFilters } from "../utils/discoverFilters";

export const getTrendingTVShows = async (signal?: AbortSignal) => {
    const response = await tmdb.get("/trending/tv/day", { signal });

    return {
        ...response.data,
        results: shuffleArray(response.data.results),
    };
}

export const getPopularTVShows = async (
    excludePages: number[] = [],
    signal?: AbortSignal,
    filters?: DiscoverFilters
) => {
    return getRandomPageData(
        buildDiscoverEndpoint("/tv/popular", filters),
        {
            excludePages,
            signal,
        }
    );
};

export const getNowPlayingTVShows = async (
    excludePages: number[] = [],
    signal?: AbortSignal,
    filters?: DiscoverFilters
) => {
    const endpoint = "/tv/airing_today";

    return getRandomFilteredTVData(
        endpoint,
        filters,
        {
            excludePages,
            signal,
        }
    );
};

export const getOnTheAirTVShows = async (
    excludePages: number[] = [],
    signal?: AbortSignal,
    filters?: DiscoverFilters
) => {
    const endpoint = "/tv/on_the_air";

    return getRandomFilteredTVData(
        endpoint,
        filters,
        {
            excludePages,
            signal,
        }
    );
};

export const getTopRatedTVShows = async (
    excludePages: number[] = [],
    signal?: AbortSignal,
    filters?: DiscoverFilters
) => {
    return getRandomPageData(
        buildDiscoverEndpoint("/tv/top_rated", filters),
        {
            excludePages,
            signal,
        }
    );
};