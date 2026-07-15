import tmdb from "../config/tmdb";
import {
    getRandomPageData,
    getRandomFilteredTVData,
    shuffleArray,
    endpointCache,
    buildDiscoverEndpoint
} from "./movieService";

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
    genre?: string,
    region?: string
) => {
    return getRandomPageData(
        buildDiscoverEndpoint(`/tv/popular`, genre, region),
        {
            excludePages,
            signal,
        }
    );
}

export const getNowPlayingTVShows = async (
    excludePages: number[] = [],
    signal?: AbortSignal,
    genre?: string,
    region?: string
) => {

    const endpoint = "/tv/airing_today";

    if (genre) {
        return getRandomFilteredTVData(
            endpoint,
            genre,
            {
                excludePages,
                signal,
            }
        );
    }

    return getRandomPageData(endpoint, {
        excludePages,
        signal,
    });
};

export const getOnTheAirTVShows = async (
    excludePages: number[] = [],
    signal?: AbortSignal,
    genre?: string,
    region?: string
) => {

    const endpoint = "/tv/on_the_air";

    if (genre) {
        return getRandomFilteredTVData(
            endpoint,
            genre,
            {
                excludePages,
                signal,
            }
        );
    }

    return getRandomPageData(endpoint, {
        excludePages,
        signal,
    });
};

export const getTopRatedTVShows = async (
    excludePages: number[] = [],
    signal?: AbortSignal,
    genre?: string,
    region?: string
) => {
    return getRandomPageData(buildDiscoverEndpoint(`/tv/top_rated`, genre, region), {
        excludePages,
        signal,
    });
};