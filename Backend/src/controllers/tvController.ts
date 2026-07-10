import { Request, Response } from 'express';
import { getTrendingTVShows, getPopularTVShows } from '../services/tvService';

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