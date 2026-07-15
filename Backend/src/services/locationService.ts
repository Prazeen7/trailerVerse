import axios from "axios";

const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

const ipCache = new Map<
    string,
    {
        countryCode: string;
        expires: number;
    }
>();

export const getRegionFromIp = async (
    ip?: string
): Promise<string | undefined> => {
    if (!ip) {
        return undefined;
    }
    try {
        const cleanIp = ip.replace(/^::ffff:/, "");

        // Check cache
        const cached = ipCache.get(cleanIp);

        if (cached && cached.expires > Date.now()) {
            return cached.countryCode;
        }

        const { data } = await axios.get(
            `https://ipwho.is/${cleanIp}`
        );

        if (!data.success) {
            return undefined;
        }

        ipCache.set(cleanIp, {
            countryCode: data.country_code,
            expires: Date.now() + CACHE_DURATION,
        });

        return data.country_code;
    } catch (error) {
        console.error("Failed to determine region:", error);
        return undefined;
    }
};