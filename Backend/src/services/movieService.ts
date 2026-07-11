import tmdb from "../config/tmdb";

export const getTrendingMovies = async () => {
    const response = await tmdb.get("/trending/movie/day");

    return response.data;
}

export const getPopularMovies = async (pid: string) => {
    const response = await tmdb.get(`/movie/popular?&page=${pid}`);

    return response.data;
}

export const getNowPlayingMovies = async (pid: string) => {
    const response = await tmdb.get(`/movie/now_playing?&page=${pid}`);

    return response.data;
}

export const getUpcomingMovies = async (pid: string) => {
    const response = await tmdb.get(`/movie/upcoming?&page=${pid}`);

    return response.data;
}

export const getTopRatedMovies = async (pid: string) => {
    const response = await tmdb.get(`/movie/top_rated?&page=${pid}`);

    return response.data;
}