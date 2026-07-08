import { Router } from 'express';
import { fetchTrendingMovies } from '../controllers/movieController';

const router = Router();

router.get("/trending", fetchTrendingMovies);

export default router;