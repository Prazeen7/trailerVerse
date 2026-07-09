import { useEffect, useState, useRef } from "react";
import api from "../api/api";
import TrailerCard from "../components/TrailerCard";

interface Movie {
    id: number;
    title: string;
    vote_average: number;
    poster_path?: string;
    release_date?: string;
}

function Banner({ visible, timer }: { visible: boolean; timer: number }) {
    if (!visible) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 200,
                backgroundColor: "rgba(255, 59, 48, 0.95)",
                color: "white",
                padding: "14px 24px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                backdropFilter: "blur(10px)",
                borderBottom: "2px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                animation: "slideDown 0.3s ease",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                <div style={{ fontSize: "20px" }}>⏳</div>
                <div>
                    <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "2px" }}>
                        Slow down!
                    </div>
                    <div style={{ fontSize: "13px", opacity: 0.9 }}>
                        Please wait {timer} second{timer !== 1 ? 's' : ''} before continuing.
                    </div>
                </div>
            </div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        fontSize: "20px",
                        fontWeight: "700",
                        minWidth: "40px",
                        textAlign: "center",
                        backgroundColor: "rgba(255,255,255,0.15)",
                        padding: "4px 12px",
                        borderRadius: "8px",
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    {timer}s
                </div>
                <div
                    style={{
                        width: "80px",
                        height: "4px",
                        backgroundColor: "rgba(255,255,255,0.2)",
                        borderRadius: "2px",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            width: `${(timer / 10) * 100}%`,
                            height: "100%",
                            backgroundColor: "white",
                            borderRadius: "2px",
                            transition: "width 1s linear",
                        }}
                    />
                </div>
            </div>
            <style>
                {`
                    @keyframes slideDown {
                        from { transform: translateY(-100%); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `}
            </style>
        </div>
    );
}

