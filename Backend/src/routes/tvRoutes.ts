import { Router } from 'express';
import { fetchPopularTVShows, fetchTrendingTVShows, fetchNowPlayingTVShows, fetchTopRatedTVShows, fetchOnTheAirTVShows } from '../controllers/tvController';

const router = Router();

router.get("/trending/tv", fetchTrendingTVShows);
router.get("/tv/airing_today", fetchNowPlayingTVShows);
router.get("/tv/on_the_air", fetchOnTheAirTVShows);
router.get("/tv/popular", fetchPopularTVShows);
router.get("/tv/top_rated", fetchTopRatedTVShows);
export default router;