import tmdb from "../config/tmdb";

export const getOfficialTrailer = async (
    type: "movie" | "tv",
    id: string
) => {
    const response = await tmdb.get(`/${type}/${id}/videos`);

    const videos = response.data.results;

    const trailer =
        videos.find(
            (video: any) =>
                video.site === "YouTube" &&
                video.type === "Trailer" &&
                video.official
        ) ||
        videos.find(
            (video: any) =>
                video.site === "YouTube" &&
                video.type === "Trailer"
        ) ||
        videos.find(
            (video: any) => video.site === "YouTube"
        );

    return trailer;
};