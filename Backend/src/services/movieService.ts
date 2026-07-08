import tmdb from "../config/tmdb";

export const getTrendingMovies = async () => {
    const response = await tmdb.get("/trending/movie/day");

    return response.data;
}