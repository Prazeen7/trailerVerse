import { Router } from "express";
import { fetchTrailer } from "../controllers/youtubeController";

const router = Router();

router.get("/:type/:id", fetchTrailer);

export default router;