import { Request, Response } from 'express';
import { getTrendingTVShows, getPopularTVShows, getNowPlayingTVShows, getTopRatedTVShows, getOnTheAirTVShows } from '../services/tvService';
import { getTopRatedMovies } from '../services/movieService';

interface TVParams {
    pid: string;
}

export const fetchTrendingTVShows = async (
    req: Request,
    res: Response
): Promise<void> => {
    const controller = new AbortController();
    req.on("close", () => {
        controller.abort();
    });
    try {
        const shows = await getTrendingTVShows(controller.signal);

        if (!res.headersSent) {
            res.status(200).json(shows);
        }
    } catch (error: any) {

        if (error.code === "ERR_CANCELED") {
            return;
        }

        console.error(error);

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch trending TV shows",
            });
        }
    }
};

export const fetchPopularTVShows = async (
    req: Request<TVParams>,
    res: Response
): Promise<void> => {
    const excludePages: number[] =
        typeof req.query.excludePages === "string"
            ? req.query.excludePages
                .split(",")
                .map(Number)
                .filter(Number.isFinite)
            : [];

    const controller = new AbortController();
    req.on("close", () => {
        controller.abort();
    });
    try {
        const { pid } = req.params;
        const shows = await getPopularTVShows(excludePages, controller.signal);
        if (!res.headersSent) {
            res.status(200).json(shows);
        }
    } catch (error: any) {

        if (error.code === "ERR_CANCELED") {
            return;
        }

        console.error(error);

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch top rated TV shows",
            });
        }
    }
};

export const fetchNowPlayingTVShows = async (
    req: Request<TVParams>,
    res: Response
): Promise<void> => {
    const excludePages: number[] =
        typeof req.query.excludePages === "string"
            ? req.query.excludePages
                .split(",")
                .map(Number)
                .filter(Number.isFinite)
            : [];

    const controller = new AbortController();
    req.on("close", () => {
        controller.abort();
    });
    try {
        const { pid } = req.params;
        const shows = await getNowPlayingTVShows(excludePages, controller.signal);

        if (!res.headersSent) {
            res.status(200).json(shows);
        }
    } catch (error: any) {
        if (error.code === "ERR_CANCELED") {
            return;
        }

        console.error(error);

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch now playing TV shows",
            });
        }
    }
};

export const fetchOnTheAirTVShows = async (
    req: Request<TVParams>,
    res: Response
): Promise<void> => {
    const excludePages: number[] =
        typeof req.query.excludePages === "string"
            ? req.query.excludePages
                .split(",")
                .map(Number)
                .filter(Number.isFinite)
            : [];
    const controller = new AbortController();
    req.on("close", () => {
        controller.abort();
    });
    try {
        const { pid } = req.params;
        const shows = await getOnTheAirTVShows(excludePages, controller.signal);

        if (!res.headersSent) {
            res.status(200).json(shows);
        }
    } catch (error: any) {

        if (error.code === "ERR_CANCELED") {
            return;
        }

        console.error(error);

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch on the air TV shows",
            });
        }
    }
};

export const fetchTopRatedTVShows = async (
    req: Request<TVParams>,
    res: Response
): Promise<void> => {
    const excludePages: number[] =
        typeof req.query.excludePages === "string"
            ? req.query.excludePages
                .split(",")
                .map(Number)
                .filter(Number.isFinite)
            : [];
    const controller = new AbortController();
    req.on("close", () => {
        controller.abort();
    });
    try {
        const { pid } = req.params;
        const shows = await getTopRatedTVShows(excludePages, controller.signal);

        if (!res.headersSent) {
            res.status(200).json(shows);
        }
    } catch (error: any) {

        if (error.code === "ERR_CANCELED") {
            return;
        }

        console.error(error);

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch top rated TV shows",
            });
        }
    }
};