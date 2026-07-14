import tmdb from "../config/tmdb";
import { getRandomPageData, shuffleArray, endpointCache, } from './movieService'

export const getTrendingTVShows = async (signal?: AbortSignal) => {
    const response = await tmdb.get("/trending/tv/day", { signal });

    return {
        ...response.data,
        results: shuffleArray(response.data.results),
    };
}

export const getPopularTVShows = async (excludePages: number[] = [],
    signal?: AbortSignal) => {
    return getRandomPageData(`/tv/popular`, {
        excludePages,
        signal,
    });
}

export const getNowPlayingTVShows = async (excludePages: number[] = [],
    signal?: AbortSignal) => {
    return getRandomPageData(`/tv/airing_today`, {
        excludePages,
        signal,
    });
};

export const getOnTheAirTVShows = async (excludePages: number[] = [],
    signal?: AbortSignal) => {
    return getRandomPageData(`/tv/on_the_air`, {
        excludePages,
        signal,
    });
};

export const getTopRatedTVShows = async (excludePages: number[] = [],
    signal?: AbortSignal) => {
    return getRandomPageData(`/tv/top_rated?`, {
        excludePages,
        signal,
    });
};