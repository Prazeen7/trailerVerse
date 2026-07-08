import express from "express";
import cors from "cors";
import dotenv from "dotenv";

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

export default app; 