export default function Home() {
    const [moviesWithTrailers, setMoviesWithTrailers] = useState<Movie[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [loadedIndices, setLoadedIndices] = useState<Set<number>>(new Set([0]));
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [bannerVisible, setBannerVisible] = useState(false);
    const [bannerTimer, setBannerTimer] = useState(10);
    const containerRef = useRef<HTMLDivElement>(null);
    const isScrolling = useRef(false);
    const touchStartY = useRef(0);
    const touchStartTime = useRef(0);
    const lastScrollTime = useRef(0);
    const scrollCooldown = useRef(false);
    const scrollLockRef = useRef(false);
    const continuousScrollCount = useRef(0);
    const continuousScrollTimer = useRef<number | null>(null);
    const lockTimer = useRef<number | null>(null);
    const isNavigating = useRef(false);
    const isLocked = useRef(false);
    const isTrackingRef = useRef(false);
    const countdownIntervalRef = useRef<number | null>(null);
    const lastScrollTimeRef = useRef<number>(0);

    // Fetch movies and check trailers
    useEffect(() => {
        const fetchMoviesAndTrailers = async () => {
            try {
                setIsLoading(true);

                const moviesResponse = await api.get("/movies/trending");
                const movies = moviesResponse.data.results;

                const trailerChecks = movies.map(async (movie: Movie) => {
                    try {
                        const response = await api.get(`/trailer/movie/${movie.id}`);
                        if (response.data && response.data.data && response.data.data.key) {
                            return movie;
                        }
                    } catch (error) {
                        // Movie doesn't have a trailer
                    }
                    return null;
                });

                const results = await Promise.all(trailerChecks);
                const moviesWithTrailer = results.filter((movie): movie is Movie => movie !== null);

                setMoviesWithTrailers(moviesWithTrailer);
            } catch (error) {
                console.error("Error fetching movies:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMoviesAndTrailers();
    }, []);

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

    // Clear all locks and timers
    const clearAllTimers = () => {
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        if (lockTimer.current) {
            clearTimeout(lockTimer.current);
            lockTimer.current = null;
        }
        if (continuousScrollTimer.current) {
            clearTimeout(continuousScrollTimer.current);
            continuousScrollTimer.current = null;
        }
    };

    // Lock scrolling for 10 seconds with countdown
    const lockScrolling = () => {
        // Prevent multiple locks
        if (isLocked.current) return;

        isLocked.current = true;
        scrollLockRef.current = true;

        // Clear any existing timers
        clearAllTimers();

        // Reset last scroll time
        lastScrollTimeRef.current = 0;

        // Show banner with timer
        setBannerTimer(10);
        setBannerVisible(true);

        // Update countdown every second
        countdownIntervalRef.current = setInterval(() => {
            setBannerTimer(prev => {
                const newTime = prev - 1;
                if (newTime <= 0) {
                    // Clear interval when timer reaches 0
                    if (countdownIntervalRef.current) {
                        clearInterval(countdownIntervalRef.current);
                        countdownIntervalRef.current = null;
                    }
                    return 0;
                }
                return newTime;
            });
        }, 1000);

        // Unlock after 10 seconds
        lockTimer.current = setTimeout(() => {
            // Clear the countdown interval
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
            }

            scrollLockRef.current = false;
            isLocked.current = false;
            continuousScrollCount.current = 0;
            lastScrollTimeRef.current = 0; // Reset last scroll time

            // Clear the continuous scroll timer
            if (continuousScrollTimer.current) {
                clearTimeout(continuousScrollTimer.current);
                continuousScrollTimer.current = null;
            }

            // Hide banner when unlocked
            setBannerVisible(false);
            setBannerTimer(10);

        }, 10000);
    };

    // Track continuous scrolling
    const trackContinuousScroll = (source: string = 'unknown') => {
        // Don't track if locked or already tracking
        if (isLocked.current || scrollLockRef.current) {
            return;
        }

        const now = Date.now();
        const timeSinceLastScroll = now - lastScrollTimeRef.current;

        // If more than 5 seconds have passed since last scroll, reset the count
        if (timeSinceLastScroll > 5000) {
            continuousScrollCount.current = 0;
            if (continuousScrollTimer.current) {
                clearTimeout(continuousScrollTimer.current);
                continuousScrollTimer.current = null;
            }
        }

        // Update last scroll time
        lastScrollTimeRef.current = now;

        // Increment count
        continuousScrollCount.current += 1;

        // Clear existing timer
        if (continuousScrollTimer.current) {
            clearTimeout(continuousScrollTimer.current);
        }

        // Set a timer to check for inactivity after 5 seconds
        continuousScrollTimer.current = setTimeout(() => {
            continuousScrollCount.current = 0;
            continuousScrollTimer.current = null;
        }, 5000);

        // Check if we need to lock
        if (continuousScrollCount.current >= 3 && !isLocked.current && !scrollLockRef.current) {
            lockScrolling();
            continuousScrollCount.current = 0;
            if (continuousScrollTimer.current) {
                clearTimeout(continuousScrollTimer.current);
                continuousScrollTimer.current = null;
            }
        }
    };

    // Navigation functions
    const goToNext = () => {
        if (isLocked.current || scrollLockRef.current) {
            return;
        }
        if (isScrolling.current || scrollCooldown.current || isTransitioning || isNavigating.current) {
            return;
        }
        if (currentIndex < moviesWithTrailers.length - 1) {
            trackContinuousScroll('navigation');
            handleNavigation(currentIndex + 1);
        }
    };

    const goToPrevious = () => {
        if (isLocked.current || scrollLockRef.current) {
            return;
        }
        if (isScrolling.current || scrollCooldown.current || isTransitioning || isNavigating.current) {
            return;
        }
        if (currentIndex > 0) {
            trackContinuousScroll('navigation');
            handleNavigation(currentIndex - 1);
        }
    };

    const handleNavigation = (index: number) => {
        if (isLocked.current || scrollLockRef.current || isScrolling.current || scrollCooldown.current || isTransitioning || isNavigating.current) {
            return;
        }

        isNavigating.current = true;
        isScrolling.current = true;
        setIsTransitioning(true);
        scrollCooldown.current = true;

        setCurrentIndex(index);

        const container = containerRef.current;
        if (container) {
            container.style.transition = "transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
            container.style.transform = `translateY(-${index * 100}dvh)`;
        }

        setTimeout(() => {
            isScrolling.current = false;
        }, 700);

        setTimeout(() => {
            setIsTransitioning(false);
        }, 800);

        setTimeout(() => {
            scrollCooldown.current = false;
        }, 1000);

        setTimeout(() => {
            isNavigating.current = false;
        }, 1200);
    };

    // Handle wheel scroll
    const handleWheel = (e: WheelEvent) => {
        if (isLocked.current || scrollLockRef.current || isScrolling.current || scrollCooldown.current || isTransitioning || isNavigating.current) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

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

        if (!isLocked.current && !scrollLockRef.current && !isNavigating.current) {
            if (direction > 0) {
                goToNext();
            } else {
                goToPrevious();
            }
        }
    };

    // Handle touch scroll
    const handleTouchStart = (e: TouchEvent) => {
        if (isLocked.current || scrollLockRef.current || isScrolling.current || scrollCooldown.current || isTransitioning || isNavigating.current) {
            e.preventDefault();
            return;
        }
        touchStartY.current = e.touches[0].clientY;
        touchStartTime.current = Date.now();
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (isLocked.current || scrollLockRef.current || isScrolling.current || scrollCooldown.current || isTransitioning || isNavigating.current) {
            e.preventDefault();
            return;
        }
        e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
        if (isLocked.current || scrollLockRef.current || isScrolling.current || scrollCooldown.current || isTransitioning || isNavigating.current) {
            e.preventDefault();
            return;
        }

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

        if (!isLocked.current && !scrollLockRef.current && !isNavigating.current) {
            if (direction > 0) {
                goToNext();
            } else {
                goToPrevious();
            }
        }
    };

    // Keyboard controls
    useEffect(() => {
        if (!moviesWithTrailers.length) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (isLocked.current || scrollLockRef.current || isScrolling.current || scrollCooldown.current || isTransitioning || isNavigating.current) {
                e.preventDefault();
                return;
            }

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

            clearAllTimers();
        };
    }, [currentIndex, moviesWithTrailers.length, isTransitioning]);

    // Reset transform when movies change
    useEffect(() => {
        if (containerRef.current && moviesWithTrailers.length > 0) {
            containerRef.current.style.transition = "none";
            containerRef.current.style.transform = "translateY(0)";
            setCurrentIndex(0);

            const initialIndices = new Set<number>();
            for (let i = 0; i < Math.min(11, moviesWithTrailers.length); i++) {
                initialIndices.add(i);
            }
            setLoadedIndices(initialIndices);
        }
    }, [moviesWithTrailers]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearAllTimers();
        };
    }, []);

    // Loading state
    if (isLoading) {
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

    if (moviesWithTrailers.length === 0) {
        return (
            <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#000", color: "#fff", padding: "20px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎬</div>
                <h2 style={{ fontSize: "24px", marginBottom: "8px" }}>No trailers available</h2>
                <p style={{ color: "rgba(255,255,255,0.6)", textAlign: "center" }}>No movies with trailers found at the moment. Please check back later.</p>
            </div>
        );
    }

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
                `}
            </style>
            <Banner visible={bannerVisible} timer={bannerTimer} />

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
                                    onNext={goToNext}
                                    onPrevious={goToPrevious}
                                    currentIndex={index}
                                    totalMovies={moviesWithTrailers.length}
                                    isMuted={isMuted}
                                    onToggleSound={toggleSound}
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
        </div>
    );
}