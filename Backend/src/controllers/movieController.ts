import { Request, Response } from 'express';
import { getTrendingMovies, getPopularMovies, getNowPlayingMovies, getUpcomingMovies, getTopRatedMovies } from '../services/movieService';
import { getRegionFromIp } from '../services/locationService';
import { DiscoverFilters } from '../utils/discoverFilters';

// Filter query
const getFilters = (req: Request, region: string | undefined): DiscoverFilters => ({
    genre:
        typeof req.query.genre === "string"
            ? req.query.genre
            : undefined,

    releaseYear:
        typeof req.query.releaseYear === "string"
            ? req.query.releaseYear
            : undefined,

    originCountry:
        typeof req.query.originCountry === "string"
            ? req.query.originCountry
            : undefined,

    minVoteAverage:
        typeof req.query.minVoteAverage === "string"
            ? req.query.minVoteAverage
            : undefined,

    region,
});

// exclude used pages
const getExcludePages = (req: Request): number[] =>
    typeof req.query.excludePages === "string"
        ? req.query.excludePages
            .split(",")
            .map(Number)
            .filter(Number.isFinite)
        : [];

// Abort TMDB request if the client disconnects
const createAbortController = (req: Request) => {
    const controller = new AbortController();

    req.on("close", () => {
        controller.abort();
    });

    return controller;
};

export const fetchTrendingMovies = async (
    req: Request,
    res: Response
): Promise<void> => {
    const controller = createAbortController(req);
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
    const filters = getFilters(req, region);

    const excludePages = getExcludePages(req);

    const controller = createAbortController(req);
    try {
        const movies = await getPopularMovies(
            excludePages,
            controller.signal,
            filters
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

    const filters = getFilters(req, region);

    const excludePages = getExcludePages(req);

    const controller = createAbortController(req);
    try {
        const movies = await getNowPlayingMovies(
            excludePages,
            controller.signal,
            filters
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
    const filters = getFilters(req, region);
    const excludePages = getExcludePages(req);

    const controller = createAbortController(req);
    try {
        const movies = await getUpcomingMovies(
            excludePages,
            controller.signal,
            filters
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
    const filters = getFilters(req, region);

    const excludePages = getExcludePages(req);

    const controller = createAbortController(req);
    try {
        const movies = await getTopRatedMovies(
            excludePages,
            controller.signal,
            filters
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