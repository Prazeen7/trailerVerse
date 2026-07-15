import { useState, useEffect, useRef } from "react";
import GenreModal from "./GenreModal";

interface ContentToggleProps {
    contentType: "movie" | "tv";
    onChange: (type: "movie" | "tv") => void;
    filterType: "now_playing" | "popular" | "top_rated" | "upcoming";
    onFilterChange: (filter: "now_playing" | "popular" | "top_rated" | "upcoming") => void;
    isMuted: boolean;
    onToggleMute: () => void;
    isPaused: boolean;
    onTogglePlayPause: () => void;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
    isVisible: boolean;
    onActivity: () => void;
    genre?: number;
    onGenreChange: (genre?: number) => void;
    region?: string;
}

/** Determine layout mode from live viewport size. */
const getLayoutMode = (): "desktop" | "mobile-portrait" | "mobile-landscape" => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w > h && h < 500) return "mobile-landscape"; // phone rotated to landscape
    if (w <= 768) return "mobile-portrait";
    return "desktop";
};


export default function ContentToggle({
    contentType,
    onChange,
    filterType,
    onFilterChange,
    isMuted,
    onToggleMute,
    isPaused,
    onTogglePlayPause,
    isFullscreen,
    onToggleFullscreen,
    isVisible,
    onActivity,
    genre,
    onGenreChange,
    region
}: ContentToggleProps) {
    const [layoutMode, setLayoutMode] = useState<"desktop" | "mobile-portrait" | "mobile-landscape">(getLayoutMode);
    const filterContainerRef = useRef<HTMLDivElement>(null);
    const [buttonWidths, setButtonWidths] = useState<number[]>([]);
    const resizeTimeoutRef = useRef<number | null>(null);
    const [showGenreModal, setShowGenreModal] = useState(false);

    const isMobile = layoutMode !== "desktop";
    const isLandscape = layoutMode === "mobile-landscape";
    const isPortrait = layoutMode === "mobile-portrait";
    const MOVIE_GENRES: Record<number, string> = {
        28: "Action",
        12: "Adventure",
        16: "Animation",
        35: "Comedy",
        80: "Crime",
        99: "Documentary",
        18: "Drama",
        10751: "Family",
        14: "Fantasy",
        36: "History",
        27: "Horror",
        10402: "Music",
        9648: "Mystery",
        10749: "Romance",
        878: "Sci-Fi",
        10770: "TV Movie",
        53: "Thriller",
        10752: "War",
        37: "Western",
    };

    const TV_GENRES: Record<number, string> = {
        10759: "Action",
        16: "Animation",
        35: "Comedy",
        80: "Crime",
        99: "Documentary",
        18: "Drama",
        10751: "Family",
        10762: "Kids",
        9648: "Mystery",
        10763: "News",
        10764: "Reality",
        10765: "Sci-Fi",
        10766: "Soap",
        10767: "Talk",
        10768: "War",
        37: "Western",
    };

    // Keep controls visible whenever playback is paused
    const controlsVisible = isVisible || isPaused;

    // Filters
    const getFilters = () => {
        if (contentType === "movie") {
            return [
                { id: "now_playing" as const, label: "Now Playing" },
                { id: "popular" as const, label: "Popular" },
                { id: "top_rated" as const, label: "Top Rated" },
                { id: "upcoming" as const, label: "Upcoming" },
            ];
        }
        return [
            { id: "now_playing" as const, label: "Airing Today" },
            { id: "popular" as const, label: "On The Air" },
            { id: "top_rated" as const, label: "Popular" },
            { id: "upcoming" as const, label: "Top Rated" },
        ];
    };
    const filters = getFilters();

    const genreMap = contentType === "movie" ? MOVIE_GENRES : TV_GENRES;

    const selectedGenreName =
        genre !== undefined ? genreMap[genre] : "";

    // Vertical sliding indicator position for desktop column layout
    const getDesktopFilterTop = (filter: string) => {
        const btnH = 46, gap = 3, pad = 4;
        switch (filter) {
            case "now_playing": return pad;
            case "popular": return pad + (btnH + gap);
            case "top_rated": return pad + 2 * (btnH + gap);
            case "upcoming": return pad + 3 * (btnH + gap);
            default: return pad;
        }
    };

    // Horizontal sliding indicator — used for portrait AND landscape (both are row layout)
    const getFilterWidth = (index: number) =>
        buttonWidths[index] ?? 60;

    const getHSlideLeft = () => {
        const activeIndex = filters.findIndex(f => f.id === filterType);
        let pos = 4;
        for (let i = 0; i < activeIndex; i++) pos += getFilterWidth(i) + 3;
        return pos;
    };

    // Measure button widths for horizontal layouts
    const calculateButtonWidths = () => {
        if (layoutMode === "desktop" || !filterContainerRef.current) return;
        const btns = filterContainerRef.current.querySelectorAll<HTMLElement>(".filter-button");
        const widths: number[] = [];
        btns.forEach(b => widths.push(b.offsetWidth || 60));
        const changed = widths.length !== buttonWidths.length || widths.some((w, i) => w !== buttonWidths[i]);
        if (changed && widths.length > 0) setButtonWidths(widths);
    };

    useEffect(() => {
        const id = setTimeout(() => requestAnimationFrame(calculateButtonWidths), 120);
        return () => clearTimeout(id);
    }, [layoutMode, filterType, contentType]);

    useEffect(() => {
        const onResize = () => {
            const mode = getLayoutMode();
            setLayoutMode(mode);
            if (mode !== "desktop") {
                if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
                resizeTimeoutRef.current = setTimeout(() => requestAnimationFrame(calculateButtonWidths), 200);
            } else {
                setButtonWidths([]);
            }
        };
        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("resize", onResize);
            if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
        };
    }, []);

    // Size tokens
    const ctrlBtnSize = isLandscape ? 30 : isMobile ? 40 : 44;
    const iconSize = isLandscape ? 11 : isMobile ? 16 : 16;
    const filterFont = isLandscape ? 9 : isPortrait ? 10 : 14;
    const filterPad = isLandscape ? "4px 9px" : isPortrait ? "6px 8px" : "10px 16px";
    const filterBtnH = isPortrait ? "auto" : isLandscape ? "auto" : 46;

    // Visibility transforms per element & mode 
    // Content toggle: slides up when hidden
    const ctShow = isLandscape ? "translateY(0)" : `translateX(-50%) translateY(0)`;
    const ctHideF = isLandscape ? `translateY(-130%)` : `translateX(-50%) translateY(-130%)`;

    // Filter: landscape slides up (top-right), portrait slides down, desktop slides left
    const fHide = isLandscape
        ? "translateX(0) translateY(-130%)"
        : isPortrait
            ? "translateX(-50%) translateY(120%)"
            : "translateY(-50%) translateX(-130%)";
    const fShow = isLandscape
        ? "translateX(0) translateY(0)"
        : isPortrait
            ? "translateX(-50%) translateY(0)"
            : "translateY(-50%) translateX(0)";

    // Controls: landscape/portrait slides right, desktop slides up
    const cHide = isLandscape
        ? "translateX(120%)"
        : isPortrait
            ? "translateX(120%)"
            : "translateY(20px)";
    const cShow = isLandscape
        ? "translateX(0)"
        : isPortrait
            ? "translateX(0)"
            : "translateY(0)";

    const vis = (show: string, hide: string) => ({
        transform: controlsVisible ? show : hide,
        opacity: controlsVisible ? 1 : 0,
        pointerEvents: (controlsVisible ? "auto" : "none") as React.CSSProperties["pointerEvents"],
        transition:
            "opacity 0.3s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1)",
    });

    return (
        <>
            <style>{`
                button, button:focus, button:active, button:focus-visible {
                    outline: none !important;
                    box-shadow: none !important;
                    -webkit-tap-highlight-color: transparent !important;
                }
                *:focus { outline: none !important; }
                button::-moz-focus-inner { border: 0 !important; }
            `}</style>

            {/* ══════════════════════════════════════════════════════════════════
                CONTENT TYPE TOGGLE
                • Landscape  : top-LEFT  (no translateX centering)
                • Portrait   : top-CENTER
                • Desktop    : top-CENTER
            ══════════════════════════════════════════════════════════════════ */}
            <div
                style={{
                    position: "fixed",
                    top: isLandscape ? 8 : isMobile ? 10 : 20,
                    left: isLandscape ? 8 : "50%",
                    zIndex: 100,
                    ...vis(ctShow, ctHideF),
                }}
                onMouseEnter={onActivity}
                onMouseLeave={onActivity}
            >
                <div style={{
                    position: "relative",
                    display: "flex",
                    width: isLandscape ? 128 : isMobile ? 160 : 220,
                    padding: isLandscape ? 2 : isMobile ? 3 : 4,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(20px) saturate(180%)",
                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}>
                    {/* Sliding pill */}
                    <div style={{
                        position: "absolute",
                        top: isLandscape ? 2 : isMobile ? 3 : 4,
                        left: contentType === "movie"
                            ? (isLandscape ? 2 : isMobile ? 3 : 4)
                            : "50%",
                        width: "calc(50% - 6px)",
                        height: `calc(100% - ${isLandscape ? 4 : isMobile ? 6 : 8}px)`,
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.9)",
                        backdropFilter: "blur(10px)",
                        transition: "left 0.3s cubic-bezier(0.22,1,0.36,1)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }} />
                    {(["movie", "tv"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => onChange(t)}
                            style={{
                                flex: 1, zIndex: 1, border: "none", background: "transparent",
                                padding: isLandscape ? "5px 0" : isMobile ? "8px 0" : "10px 0",
                                cursor: "pointer", fontWeight: 600,
                                fontSize: isLandscape ? 10 : isMobile ? 12 : 15,
                                color: contentType === t ? "#000" : "rgba(255,255,255,0.8)",
                                transition: "color .3s", outline: "none",
                                WebkitTapHighlightColor: "transparent",
                            }}
                        >
                            {t === "movie" ? "Movies" : "TV Shows"}
                        </button>
                    ))}
                </div>
            </div>



            {/* ══════════════════════════════════════════════════════════════════
                VIDEO CONTROLS  (mute · play/pause · fullscreen)
                • Landscape  : bottom-RIGHT, horizontal row — well clear of arrows
                • Portrait   : bottom-RIGHT, vertical column
                • Desktop    : bottom-RIGHT, horizontal row
            ══════════════════════════════════════════════════════════════════ */}
            <div style={{
                display: "flex",
                flexDirection: isPortrait ? "column" : "row",
                alignItems: "center",
                gap: isLandscape ? 6 : isMobile ? 8 : 12,
                position: "fixed",
                bottom: isLandscape ? 10 : isMobile ? 70 : 50,
                right: isLandscape ? 10 : isMobile ? 12 : 220,
                top: "auto",
                zIndex: 1001,
                ...vis(cShow, cHide),
            }}>
                {/* Play/Pause */}
                <button
                    className="glass-control-btn"
                    onClick={(e) => { e.stopPropagation(); onTogglePlayPause(); }}
                    style={glassBtn(ctrlBtnSize)}
                >
                    {isPaused
                        ? <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                        : <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    }
                </button>

                {/* Mute */}
                <button
                    className="glass-control-btn"
                    onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
                    style={{ ...glassBtn(ctrlBtnSize), fontSize: isLandscape ? 13 : 18 }}
                >
                    {isMuted ? "🔇" : "🔊"}
                </button>

                {/* Genre */}
                <button
                    className="glass-control-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowGenreModal(true);
                    }}
                    title="Genres"
                    style={glassBtn(ctrlBtnSize)}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={iconSize + 6}
                        height={iconSize + 6}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="m12.296 3.464 3.02 3.956" />
                        <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3z" />
                        <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <path d="m6.18 5.276 3.1 3.899" />
                    </svg>
                </button>


                {selectedGenreName && (
                    <div
                        onClick={() => onGenreChange(undefined)}
                        title="Clear genre"
                        style={{
                            padding: isLandscape ? "4px 10px" : "6px 12px",
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.18)",
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            color: "#fff",
                            fontSize: isLandscape ? 10 : 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            maxWidth: 120,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {selectedGenreName} ✕
                    </div>
                )}

                {region && (
                    <div
                        style={{
                            padding: isLandscape ? "4px 10px" : "6px 12px",
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.18)",
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            color: "#fff",
                            fontSize: isLandscape ? 10 : 12,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                        }}
                    >
                        <img
                            src={`https://flagcdn.com/${region.toLowerCase()}.svg`}
                            alt={region}
                            width={20}
                            height={15}
                            style={{
                                borderRadius: "2px",
                                objectFit: "cover",
                            }}
                        />  {region}
                    </div>
                )}

                {/* Fullscreen */}
                <button
                    className="glass-control-btn"
                    onClick={(e) => { e.stopPropagation(); onToggleFullscreen(); }}
                    title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                    style={glassBtn(ctrlBtnSize)}
                >
                    {isFullscreen
                        ? <svg width={iconSize - 2} height={iconSize - 2} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 3v3a2 2 0 0 1-2 2H3" /><path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                            <path d="M3 16h3a2 2 0 0 1 2 2v3" /><path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                        </svg>
                        : <svg width={iconSize - 2} height={iconSize - 2} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                            <path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                        </svg>
                    }
                </button>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                FILTER TABS
                • Landscape  : top-RIGHT, HORIZONTAL single row (opposite toggle)
                • Portrait   : bottom-CENTER, horizontal row
                • Desktop    : left-CENTER, vertical column
            ══════════════════════════════════════════════════════════════════ */}
            <div style={{
                position: "fixed",
                // Landscape → top-right; Portrait → bottom-center; Desktop → left-center
                top: isLandscape ? 8 : isPortrait ? "auto" : "50%",
                bottom: isPortrait ? 12 : "auto",
                right: isLandscape ? 8 : "auto",
                left: isLandscape ? "auto" : isPortrait ? "50%" : 20,
                zIndex: 1000,
                display: "flex",
                justifyContent: isPortrait ? "center" : "flex-start",
                width: isPortrait ? "calc(100% - 80px)" : "auto",
                ...vis(fShow, fHide),
            }}>
                <div
                    ref={filterContainerRef}
                    style={{
                        position: "relative",
                        display: "flex",
                        // Landscape & portrait → row; desktop → column
                        flexDirection: isPortrait || isLandscape ? "row" : "column",
                        flexWrap: "nowrap",
                        padding: isLandscape ? 3 : isPortrait ? 4 : 6,
                        borderRadius: isLandscape ? 10 : isPortrait ? 12 : 14,
                        background: "rgba(255,255,255,0.12)",
                        backdropFilter: "blur(20px) saturate(180%)",
                        WebkitBackdropFilter: "blur(20px) saturate(180%)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        gap: 3,
                        width: isPortrait ? "100%" : "auto",
                        maxWidth: isPortrait ? "100%" : isLandscape ? "none" : 140,
                        justifyContent: isPortrait ? "stretch" : "flex-start",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                        // Safety net: landscape can scroll horizontally if labels don't fit
                        overflowX: isLandscape ? "auto" : "hidden",
                        overflowY: "hidden",
                    }}
                >
                    {/* Desktop vertical sliding highlight */}
                    {layoutMode === "desktop" && (
                        <div style={{
                            position: "absolute",
                            top: getDesktopFilterTop(filterType),
                            left: 4,
                            width: "calc(100% - 8px)",
                            height: 46,
                            borderRadius: 10,
                            background: "rgba(255,255,255,0.9)",
                            backdropFilter: "blur(10px)",
                            transition: "top 0.3s cubic-bezier(0.22,1,0.36,1)",
                            boxShadow: "0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.5)",
                        }} />
                    )}

                    {/* Horizontal sliding highlight — portrait & landscape */}
                    {layoutMode !== "desktop" && buttonWidths.length > 0 && (
                        <div style={{
                            position: "absolute",
                            top: 4,
                            left: getHSlideLeft(),
                            width: getFilterWidth(filters.findIndex(f => f.id === filterType)),
                            height: "calc(100% - 8px)",
                            borderRadius: 8,
                            background: "rgba(255,255,255,0.9)",
                            backdropFilter: "blur(10px)",
                            transition: "left 0.3s cubic-bezier(0.22,1,0.36,1), width 0.3s cubic-bezier(0.22,1,0.36,1)",
                            boxShadow: "0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.5)",
                        }} />
                    )}

                    {filters.map((filter) => {
                        const isActive = filterType === filter.id;
                        const isRowLayout = isPortrait || isLandscape;
                        return (
                            <button
                                key={filter.id}
                                className="filter-button"
                                onClick={() => onFilterChange(filter.id)}
                                style={{
                                    zIndex: 1,
                                    padding: filterPad,
                                    borderRadius: 8,
                                    border: "none",
                                    background: "transparent",
                                    color: isActive ? "#000" : "rgba(255,255,255,0.75)",
                                    fontWeight: isActive ? 600 : 500,
                                    fontSize: filterFont,
                                    cursor: "pointer",
                                    transition: "color 0.3s ease",
                                    whiteSpace: "nowrap",
                                    outline: "none",
                                    height: filterBtnH,
                                    textAlign: isRowLayout ? "center" : "left",
                                    WebkitTapHighlightColor: "transparent",
                                    flex: isPortrait ? "1 1 0" : "none",
                                    width: isPortrait ? "0" : isLandscape ? "auto" : "100%",
                                    minWidth: "0",
                                }}
                            >
                                {filter.label}
                            </button>
                        );
                    })}
                </div>
            </div>
            <GenreModal
                open={showGenreModal}
                onClose={() => setShowGenreModal(false)}
                selectedGenre={genre}
                onSelect={onGenreChange}
                contentType={contentType}
            />
        </>
    );
}

/** Shared glass-morphism style for control buttons */
function glassBtn(size: number): React.CSSProperties {
    return {
        width: size, height: size,
        borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", color: "#fff",
        background: "rgba(255,255,255,0.12)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.18), inset 0 1px 1px rgba(255,255,255,0.18)",
        transition: "all 0.25s ease",
    };
}
