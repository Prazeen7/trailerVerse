import { Request, Response } from 'express';
import { getTrendingTVShows, getPopularTVShows, getNowPlayingTVShows, getTopRatedTVShows, getOnTheAirTVShows } from '../services/tvService';
import { getRegionFromIp } from '../services/locationService';
import { DiscoverFilters } from "../utils/discoverFilters";

const getExcludePages = (req: Request): number[] => {
    return typeof req.query.excludePages === "string"
        ? req.query.excludePages
            .split(",")
            .map(Number)
            .filter(Number.isFinite)
        : [];
};

const getTVFilters = async (req: Request): Promise<DiscoverFilters> => {
    const region = await getRegionFromIp(req.ip);

    return {
        region,

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
    };
};
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
    req: Request,
    res: Response
): Promise<void> => {
    const controller = new AbortController();

    req.on("close", () => {
        controller.abort();
    });

    try {
        const filters = await getTVFilters(req);
        const excludePages = getExcludePages(req);

        const shows = await getPopularTVShows(
            excludePages,
            controller.signal,
            filters
        );

        if (!res.headersSent) {
            res.status(200).json({
                ...shows,
                region: filters.region,
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
                message: "Failed to fetch popular TV shows",
            });
        }
    }
};

export const fetchNowPlayingTVShows = async (
    req: Request,
    res: Response
): Promise<void> => {
    const controller = new AbortController();

    req.on("close", () => {
        controller.abort();
    });

    try {
        const filters = await getTVFilters(req);
        const excludePages = getExcludePages(req);

        const shows = await getNowPlayingTVShows(
            excludePages,
            controller.signal,
            filters
        );

        if (!res.headersSent) {
            res.status(200).json({
                ...shows,
                region: filters.region,
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
                message: "Failed to fetch airing today TV shows",
            });
        }
    }
};

export const fetchOnTheAirTVShows = async (
    req: Request,
    res: Response
): Promise<void> => {
    const controller = new AbortController();

    req.on("close", () => {
        controller.abort();
    });

    try {
        const filters = await getTVFilters(req);
        const excludePages = getExcludePages(req);

        const shows = await getOnTheAirTVShows(
            excludePages,
            controller.signal,
            filters
        );

        if (!res.headersSent) {
            res.status(200).json({
                ...shows,
                region: filters.region,
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
                message: "Failed to fetch on the air TV shows",
            });
        }
    }
};

export const fetchTopRatedTVShows = async (
    req: Request,
    res: Response
): Promise<void> => {
    const controller = new AbortController();

    req.on("close", () => {
        controller.abort();
    });

    try {
        const filters = await getTVFilters(req);
        const excludePages = getExcludePages(req);

        const shows = await getTopRatedTVShows(
            excludePages,
            controller.signal,
            filters
        );

        if (!res.headersSent) {
            res.status(200).json({
                ...shows,
                region: filters.region,
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
                message: "Failed to fetch top rated TV shows",
            });
        }
    }
};