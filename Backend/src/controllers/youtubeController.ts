import { Request, Response } from "express";
import { getOfficialTrailer } from "../services/youtubeService";

interface TrailerParams {
    type: "movie" | "tv";
    id: string;
}

export const fetchTrailer = async (
    req: Request<TrailerParams>,
    res: Response
): Promise<void> => {
    const controller = new AbortController();
    req.on("close", () => {
        controller.abort();
    });
    try {
        const { type, id } = req.params;

        const trailer = await getOfficialTrailer(type, id, controller.signal);

        if (!trailer) {
            res.status(404).json({
                success: false,
                message: "Trailer not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: trailer,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch trailer",
        });
    }
};