import { Router } from 'express';
import { fetchTrendingMovies } from '../controller/movieController';

const router = Router();

router.get("/trending", fetchTrendingMovies);

export default router;