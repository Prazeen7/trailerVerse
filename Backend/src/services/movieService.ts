import tmdb from "../config/tmdb";

export const getTrendingMovies = async () => {
    const response = await tmdb.get("/trending/movie/day");

    return response.data;
}

export const getPopularMovies = async (pid: string) => {
    const response = await tmdb.get(`/movie/popular?&page=${pid}`);

    return response.data;
}