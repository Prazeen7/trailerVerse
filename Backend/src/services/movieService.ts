import tmdb from "../config/tmdb";

export const getTrendingMovies = async (signal?: AbortSignal) => {
    const response = await tmdb.get("/trending/movie/day", {
        signal,
    });

    return response.data;
}

export const getPopularMovies = async (pid: string, signal?: AbortSignal) => {
    const response = await tmdb.get(`/movie/popular?&page=${pid}`, {
        signal,
    }  );

    return response.data;
}

export const getNowPlayingMovies = async (pid: string, signal?: AbortSignal) => {
    const response = await tmdb.get(`/movie/now_playing?&page=${pid}`, {
        signal,
    });

    return response.data;
}

export const getUpcomingMovies = async (pid: string, signal?: AbortSignal) => {
    const response = await tmdb.get(`/movie/upcoming?&page=${pid}&region=us`, {
        signal,
    });

    return response.data;
}

export const getTopRatedMovies = async (pid: string, signal?: AbortSignal) => {
    const response = await tmdb.get(`/movie/top_rated?&page=${pid}`, {
        signal,
    });

    return response.data;
}