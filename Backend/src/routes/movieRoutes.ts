import { Router } from 'express';
import { fetchTrendingMovies, fetchPopularMovies, fetchNowPlayingMovies, fetchTopRatedMovies, fetchUpcomingMovies} from '../controllers/movieController';

const router = Router();

router.get("/trending/movie", fetchTrendingMovies);
router.get("/popular/movie", fetchPopularMovies);
router.get("/now_playing/movie", fetchNowPlayingMovies);
router.get("/upcoming/movie", fetchUpcomingMovies);
router.get("/top_rated/movie", fetchTopRatedMovies);
export default router;