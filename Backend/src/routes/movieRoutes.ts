import { Router } from 'express';
import { fetchTrendingMovies, fetchPopularMovies } from '../controllers/movieController';

const router = Router();

router.get("/trending/movie", fetchTrendingMovies);
router.get("/popular/movie/:pid", fetchPopularMovies);
export default router;