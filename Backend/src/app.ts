import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import movieRoutes from './routes/movieRoutes';
import tvRoutes from './routes/tvRoutes';
import youtubeRoutes from "./routes/youtubeRoutes";

const app = express();
dotenv.config();

// Middleware
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);

app.use(express.json());   
app.get('/', (_req, res) => {
    res.json({
        success: true,
        message: "TrailerVerse API is running",
    });
});

app.use("/api/movies", movieRoutes)
app.use("/api/trailer", youtubeRoutes);
app.use("/api/tv", tvRoutes);
export default app; 