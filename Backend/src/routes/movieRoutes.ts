import { Router } from 'express';
import { fetchTrendingMovies, fetchPopularMovies, fetchNowPlayingMovies, fetchTopRatedMovies, fetchUpcomingMovies} from '../controllers/movieController';

const router = Router();

router.get("/trending/movie", fetchTrendingMovies);
router.get("/popular/movie/:pid", fetchPopularMovies);
router.get("/now_playing/movie/:pid", fetchNowPlayingMovies);
router.get("/upcoming/movie/:pid", fetchUpcomingMovies);
router.get("/top_rated/movie/:pid", fetchTopRatedMovies);
export default router;