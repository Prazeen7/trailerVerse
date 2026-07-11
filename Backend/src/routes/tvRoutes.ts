import { Router } from 'express';
import { fetchPopularTVShows, fetchTrendingTVShows, fetchNowPlayingTVShows, fetchTopRatedTVShows, fetchOnTheAirTVShows } from '../controllers/tvController';

const router = Router();

router.get("/trending/tv", fetchTrendingTVShows);
router.get("/tv/airing_today/:pid", fetchNowPlayingTVShows);
router.get("/tv/on_the_air/:pid", fetchOnTheAirTVShows);
router.get("/tv/popular/:pid", fetchPopularTVShows);
router.get("/tv/top_rated/:pid", fetchTopRatedTVShows);
export default router;