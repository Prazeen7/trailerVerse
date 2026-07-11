import tmdb from "../config/tmdb";

export const getTrendingTVShows = async () => {
    const response = await tmdb.get("/trending/tv/day");

    return response.data;
}

export const getPopularTVShows = async (pid: string) => {
    const response = await tmdb.get(`/tv/popular?&page=${pid}`);

    return response.data;
}

export const getNowPlayingTVShows = async (pid: string) => {
    const response = await tmdb.get(`/tv/airing_today?&page=${pid}`);

    return response.data;
}
    
export const getOnTheAirTVShows = async (pid: string) => {
    const response = await tmdb.get(`/tv/on_the_air?&page=${pid}`);

    return response.data;
}

export const getTopRatedTVShows = async (pid: string) => {
    const response = await tmdb.get(`/tv/top_rated?&page=${pid}`);

    return response.data;
}