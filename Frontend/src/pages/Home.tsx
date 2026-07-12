import { useEffect, useState, useRef } from "react";
import api from "../api/api";
import TrailerCard from "../components/TrailerCard";
import ContentToggle from "../components/ContentToggle";

interface Movie {
    id: number;
    title: string;
    vote_average: number;
    poster_path?: string;
    release_date?: string;
}

export default function Home() {
    const [isMuted, setIsMuted] = useState(true);
    const [loadedIndices, setLoadedIndices] = useState<Set<number>>(new Set([0]));
    const isTransitioning = false;
    const containerRef = useRef<HTMLDivElement>(null);
    const touchStartY = useRef(0);
    const touchStartTime = useRef(0);
    const fetchingMoreRef = useRef(false);
    const [contentType, setContentType] = useState<"movie" | "tv">("movie");
    const [filterType, setFilterType] = useState<"now_playing" | "popular" | "top_rated" | "upcoming">("now_playing");
    const [initialLoading, setInitialLoading] = useState(true);
    const [movieTrailers, setMovieTrailers] = useState<Movie[]>([]);
    const [tvTrailers, setTvTrailers] = useState<Movie[]>([]);
    const [movieIndex, setMovieIndex] = useState(0);
    const [tvIndex, setTvIndex] = useState(0);
    const [movieLoading, setMovieLoading] = useState(true);
    const [tvLoading, setTvLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const isPausedRef = useRef(false); 
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const inactivityTimeoutRef = useRef<number | null>(null);
    const switchingRef = useRef(false);
    const requestIdRef = useRef(0);
    const fetchControllerRef = useRef<AbortController | null>(null);
    const pageRef = useRef({
        movie: {
            now_playing: 1,
            popular: 1,
            top_rated: 1,
            upcoming: 1,
        },
        tv: {
            now_playing: 1,
            popular: 1,
            top_rated: 1,
            upcoming: 1,
        },
    });

    const PRELOAD_THRESHOLD = 10;
    const currentIndex =
        contentType === "movie"
            ? movieIndex
            : tvIndex;


    const moviesWithTrailers =
        contentType === "movie"
            ? movieTrailers
            : tvTrailers;

    const isLoading =
        contentType === "movie"
            ? movieLoading
            : tvLoading;

    useEffect(() => {
        if (!containerRef.current) return;

        containerRef.current.style.transition =
            "transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)";

        containerRef.current.style.transform =
            `translateY(-${currentIndex * 100}dvh)`;
    }, [contentType, currentIndex]);

    const fetchContent = async (
        page: number,
        type: "movie" | "tv",
        filter: "now_playing" | "popular" | "top_rated" | "upcoming" = "now_playing"
    ) => {
        const requestId = ++requestIdRef.current;

        if (page === 1 || !fetchControllerRef.current) {
            fetchControllerRef.current?.abort();
            fetchControllerRef.current = new AbortController();
        }

        const signal = fetchControllerRef.current?.signal;

        try {
            let items: any[] = [];
            if (page === 1) {
                if (type === "movie") {
                    setMovieLoading(true);
                } else {
                    setTvLoading(true);
                }
            }

            const tvFilterMap = {
                now_playing: "airing_today",
                popular: "on_the_air",
                top_rated: "popular",
                upcoming: "top_rated",
            } as const;

            if (type === "movie") {
                const response = await api.get(`/movies/${filter}/movie/${page}`,
                    { signal });
                items = response.data.results;
                if (requestId !== requestIdRef.current) return;
            } else {
                const tvFilter = tvFilterMap[filter];

                const response = await api.get(`/tv/tv/${tvFilter}/${page}`, { signal });
                items = response.data.results;
                if (requestId !== requestIdRef.current) return;
            }

            const trailerChecks = items.map(async (item: any) => {
                try {
                    const trailer = await api.get(`/trailer/${type}/${item.id}`, { signal });

                    if (trailer.data?.data?.key) {
                        return item;
                    }
                } catch (err: any) {
                    if (
                        err.code === "ERR_CANCELED" ||
                        err.name === "CanceledError"
                    ) {
                        return null;
                    }

                    return null;
                }

                return null;
            });

            const results = await Promise.all(trailerChecks);

            if (requestId !== requestIdRef.current) return;

            const itemsWithTrailer = results.filter(Boolean);

            if (type === "movie") {
                if (page === 1) {
                    if (requestId !== requestIdRef.current) return;
                    setMovieTrailers(itemsWithTrailer);
                } else {
                    setMovieTrailers(prev => {
                        const merged = [...prev, ...itemsWithTrailer];

                        return Array.from(
                            new Map(merged.map(item => [item.id, item])).values()
                        );
                    });
                }
            } else {
                if (page === 1) {
                    if (requestId !== requestIdRef.current) return;
                    setTvTrailers(itemsWithTrailer);
                } else {
                    setTvTrailers(prev => {
                        const merged = [...prev, ...itemsWithTrailer];

                        return Array.from(
                            new Map(merged.map(item => [item.id, item])).values()
                        );
                    });
                }
            }
        } catch (err: any) {

            if (
                err.code === "ERR_CANCELED" ||
                err.name === "CanceledError"
            ) {
                return;
            }

            console.error(err);
        } finally {
            if (requestId === requestIdRef.current) {

                if (type === "movie") {
                    setMovieLoading(false);
                } else {
                    setTvLoading(false);
                }

                if (initialLoading) {
                    setInitialLoading(false);
                }
            }
        }
    };

    useEffect(() => {
        return () => {
            fetchControllerRef.current?.abort();
        };
    }, []);

    // ── UI visibility / inactivity timer (shared across all overlays) ──────────

    // Keep isPausedRef in sync so stale closures (event listeners) read live value
    useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

    const showUIControls = () => {
        setIsVisible(true);
        if (inactivityTimeoutRef.current) {
            clearTimeout(inactivityTimeoutRef.current);
            inactivityTimeoutRef.current = null;
        }
        // Read the ref — not the closed-over state — so this is always current
        if (!isPausedRef.current) {
            inactivityTimeoutRef.current = window.setTimeout(() => {
                setIsVisible(false);
            }, 3000);
        }
    };

    useEffect(() => {
        const events = ['mousemove', 'mousedown', 'click', 'scroll', 'keydown', 'touchstart'] as const;
        events.forEach(ev => document.addEventListener(ev, showUIControls));
        inactivityTimeoutRef.current = window.setTimeout(() => setIsVisible(false), 3000);
        return () => {
            events.forEach(ev => document.removeEventListener(ev, showUIControls));
            if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
        };
    }, []);

    // Pin controls visible while paused; restart countdown when resumed
    useEffect(() => {
        if (isPaused) {
            if (inactivityTimeoutRef.current) {
                clearTimeout(inactivityTimeoutRef.current);
                inactivityTimeoutRef.current = null;
            }
            setIsVisible(true);
        } else {
            // Resumed — give 3 s before hiding
            if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
            inactivityTimeoutRef.current = window.setTimeout(() => {
                setIsVisible(false);
            }, 3000);
        }
    }, [isPaused]);


    useEffect(() => {
        if (
            moviesWithTrailers.length > 0 &&
            currentIndex >= moviesWithTrailers.length - PRELOAD_THRESHOLD &&
            !fetchingMoreRef.current
        ) {
            fetchingMoreRef.current = true;

            const nextPage =
                pageRef.current[contentType][filterType] + 1;

            pageRef.current[contentType][filterType] = nextPage;

            fetchContent(nextPage, contentType, filterType).finally(() => {
                fetchingMoreRef.current = false;
            });
        }
    }, [currentIndex, moviesWithTrailers.length, contentType, filterType]);

    // Fetch when filter changes
    useEffect(() => {
        pageRef.current[contentType][filterType] = 1;
        setMovieIndex(0);
        setTvIndex(0);

        // Clear existing data
        if (contentType === "movie") {
            setMovieTrailers([]);
            setMovieLoading(true);
        } else {
            setTvTrailers([]);
            setTvLoading(true);
        }

        fetchContent(1, contentType, filterType);
    }, [filterType, contentType]);

    const handleFilterChange = (filter: "now_playing" | "popular" | "top_rated" | "upcoming") => {
        setFilterType(filter);
    };

    useEffect(() => {
        pageRef.current[contentType][filterType] = 1;

        if (
            contentType === "movie" &&
            movieTrailers.length === 0
        ) {
            fetchContent(1, contentType, filterType);
        }

        if (
            contentType === "tv" &&
            tvTrailers.length === 0
        ) {
            fetchContent(1, contentType, filterType);
        }

    }, [
        contentType,
        movieTrailers.length,
        tvTrailers.length
    ]);

    // Manage loaded indices - keep previous 5, current, and next 5 (11 total)
    useEffect(() => {
        if (moviesWithTrailers.length === 0) return;

        const indicesToLoad = new Set<number>();

        indicesToLoad.add(currentIndex);

        for (let i = 1; i <= 5; i++) {
            if (currentIndex - i >= 0) {
                indicesToLoad.add(currentIndex - i);
            }
        }

        for (let i = 1; i <= 5; i++) {
            if (currentIndex + i < moviesWithTrailers.length) {
                indicesToLoad.add(currentIndex + i);
            }
        }

        setLoadedIndices(indicesToLoad);

    }, [currentIndex, moviesWithTrailers.length]);

    // Global toggle sound function
    const toggleSound = () => {
        setIsMuted(!isMuted);
    };

    const togglePaused = () => {
        setIsPaused(prev => !prev);
    };

    const toggleFullscreen = () => {
        setIsFullscreen(prev => !prev);
    };


    // Navigation functions
    const goToNext = () => {
        if (currentIndex < moviesWithTrailers.length - 1) {
            handleNavigation(currentIndex + 1);
        }
    };

    const goToPrevious = () => {
        if (currentIndex > 0) {
            handleNavigation(currentIndex - 1);
        }
    };

    const handleNavigation = (index: number) => {
        if (switchingRef.current) return;

        // Reset paused state so new card auto-plays
        if (index !== currentIndex) {
            setIsPaused(false);
        }

        if (contentType === "movie") {
            setMovieIndex(index);
        } else {
            setTvIndex(index);
        }
    };

    // Handle wheel scroll
    const handleWheel = (e: WheelEvent) => {
        if (switchingRef.current) return;

        const isTrackpad = Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) < 10;

        if (isTrackpad) {
            const threshold = 50;
            if (Math.abs(e.deltaY) < threshold) return;
        }

        const direction = e.deltaY > 0 ? 1 : -1;
        const nextIndex = currentIndex + direction;

        if (nextIndex < 0 || nextIndex >= moviesWithTrailers.length) {
            e.preventDefault();
            return;
        }

        e.preventDefault();
        e.stopPropagation();

    };

    // Handle touch scroll
    const handleTouchStart = (e: TouchEvent) => {
        if (switchingRef.current) return;

        touchStartY.current = e.touches[0].clientY;
        touchStartTime.current = Date.now();
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (switchingRef.current) return;
        e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
        if (switchingRef.current) return;

        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchStartY.current - touchEndY;
        const timeDiff = Date.now() - touchStartTime.current;

        const minSwipeDistance = 80;
        const isFlick = timeDiff < 300 && Math.abs(diff) > 50;

        if (Math.abs(diff) < minSwipeDistance && !isFlick) {
            return;
        }

        const direction = diff > 0 ? 1 : -1;
        const nextIndex = currentIndex + direction;

        if (nextIndex < 0 || nextIndex >= moviesWithTrailers.length) {
            return;
        }

        handleNavigation(nextIndex);
    };

    // Keyboard controls
    useEffect(() => {
        if (!moviesWithTrailers.length) return;

        const handleKeyDown = (e: KeyboardEvent) => {

            if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                e.preventDefault();
                goToNext();
            } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                e.preventDefault();
                goToPrevious();
            } else if (e.key === " " || e.key === "Space") {
                e.preventDefault();
                toggleSound();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentIndex, moviesWithTrailers.length]);

    // Add event listeners
    useEffect(() => {
        const container = containerRef.current;
        if (!container || moviesWithTrailers.length === 0) return;

        container.addEventListener("wheel", handleWheel, { passive: false });
        container.addEventListener("touchstart", handleTouchStart, { passive: true });
        container.addEventListener("touchmove", handleTouchMove, { passive: false });
        container.addEventListener("touchend", handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener("wheel", handleWheel);
            container.removeEventListener("touchstart", handleTouchStart);
            container.removeEventListener("touchmove", handleTouchMove);
            container.removeEventListener("touchend", handleTouchEnd);
        };
    }, [currentIndex, moviesWithTrailers.length, isTransitioning]);

    // Reset transform when movies change
    useEffect(() => {
        if (containerRef.current && moviesWithTrailers.length > 0) {
            containerRef.current.style.transition = "none";
            containerRef.current.style.transform = "translateY(0)";

            const initialIndices = new Set<number>();
            for (let i = 0; i < Math.min(11, moviesWithTrailers.length); i++) {
                initialIndices.add(i);
            }
            setLoadedIndices(initialIndices);
        }
    }, []);


    // Loading state
    if (initialLoading) {
        return (
            <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#000", color: "#fff" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
                    <div style={{ width: "50px", height: "50px", border: "4px solid rgba(255,255,255,0.1)", borderTop: "4px solid #ffffff", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    <p style={{ color: "rgba(255,255,255,0.7)" }}>Loading movies...</p>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    if (!isLoading && moviesWithTrailers.length === 0) {
        return (
            <div
                style={{
                    height: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#000",
                    color: "#fff",
                    padding: "20px",
                }}
            >
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎬</div>
                <h2 style={{ fontSize: "24px", marginBottom: "8px" }}>
                    No trailers available
                </h2>
                <p
                    style={{
                        color: "rgba(255,255,255,0.6)",
                        textAlign: "center",
                    }}
                >
                    No trailers found.
                </p>
            </div>
        );
    }

    const handleContentChange = (type: "movie" | "tv") => {
        if (type === contentType) return;

        switchingRef.current = true;

        setContentType(type);

        setTimeout(() => {
            switchingRef.current = false;
        }, 300);
    };



    return (
        <div className="home-root" style={{ width: "100%", overflow: "hidden", position: "relative", backgroundColor: "#000" }}>
            {/* dvh fallback: 100vh on mobile can include space covered by
                the browser's address bar / toolbar, which is what was
                letting bottom-anchored UI get cropped in portrait. */}
            <style>
                {`
                    .home-root, .home-carousel, .home-slide {
                        height: 100vh;
                        height: 100dvh;
                    }

                    /* Portrait phone — hide desktop-only overlays */
                    @media (max-width: 582px) {
                        .home-nav-arrows {
                            display: none !important;
                        }

                        .home-keyboard-hint {
                            display: none !important;
                        }
                    }

                    /* Landscape phone — no room for nav arrows; swipe handles navigation */
                    @media (max-height: 500px) and (orientation: landscape) {
                        .home-nav-arrows {
                            display: none !important;
                        }

                        .home-keyboard-hint {
                            display: none !important;
                        }
                    }
                `}
            </style>

            <ContentToggle
                contentType={contentType}
                onChange={handleContentChange}
                filterType={filterType}
                onFilterChange={handleFilterChange}
                isMuted={isMuted}
                onToggleMute={toggleSound}
                isPaused={isPaused}
                onTogglePlayPause={togglePaused}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
                isVisible={isVisible}
                onActivity={showUIControls}
            />

            <div
                ref={containerRef}
                className="home-carousel"
                style={{
                    width: "100%",
                    transition: "transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                    transform: `translateY(-${currentIndex * 100}dvh)`,
                    willChange: "transform",
                }}
            >
                {moviesWithTrailers.map((movie: any, index: number) => {
                    const shouldRender = loadedIndices.has(index);

                    return (
                        <div
                            key={movie.id}
                            className="home-slide"
                            style={{
                                width: "100%",
                                position: "relative",
                                overflow: "hidden",
                                flexShrink: 0,
                                backgroundColor: "#0a0a0a",
                            }}
                        >
                            {shouldRender ? (
                                <TrailerCard
                                    movie={movie}
                                    isActive={index === currentIndex}
                                    isMuted={isMuted}
                                    contentType={contentType}
                                    isPaused={isPaused}
                                    isFullscreen={isFullscreen}
                                    onFullscreenChange={setIsFullscreen}
                                    onTogglePlayPause={togglePaused}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        backgroundColor: "#0a0a0a",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "16px",
                                    }}
                                >
                                    {movie.poster_path && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                opacity: 0.1,
                                                backgroundImage: `url(https://image.tmdb.org/t/p/w500${movie.poster_path})`,
                                                backgroundSize: "cover",
                                                backgroundPosition: "center",
                                                filter: "blur(20px)",
                                            }}
                                        />
                                    )}
                                    <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                                        <div style={{ width: "30px", height: "30px", border: "3px solid rgba(255,255,255,0.1)", borderTop: "3px solid #ffffff", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Loading...</p>
                                        <h3 style={{ color: "rgba(255,255,255,0.6)", fontSize: "18px", fontWeight: "500" }}>{movie.title}</h3>
                                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {isTransitioning && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 50, background: "rgba(0,0,0,0.2)" }} />
            )}

            {/* Navigation arrows — owned by Home, visibility driven by shared isVisible */}
            {moviesWithTrailers.length > 0 && (
                <div
                    className="home-nav-arrows"
                    style={{
                        position: "fixed",
                        right: 14,
                        top: "50%",
                        transform: `translateY(-50%) ${!isVisible ? 'translateX(80px)' : 'translateX(0)'}`,
                        zIndex: 20,
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        opacity: isVisible ? 1 : 0,
                        pointerEvents: isVisible ? "auto" : "none",
                        transition: "opacity 0.3s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1)",
                    }}
                >
                    {currentIndex > 0 && (
                        <button
                            onClick={goToPrevious}
                            style={{
                                width: "34px",
                                height: "34px",
                                borderRadius: "50%",
                                backgroundColor: "rgba(255,255,255,0.2)",
                                backdropFilter: "blur(10px)",
                                border: "1.5px solid rgba(255,255,255,0.3)",
                                color: "white",
                                fontSize: "16px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.3s ease",
                                outline: "none",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.4)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
                            }}
                        >
                            ↑
                        </button>
                    )}

                    {currentIndex < moviesWithTrailers.length - 1 && (
                        <button
                            onClick={goToNext}
                            style={{
                                width: "34px",
                                height: "34px",
                                borderRadius: "50%",
                                backgroundColor: "rgba(255,255,255,0.2)",
                                backdropFilter: "blur(10px)",
                                border: "1.5px solid rgba(255,255,255,0.3)",
                                color: "white",
                                fontSize: "16px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.3s ease",
                                outline: "none",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.4)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
                            }}
                        >
                            ↓
                        </button>
                    )}
                </div>
            )}

            {/* Keyboard hint — owned by Home, hidden on mobile */}
            {moviesWithTrailers.length > 0 && (
                <div
                    className="home-keyboard-hint"
                    style={{
                        position: "fixed",
                        bottom: 10,
                        left: "50%",
                        transform: `translateX(-50%) ${!isVisible ? 'translateY(30px)' : 'translateY(0)'}`,
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "10px",
                        zIndex: 10,
                        textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                        textAlign: "center",
                        pointerEvents: "none",
                        opacity: isVisible ? 1 : 0,
                        transition: "opacity 0.3s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1)",
                    }}
                >
                    ↑ ↓ to navigate
                </div>
            )}
        </div>
    );
}