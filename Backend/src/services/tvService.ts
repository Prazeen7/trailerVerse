import tmdb from "../config/tmdb";

export const getTrendingTVShows = async () => {
    const response = await tmdb.get("/trending/tv/day");

    return response.data;
}

export const getPopularTVShows = async (pid: string) => {
    const response = await tmdb.get(`/tv/popular?&page=${pid}`);

    return response.data;
}