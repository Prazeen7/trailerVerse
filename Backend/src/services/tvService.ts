import tmdb from "../config/tmdb";

export const getTrendingTVShows = async (signal?: AbortSignal) => {
    const response = await tmdb.get("/trending/tv/day", {
        signal,
    });

    return response.data;
}

export const getPopularTVShows = async (pid: string, signal?: AbortSignal) => {
    const response = await tmdb.get(`/tv/popular?&page=${pid}`, {
        signal,
    });

    return response.data;
}

export const getNowPlayingTVShows = async (pid: string, signal?: AbortSignal) => {
    const response = await tmdb.get(`/tv/airing_today?&page=${pid}`, {
        signal,
    });

    return response.data;
}
    
export const getOnTheAirTVShows = async (pid: string, signal?: AbortSignal) => {
    const response = await tmdb.get(`/tv/on_the_air?&page=${pid}`, {
        signal,
    });

    return response.data;
}

export const getTopRatedTVShows = async (pid: string, signal?: AbortSignal) => {
    const response = await tmdb.get(`/tv/top_rated?&page=${pid}`, {
        signal,
    });

    return response.data;
}