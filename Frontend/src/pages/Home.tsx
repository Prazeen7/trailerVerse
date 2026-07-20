import { useEffect, useState, useRef } from "react";
import api from "../api/api";
import TrailerCard from "../components/TrailerCard";
import ContentToggle from "../components/ContentToggle";
import Loader from "../components/TrailerLoader";

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
    const [movieTrailers, setMovieTrailers] = useState<Movie[]>([]);
    const [tvTrailers, setTvTrailers] = useState<Movie[]>([]);
    const [movieIndex, setMovieIndex] = useState(0);
    const [tvIndex, setTvIndex] = useState(0);
    const [movieLoading, setMovieLoading] = useState(true);
    const [tvLoading, setTvLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isUIVisible, setIsUIVisible] = useState(true);
    const switchingRef = useRef(false);
    const requestIdRef = useRef(0);
    const fetchControllerRef = useRef<AbortController | null>(null);
    const [region, setRegion] = useState<string>();
    const [initialLoading, setInitialLoading] = useState(true);
    const [fetchLoading, setFetchLoading] = useState(false);
    const trailerTimeoutRef = useRef<number | null>(null);
    const [iframeLoading, setIframeLoading] = useState(false);
    const [genre, setGenre] = useState<number>();
    const [releaseYear, setReleaseYear] = useState<string>();
    const [originCountry, setOriginCountry] = useState<string>();
    const [minVoteAverage, setMinVoteAverage] = useState<number>();

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

    const getStorageKey = (
        type: "movie" | "tv",
        filter: "now_playing" | "popular" | "top_rated" | "upcoming",
        genre?: number,
        releaseYear?: string,
        originCountry?: string,
        minVoteAverage?: number
    ) =>
        `used-pages-${type}-${filter}-${genre ?? "all"}-${releaseYear ?? "all"}-${originCountry ?? "all"}-${minVoteAverage ?? "all"}`;

    const getUsedPages = (
        type: "movie" | "tv",
        filter: "now_playing" | "popular" | "top_rated" | "upcoming",
        genre?: number,
        releaseYear?: string,
        originCountry?: string,
        minVoteAverage?: number
    ): number[] => {
        try {
            const stored = localStorage.getItem(
                getStorageKey(
                    type,
                    filter,
                    genre,
                    releaseYear,
                    originCountry,
                    minVoteAverage
                )
            );

            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    };

    const saveUsedPage = (
        type: "movie" | "tv",
        filter: "now_playing" | "popular" | "top_rated" | "upcoming",
        page: number,
        totalPages: number,
        genre?: number,
        releaseYear?: string,
        originCountry?: string,
        minVoteAverage?: number
    ) => {
        const key = getStorageKey(
            type,
            filter,
            genre,
            releaseYear,
            originCountry,
            minVoteAverage
        );

        let pages = getUsedPages(
            type,
            filter,
            genre,
            releaseYear,
            originCountry,
            minVoteAverage
        );

        if (!pages.includes(page)) {
            pages.push(page);
        }

        if (pages.length >= totalPages) {
            pages = [page];
        }

        localStorage.setItem(key, JSON.stringify(pages));
    };

    useEffect(() => {
        if (!containerRef.current) return;

        containerRef.current.style.transition =
            "transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)";

        containerRef.current.style.transform =
            `translateY(-${currentIndex * 100}dvh)`;
    }, [contentType, currentIndex]);

    const fetchContent = async (
        type: "movie" | "tv",
        filter: "now_playing" | "popular" | "top_rated" | "upcoming" = "now_playing"
    ) => {
        setFetchLoading(true);
        const requestId = ++requestIdRef.current;

        fetchControllerRef.current?.abort();

        const controller = new AbortController();
        fetchControllerRef.current = controller;

        const signal = controller.signal;

        try {
            const usedPages = getUsedPages(
                type,
                filter,
                genre,
                releaseYear,
                originCountry,
                minVoteAverage
            );
            let items: any[] = [];
            if (type === "movie") {
                setMovieLoading(true);
            } else {
                setTvLoading(true);
            }

            const tvFilterMap = {
                now_playing: "airing_today",
                popular: "on_the_air",
                top_rated: "popular",
                upcoming: "top_rated",
            } as const;

            if (type === "movie") {
                const response = await api.get(
                    `/movies/${filter}/movie`,
                    {
                        signal,
                        params: {
                            excludePages: usedPages.join(","),
                            genre,
                            region,
                            releaseYear,
                            originCountry,
                            minVoteAverage,
                        },
                    }
                );
                setRegion(response.data.region);
                items = response.data.results;
                saveUsedPage(
                    type,
                    filter,
                    response.data.page,
                    response.data.total_pages,
                    genre,
                    releaseYear,
                    originCountry,
                    minVoteAverage
                );
                if (requestId !== requestIdRef.current) return;
            } else {
                const tvFilter = tvFilterMap[filter];

                const response = await api.get(
                    `/tv/tv/${tvFilter}`,
                    {
                        signal,
                        params: {
                            excludePages: usedPages.join(","),
                            genre,
                            releaseYear,
                            originCountry,
                            minVoteAverage,
                        },
                    }
                );
                setRegion(response.data.region);
                items = response.data.results;

                saveUsedPage(
                    type,
                    filter,
                    response.data.page,
                    response.data.total_pages,
                    genre
                );

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
                setMovieTrailers(prev => {
                    const unique = new Map<number, Movie>();

                    prev.forEach(movie => unique.set(movie.id, movie));
                    itemsWithTrailer.forEach(movie => unique.set(movie.id, movie));

                    return [...unique.values()];
                });
            } else {
                setTvTrailers(prev => {
                    const unique = new Map<number, Movie>();

                    prev.forEach(movie => unique.set(movie.id, movie));
                    itemsWithTrailer.forEach(movie => unique.set(movie.id, movie));

                    return [...unique.values()];
                });
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
            setFetchLoading(false);
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

    const handleTrailerReady = (id: number) => {

        if (moviesWithTrailers[currentIndex]?.id === id) {
            setIframeLoading(false);
        }
    };

    useEffect(() => {
        return () => {
            fetchControllerRef.current?.abort();
        };
    }, []);

    const PREFETCH_THRESHOLD =
        genre !== undefined ? 10 : 5;

    // lazy load
    useEffect(() => {

        if (
            moviesWithTrailers.length === 0 ||
            fetchingMoreRef.current
        ) {
            return;
        }

        if (
            currentIndex >= moviesWithTrailers.length - PREFETCH_THRESHOLD &&
            !fetchingMoreRef.current
        ) {
            fetchingMoreRef.current = true;

            fetchContent(contentType, filterType).finally(() => {
                fetchingMoreRef.current = false;
            });
        }
    }, [
        currentIndex,
        moviesWithTrailers.length,
        contentType,
        filterType,
        genre,
        region,
        releaseYear,
        originCountry,
        minVoteAverage,
    ]);

    // Fetch when filter changes
    useEffect(() => {
        setMovieIndex(0);
        setTvIndex(0);

        setIframeLoading(true);

        if (contentType === "movie") {
            setMovieTrailers([]);
            setMovieLoading(true);
        } else {
            setTvTrailers([]);
            setTvLoading(true);
        }

        fetchContent(contentType, filterType);
    }, [
        filterType,
        contentType,
        genre,
        region,
        releaseYear,
        originCountry,
        minVoteAverage,
    ]);

    const handleFilterChange = (filter: "now_playing" | "popular" | "top_rated" | "upcoming") => {
        setFilterType(filter);
    };


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

        if (index !== currentIndex) {

            if (trailerTimeoutRef.current) {
                clearTimeout(trailerTimeoutRef.current);
            }

            trailerTimeoutRef.current = window.setTimeout(() => {
            }, 5000);
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
        handleNavigation(nextIndex);

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

    const handleContentChange = (type: "movie" | "tv") => {
        if (type === contentType) return;

        switchingRef.current = true;

        setContentType(type);

        setTimeout(() => {
            switchingRef.current = false;
        }, 300);
    };

    if (!isLoading && moviesWithTrailers.length === 0) {
        return (
            <>
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
                    isUIVisible={isUIVisible}
                    onToggleUI={() => setIsUIVisible(prev => !prev)}
                    genre={genre}
                    releaseYear={releaseYear}
                    originCountry={originCountry}
                    minVoteAverage={minVoteAverage}

                    onGenreChange={setGenre}
                    onReleaseYearChange={setReleaseYear}
                    onOriginCountryChange={setOriginCountry}
                    onMinVoteAverageChange={setMinVoteAverage}

                    region={region}
                    onRegionChange={setRegion}
                />

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
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                        🎬
                    </div>

                    <h2
                        style={{
                            fontSize: "24px",
                            marginBottom: "8px",
                        }}
                    >
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
            </>
        );
    }

    const isLazyLoadingAtEnd =
        fetchLoading &&
        moviesWithTrailers.length > 0 &&
        currentIndex === moviesWithTrailers.length - 1;

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

                    .mobile-loading-pill {
                        display: none;
                    }

                    /* Portrait phone — hide desktop-only overlays */
                    @media (max-width: 582px) {
                        .home-nav-arrows {
                            display: none !important;
                        }

                        .home-keyboard-hint {
                            display: none !important;
                        }

                        .mobile-loading-pill {
                            display: flex !important;
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

                        .mobile-loading-pill {
                            display: flex !important;
                        }
                    }

                    @keyframes btn-spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; transform: translate(-50%, 10px); }
                        to { opacity: 1; transform: translate(-50%, 0); }
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
                isUIVisible={isUIVisible}
                onToggleUI={() => setIsUIVisible(prev => !prev)}
                genre={genre}
                releaseYear={releaseYear}
                originCountry={originCountry}
                minVoteAverage={minVoteAverage}
                onGenreChange={setGenre}
                onReleaseYearChange={setReleaseYear}
                onOriginCountryChange={setOriginCountry}
                onMinVoteAverageChange={setMinVoteAverage}
                region={region}
                onRegionChange={setRegion}
            />

            {(initialLoading || (fetchLoading && moviesWithTrailers.length === 0)) && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "#000",
                        zIndex: 999,
                    }}
                >
                    <Loader />
                </div>
            )}

            {iframeLoading && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.75)",
                        zIndex: 998,
                    }}
                >
                    <Loader />
                </div>
            )}

            {isLazyLoadingAtEnd && (
                <div
                    className="mobile-loading-pill"
                    style={{
                        position: "fixed",
                        bottom: "80px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: "rgba(0, 0, 0, 0.75)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: "20px",
                        padding: "8px 16px",
                        alignItems: "center",
                        gap: "8px",
                        zIndex: 100,
                        pointerEvents: "none",
                        color: "white",
                        fontSize: "12px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
                        animation: "fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                >
                    <div
                        style={{
                            width: "14px",
                            height: "14px",
                            border: "2px solid rgba(255, 255, 255, 0.3)",
                            borderTop: "2px solid #ffffff",
                            borderRadius: "50%",
                            animation: "btn-spin 1s linear infinite",
                        }}
                    />
                    <span>Loading more...</span>
                </div>
            )}

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
                                    onReady={() => handleTrailerReady(movie.id)}
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
                        transform: `translateY(-50%) ${!isUIVisible ? 'translateX(80px)' : 'translateX(0)'}`,
                        zIndex: 20,
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        opacity: isUIVisible ? 1 : 0,
                        pointerEvents: isUIVisible ? "auto" : "none",
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

                    {(currentIndex < moviesWithTrailers.length - 1 || isLazyLoadingAtEnd) && (
                        <button
                            onClick={goToNext}
                            disabled={isLazyLoadingAtEnd}
                            style={{
                                width: "34px",
                                height: "34px",
                                borderRadius: "50%",
                                backgroundColor: "rgba(255,255,255,0.2)",
                                backdropFilter: "blur(10px)",
                                border: "1.5px solid rgba(255,255,255,0.3)",
                                color: "white",
                                fontSize: "16px",
                                cursor: isLazyLoadingAtEnd ? "default" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.3s ease",
                                outline: "none",
                                opacity: isLazyLoadingAtEnd ? 0.7 : 1,
                            }}
                            onMouseEnter={(e) => {
                                if (!isLazyLoadingAtEnd) {
                                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.4)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isLazyLoadingAtEnd) {
                                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
                                }
                            }}
                        >
                            {isLazyLoadingAtEnd ? (
                                <div
                                    style={{
                                        width: "16px",
                                        height: "16px",
                                        border: "2px solid rgba(255,255,255,0.3)",
                                        borderTop: "2px solid #ffffff",
                                        borderRadius: "50%",
                                        animation: "btn-spin 1s linear infinite",
                                    }}
                                />
                            ) : (
                                "↓"
                            )}
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
                        transform: `translateX(-50%) ${!isUIVisible ? 'translateY(30px)' : 'translateY(0)'}`,
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "10px",
                        zIndex: 10,
                        textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                        textAlign: "center",
                        pointerEvents: "none",
                        opacity: isUIVisible ? 1 : 0,
                        transition: "opacity 0.3s ease, transform 0.4s cubic-bezier(0.22,1,0.36,1)",
                    }}
                >
                    ↑ ↓ to navigate
                </div>
            )}
        </div>
    );
}