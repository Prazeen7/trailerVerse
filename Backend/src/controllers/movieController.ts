import { Request, Response } from 'express';
import { getTrendingMovies, getPopularMovies, getNowPlayingMovies, getUpcomingMovies, getTopRatedMovies} from '../services/movieService';

interface MovieParams {
    pid: string;
}

export const fetchTrendingMovies = async(
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const movies = await getTrendingMovies();

        res.status(200).json(movies);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            sucess: false,
            message: "Failed tofetch trending movies",
        })
    }
};

export const fetchPopularMovies = async(
    req: Request<MovieParams>,
    res: Response
): Promise<void> => {
    try {
        const { pid } = req.params;
        const movies = await getPopularMovies(pid);

        res.status(200).json(movies);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            sucess: false,
            message: "Failed tofetch popular movies",
        })
    }
};

export const fetchNowPlayingMovies = async(
    req: Request<MovieParams>,
    res: Response
): Promise<void> => {
    try {
        const { pid } = req.params;
        const movies = await getNowPlayingMovies(pid);

        res.status(200).json(movies);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            sucess: false,
            message: "Failed tofetch now playing movies",
        })
    }
};

export const fetchUpcomingMovies = async(
    req: Request<MovieParams>,
    res: Response
): Promise<void> => {
    try {
        const { pid } = req.params;
        const movies = await getUpcomingMovies(pid);

        res.status(200).json(movies);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            sucess: false,
            message: "Failed tofetch upcoming movies",
        })
    }
};

export const fetchTopRatedMovies = async(
    req: Request<MovieParams>,
    res: Response
): Promise<void> => {
    try {
        const { pid } = req.params;
        const movies = await getTopRatedMovies(pid);

        res.status(200).json(movies);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            sucess: false,
            message: "Failed tofetch top rated movies",
        })
    }
};