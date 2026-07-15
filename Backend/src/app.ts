import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import movieRoutes from './routes/movieRoutes';
import tvRoutes from './routes/tvRoutes';
import youtubeRoutes from "./routes/youtubeRoutes";

const app = express();
dotenv.config();

// Middleware
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map(origin => origin.trim());

app.use(
    cors({
        origin: (origin, callback) =>
            !origin || allowedOrigins.includes(origin)
                ? callback(null, true)
                : callback(new Error("Not allowed by CORS")),
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