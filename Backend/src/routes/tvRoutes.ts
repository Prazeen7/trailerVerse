import { Router } from 'express';
import { fetchPopularTVShows, fetchTrendingTVShows } from '../controllers/tvController';

const router = Router();

router.get("/trending/tv", fetchTrendingTVShows);
router.get("/popular/tv/:pid", fetchPopularTVShows);
export default router;