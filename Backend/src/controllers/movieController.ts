import { Request, Response } from 'express';
import { getTrendingMovies, getPopularMovies, getNowPlayingMovies, getUpcomingMovies, getTopRatedMovies } from '../services/movieService';
import { getRegionFromIp } from '../services/locationService';


export const fetchTrendingMovies = async (
    req: Request,
    res: Response
): Promise<void> => {
    const controller = new AbortController();

    req.on("close", () => {
        controller.abort();
    });
    try {
        const movies = await getTrendingMovies(controller.signal);

        if (!res.headersSent) {
            res.status(200).json(movies);
        }
    } catch (error: any) {

        if (error.code === "ERR_CANCELED") {
            return;
        }

        console.error(error);

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch trending movies",
            });
        }
    }
};


export const fetchPopularMovies = async (
    req: Request,
    res: Response
): Promise<void> => {
    const region = await getRegionFromIp(req.ip);

    const genre =
        typeof req.query.genre === "string"
            ? req.query.genre
            : undefined;

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
        const movies = await getPopularMovies(
            excludePages,
            controller.signal,
            genre,
            region
        );

        if (!res.headersSent) {
            res.status(200).json({
                ...movies,
                region,
            });
        }
    } catch (error: any) {

        if (error.code === "ERR_CANCELED") {
            return;
        }

        console.error(error);

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch popular movies",
            });
        }
    }
};

export const fetchNowPlayingMovies = async (
    req: Request,
    res: Response
): Promise<void> => {
    const region = await getRegionFromIp(req.ip);

    console.log("Region:", region);
    console.log("req.ip:", req.ip);
    console.log("x-forwarded-for:", req.headers["x-forwarded-for"]);
    console.log("remoteAddress:", req.socket.remoteAddress);

    const genre =
        typeof req.query.genre === "string"
            ? req.query.genre
            : undefined;

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
        const movies = await getNowPlayingMovies(
            excludePages,
            controller.signal,
            genre,
            region
        );

        if (!res.headersSent) {
            res.status(200).json({
                ...movies,
                region,
            });
        }
    } catch (error: any) {

        if (error.code === "ERR_CANCELED") {
            return;
        }

        console.error(error);

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch now playing movies",
            });
        }
    }
};

export const fetchUpcomingMovies = async (
    req: Request,
    res: Response
): Promise<void> => {
    const region = await getRegionFromIp(req.ip);
    const genre =
        typeof req.query.genre === "string"
            ? req.query.genre
            : undefined;

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
        const movies = await getUpcomingMovies(
            excludePages,
            controller.signal,
            genre,
            region
        );
        if (!res.headersSent) {
            res.status(200).json({
                ...movies,
                region,
            });
        }
    } catch (error: any) {

        if (error.code === "ERR_CANCELED") {
            return;
        }

        console.error(error);

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch upcoming movies",
            });
        }
    }
};

export const fetchTopRatedMovies = async (
    req: Request,
    res: Response
): Promise<void> => {
    const region = await getRegionFromIp(req.ip);
    const genre =
        typeof req.query.genre === "string"
            ? req.query.genre
            : undefined;

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
        const movies = await getTopRatedMovies(excludePages,
            controller.signal,
            genre,
            region
        );

        if (!res.headersSent) {
            res.status(200).json({
                ...movies,
                region,
            });
        }
    } catch (error: any) {

        if (error.code === "ERR_CANCELED") {
            return;
        }

        console.error(error);

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch top rated movies",
            });
        }
    }
};