import { Request, Response } from 'express';
import { getTrendingMovies, getPopularMovies } from '../services/movieService';

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