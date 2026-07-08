import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const tmdb = axios.create({
    baseURL: "https://api.themoviedb.org/3",
    headers: {
        Authorization: `Bearer ${process.env.TMDB_API_TOKEN}`,
        accept: "application/json",
    },
});

export default tmdb;