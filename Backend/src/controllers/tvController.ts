import { Request, Response } from 'express';
import { getTrendingTVShows, getPopularTVShows, getNowPlayingTVShows, getTopRatedTVShows, getOnTheAirTVShows} from '../services/tvService';
import { getTopRatedMovies } from '../services/movieService';

interface TVParams {
    pid: string;
}

export const fetchTrendingTVShows = async(
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const shows = await getTrendingTVShows();

        res.status(200).json(shows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            sucess: false,
            message: "Failed to fetch trending TV shows",
        })
    }
};

export const fetchPopularTVShows = async(
    req: Request<TVParams>,
    res: Response
): Promise<void> => {
    try {
        const { pid } = req.params;
        const shows = await getPopularTVShows(pid);

        res.status(200).json(shows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            sucess: false,
            message: "Failed to fetch popular TV shows",
        })
    }
};

export const fetchNowPlayingTVShows = async(
    req: Request<TVParams>,
    res: Response
): Promise<void> => {
    try {
        const { pid } = req.params;
        const shows = await getNowPlayingTVShows(pid);

        res.status(200).json(shows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            sucess: false,
            message: "Failed tofetch now playing TV shows",
        })
    }
};

export const fetchOnTheAirTVShows = async(
    req: Request<TVParams>,
    res: Response
): Promise<void> => {
    try {
        const { pid } = req.params;
        const shows = await getOnTheAirTVShows(pid);

        res.status(200).json(shows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            sucess: false,
            message: "Failed tofetch on the air TV shows",
        })
    }
};

export const fetchTopRatedTVShows = async(
    req: Request<TVParams>,
    res: Response
): Promise<void> => {
    try {
        const { pid } = req.params;
        const shows = await getTopRatedTVShows(pid);

        res.status(200).json(shows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            sucess: false,
            message: "Failed tofetch top rated TV shows",
        })
    }
};