import { Request, Response } from 'express';
import { getTrendingMovies } from '../services/movieService';

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