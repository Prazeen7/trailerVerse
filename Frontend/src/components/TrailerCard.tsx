import { useEffect, useState, useRef } from "react";
import api from "../api/api";
import Loader from "./TrailerLoader";

interface Props {
    movie: any;
    isActive?: boolean;
    onNext?: () => void;
    onPrevious?: () => void;
    currentIndex?: number;
    totalMovies?: number;
    isMuted?: boolean;
    onToggleSound?: () => void;
    contentType?: "movie" | "tv";
}

export default function TrailerCard({
    movie,
    isActive = true,
    onNext,
    onPrevious,
    currentIndex = 0,
    totalMovies = 1,
    isMuted = false,
    onToggleSound,
    contentType = "movie",
}: Props) {
    const [videoKey, setVideoKey] = useState("");
    const [showControls, setShowControls] = useState(true);
    const [iframeReady, setIframeReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [videoPlaying, setVideoPlaying] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const controlsTimeout = useRef<number | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const playAttempted = useRef(false);
    const initializedRef = useRef(false);
    const retryCount = useRef(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const hasLoopedRef = useRef(false);
    const [isPaused, setIsPaused] = useState(false);
    const [showPlaybackIcon, setShowPlaybackIcon] = useState(false);
    const playbackTimeout = useRef<number | null>(null);
    const touchStartY = useRef(0);
    const touchStartX = useRef(0);
    const touchStartTime = useRef(0);

    const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;

    useEffect(() => {
        const fetchTrailer = async () => {
            try {
                const response = await api.get(`/trailer/${contentType}/${movie.id}`);
                setVideoKey(response.data.data.key);
            } catch (error) {
                // Silently handle error
            }
        };

        fetchTrailer();
    }, [movie.id]);

    // Build iframe URL
    // cc_load_policy=3 -> force captions off (overrides viewer's saved preference, unlike 0)
    // iv_load_policy=3 -> don't show video annotations
    const getIframeSrc = () => {
        if (!videoKey) return "";
        return `https://www.youtube.com/embed/${videoKey}?autoplay=1&mute=1&loop=1&controls=0&color=white&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&disablekb=1&cc_load_policy=3&iv_load_policy=3&playlist=${videoKey}&origin=${window.location.origin}&fs=0&showinfo=0&autohide=1&fs=0&modestbranding=1&showsearch=0&showinfo=0&autohide=1&fs=0`;
    };


    // Handle iframe load event
    const handleIframeLoad = () => {
        setIframeReady(true);
        setIsLoading(false);
        setTimeout(() => {
            iframeRef.current?.contentWindow?.postMessage(
                JSON.stringify({
                    event: "listening",
                    id: movie.id,
                    channel: "widget",
                }),
                "*"
            );
        }, 500);
    };

    // Handle iframe errors
    const handleIframeError = () => {
        setLoadError(true);
        setIsLoading(false);

        if (retryCount.current < 3) {
            retryCount.current++;
            setTimeout(() => {
                setLoadError(false);
                setIsLoading(true);
            }, 2000);
        }
    };


    // Send command to YouTube iframe with error handling
    const sendCommand = (command: string, args: any[] = []) => {
        if (iframeRef.current && iframeReady) {
            try {
                iframeRef.current.contentWindow?.postMessage(
                    JSON.stringify({
                        event: 'command',
                        func: command,
                        args
                    }),
                    '*'
                );
            } catch (error) {
                // Silently handle error - YouTube might not respond
            }
        }
    };

    // Force captions off. cc_load_policy=0 in the embed URL isn't
    // enough on its own - if the viewer has captions saved as "on" in
    // their YouTube account/browser, YouTube restores that preference
    // regardless. Explicitly unloading the captions module overrides it.
    // Most gentle approach - just set captions to off
    useEffect(() => {
        if (iframeReady && !loadError) {
            // Initial cleanup
            sendCommand('unloadModule', ['captions']);

            // Poll every 1 second to keep captions suppressed
            const interval = window.setInterval(() => {
                sendCommand('unloadModule', ['captions']);
            }, 1000);

            return () => {
                clearInterval(interval);
            };
        }
    }, [iframeReady, loadError]);


    useEffect(() => {
        if (!iframeReady || !isActive || loadError) return;

        // This creates a message listener for YouTube's state changes
        const handleMessage = (event: MessageEvent) => {
            // Only accept messages from YouTube
            if (event.origin !== 'https://www.youtube.com') return;

            try {
                const data = JSON.parse(event.data);
                if (data.event === "onReady") {
                    sendCommand("playVideo");

                    if (isMuted) {
                        sendCommand("mute");
                    } else {
                        sendCommand("unMute");
                    }

                    setTimeout(() => {
                        sendCommand("playVideo");
                    }, 100);

                    setTimeout(() => {
                        sendCommand("playVideo");
                    }, 500);

                    setTimeout(() => {
                        sendCommand("playVideo");
                    }, 1000);
                }

                // YouTube sends info about video state changes
                // Keep React state in sync with YouTube player
                if (data.event === "onStateChange") {
                    switch (data.info) {
                        case 1: // Playing
                            setIsPaused(false);
                            setVideoPlaying(true);
                            break;

                        case 2: // Paused
                            setIsPaused(true);
                            break;

                        case 0: // Ended
                            setIsPaused(false);

                            sendCommand("seekTo", [0]);
                            sendCommand("playVideo");

                            setTimeout(() => {
                                sendCommand("seekTo", [0]);
                                sendCommand("playVideo");
                            }, 100);

                            break;
                    }
                }

                if (data.event === "onError") {
                    console.log("YouTube Error:", data.info);
                    console.log("YT ERROR", movie.id);
                }
            } catch (e) {
                // Not a JSON message or not relevant
            }
        };

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [iframeReady, isActive, loadError, sendCommand]);


    useEffect(() => {
        if (!iframeReady || loadError) return;

        if (isActive) {
            sendCommand("playVideo");

            if (isMuted) {
                sendCommand("mute");
            } else {
                sendCommand("unMute");
            }
        } else {
            sendCommand("mute");
            sendCommand("pauseVideo");
        }
    }, [isActive, iframeReady, isMuted, loadError]);

    // Hide controls after 3 seconds of inactivity
    useEffect(() => {
        if (isActive) {
            setShowControls(true);

            if (controlsTimeout.current !== null) {
                clearTimeout(controlsTimeout.current);
                controlsTimeout.current = null;
            }

            controlsTimeout.current = window.setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }

        return () => {
            if (controlsTimeout.current !== null) {
                clearTimeout(controlsTimeout.current);
                controlsTimeout.current = null;
            }
        };
    }, [isActive]);

    // Keyboard controls
    useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                e.preventDefault();
                onNext?.();
            } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                e.preventDefault();
                onPrevious?.();
            } else if (e.key === " " || e.key === "Space") {
                e.preventDefault();
                if (onToggleSound) {
                    onToggleSound();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isActive, onNext, onPrevious, onToggleSound]);

    // Reveal the controls (buttons, captions) and reset the
    // auto-hide timer. Desktop triggers this on mouse move,
    // mobile triggers it on touch, since touch devices don't
    // fire mousemove reliably.
    const handleShowControls = () => {
        if (isActive) {
            setShowControls(true);

            if (controlsTimeout.current !== null) {
                clearTimeout(controlsTimeout.current);
                controlsTimeout.current = null;
            }

            controlsTimeout.current = window.setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    };

    // Cross-browser fullscreen helpers
    const requestFullscreenOn = (el: HTMLElement) => {
        const anyEl = el as any;
        if (anyEl.requestFullscreen) return anyEl.requestFullscreen();
        if (anyEl.webkitRequestFullscreen) return anyEl.webkitRequestFullscreen();
        if (anyEl.webkitEnterFullscreen) return anyEl.webkitEnterFullscreen(); // iOS Safari video fallback
        if (anyEl.msRequestFullscreen) return anyEl.msRequestFullscreen();
        return Promise.reject(new Error("Fullscreen API not supported"));
    };

    const exitFullscreenNow = () => {
        const anyDoc = document as any;
        if (anyDoc.exitFullscreen) return anyDoc.exitFullscreen();
        if (anyDoc.webkitExitFullscreen) return anyDoc.webkitExitFullscreen();
        if (anyDoc.msExitFullscreen) return anyDoc.msExitFullscreen();
        return Promise.resolve();
    };

    const isCurrentlyFullscreen = () => {
        const anyDoc = document as any;
        return !!(
            document.fullscreenElement ||
            anyDoc.webkitFullscreenElement ||
            anyDoc.msFullscreenElement
        );
    };

    // Toggle fullscreen + rotate to landscape
    const handleToggleFullscreen = async (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        try {
            if (!isCurrentlyFullscreen()) {
                // Fullscreen the whole document
                await requestFullscreenOn(document.documentElement);
                // Rotate the screen to landscape
                const orientation: any = (screen as any).orientation;
                if (orientation?.lock) {
                    try {
                        await orientation.lock("landscape");
                    } catch (err) {
                        // Orientation lock not supported/allowed - ignore
                    }
                }
            } else {
                const orientation: any = (screen as any).orientation;
                if (orientation?.unlock) {
                    try {
                        orientation.unlock();
                    } catch (err) {
                        // ignore
                    }
                }
                await exitFullscreenNow();
            }
        } catch (err) {
            // Fullscreen request rejected (e.g. no user gesture) - ignore
        }
    };

    // Keep isFullscreen state in sync with the actual browser state,
    // and release the orientation lock if the user exits fullscreen
    // via Esc / back gesture rather than our button.
    useEffect(() => {
        const handleFullscreenChange = () => {
            const active = isCurrentlyFullscreen();
            setIsFullscreen(active);
            if (!active) {
                const orientation: any = (screen as any).orientation;
                if (orientation?.unlock) {
                    try {
                        orientation.unlock();
                    } catch (err) {
                        // ignore
                    }
                }
            }
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
        document.addEventListener("MSFullscreenChange", handleFullscreenChange);

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
            document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
        };
    }, []);

    // Handle sound toggle
    const handleToggleSound = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        e?.preventDefault();

        if (isMuted) {
            sendCommand("unMute");
        } else {
            sendCommand("mute");
        }

        onToggleSound?.();
    };

    // Error fallback component
    const ErrorFallback = () => (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#0a0a0a",
                padding: "20px",
                zIndex: 5,
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
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                }}
            >
                <div style={{ fontSize: "48px" }}>🎬</div>
                <h2 style={{ color: "white", fontSize: "20px", textAlign: "center" }}>
                    {movie.title}
                </h2>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", textAlign: "center" }}>
                    Video unavailable
                </p>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setLoadError(false);
                        setIsLoading(true);
                    }}
                    style={{
                        padding: "8px 24px",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "20px",
                        color: "white",
                        cursor: "pointer",
                        fontSize: "14px",
                        marginTop: "8px",
                    }}
                >
                    Retry
                </button>
            </div>
        </div>
    );

    const togglePlayback = () => {
        if (!iframeReady || isLoading || loadError) return;

        if (isPaused) {
            sendCommand("playVideo");
        } else {
            sendCommand("pauseVideo");
        }

        setIsPaused(prev => !prev);

        setShowPlaybackIcon(true);

        if (playbackTimeout.current) {
            clearTimeout(playbackTimeout.current);
        }

        playbackTimeout.current = window.setTimeout(() => {
            setShowPlaybackIcon(false);
        }, 500);
    };

    const handleTouchStartPlayback = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
        touchStartX.current = e.touches[0].clientX;
        touchStartTime.current = Date.now();

        handleShowControls();
    };

    const handleTouchEndPlayback = (e: React.TouchEvent) => {
        const endY = e.changedTouches[0].clientY;
        const endX = e.changedTouches[0].clientX;

        const dy = Math.abs(endY - touchStartY.current);
        const dx = Math.abs(endX - touchStartX.current);

        const duration = Date.now() - touchStartTime.current;

        const TAP_DISTANCE = 10;
        const TAP_TIME = 250;

        const isTap =
            dx < TAP_DISTANCE &&
            dy < TAP_DISTANCE &&
            duration < TAP_TIME;

        if (isTap) {
            togglePlayback();
        }
    };

    return (
        <div
            className="trailer-root"
            onClick={!isTouchDevice ? togglePlayback : undefined}
            onTouchStart={handleTouchStartPlayback}
            onTouchEnd={handleTouchEndPlayback}
            style={{
                width: "100%",
                position: "relative",
                backgroundColor: "#000",
                overflow: "hidden",
            }}
            onMouseMove={handleShowControls}
        >
            {/* Scoped responsive styles for the YouTube iframe crop */}
            <style>
                {`
                    /* 100vh on mobile includes space the browser's
                       address bar / bottom toolbar is covering, so
                       bottom-anchored content (the caption) can end up
                       rendered under that chrome. 100dvh tracks the
                       actual visible viewport instead. The vh line stays
                       first as a fallback for browsers without dvh
                       support - it's simply overridden where dvh works. */
                    .trailer-root {
                        height: 100vh;
                        height: 100dvh;
                    }

                    .trailer-yt-iframe {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 300%;
                        height: 100%;
                        margin-left: -100%;
                        pointer-events: none;
                        border: 0;
                    }

                    /* Below 582px: stop cropping the sides (so the player is
                       true full-width) and instead crop top/bottom to hide
                       YouTube's title bar + bottom control bar overlay.
                       top: 50% + translateY(-50%) centers the enlarged
                       iframe vertically no matter the container's actual
                       height, instead of a fixed-pixel margin that only
                       lined up on some screens. */
                    @media (max-width: 582px) {
                        .trailer-yt-iframe {
                            top: 50%;
                            left: 0;
                            width: 100%;
                            height: 135%;
                            margin-left: 0;
                            transform: translateY(-50%);
                        }

                        /* Up/down arrow buttons are redundant on touch
                           screens (swipe already navigates) and were
                           cluttering small screens - hide them. */
                        .trailer-nav-arrows {
                            display: none !important;
                        }

                        /* The keyboard hint only applies to desktop
                           keyboard users - hide on small/touch screens. */
                        .trailer-keyboard-hint {
                            display: none !important;
                        }

                        /* Pull the title/rating caption up and add a
                           safe-area buffer so it isn't pushed low enough
                           to be cropped by the browser's bottom UI
                           (address bar / home-indicator) in portrait. */
                        .trailer-caption {
                            bottom: calc(56px + env(safe-area-inset-bottom, 0px)) !important;
                            right: 44px !important;
                        }
                    }

                    @keyframes playFade {
    0% {
        opacity: 0;
        transform: scale(.7);
    }

    20% {
        opacity: 1;
        transform: scale(1);
    }

    100% {
        opacity: 0;
        transform: scale(1.15);
    }
}
                `}
            </style>

            {/* Loading Spinner */}
            {isLoading && isActive && <Loader />}

            {/* Error Fallback */}
            {loadError && isActive && <ErrorFallback />}

            {/* YouTube Video with hidden interface */}
            {videoKey && !loadError && (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        overflow: "hidden",
                        pointerEvents: "none",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        opacity: isActive ? (isLoading ? 0 : 1) : 0,
                        transition: "opacity 0.5s ease",
                    }}
                >
                    <iframe
                        ref={iframeRef}
                        className="trailer-yt-iframe"
                        width="100%"
                        height="100%"
                        src={getIframeSrc()}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="autoplay; fullscreen"
                        allowFullScreen
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                    />
                </div>
            )}

            {/* Sound Indicator */}
            {isActive && !isLoading && !loadError && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 64,
                        right: 14,
                        zIndex: 20,
                        cursor: "pointer",
                        width: "34px",
                        height: "34px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(0,0,0,0.5)",
                        borderRadius: "50%",
                        backdropFilter: "blur(10px)",
                        border: "1.5px solid rgba(255,255,255,0.2)",
                        transition: "opacity 0.3s ease, background-color 0.3s ease, transform 0.3s ease",
                        opacity: showControls ? 1 : 0,
                        pointerEvents: showControls ? "auto" : "none",
                        userSelect: "none",
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSound();
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.3)";
                        e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.5)";
                        e.currentTarget.style.transform = "scale(1)";
                    }}
                >
                    {isMuted ? (
                        <span style={{ fontSize: "15px" }}>🔇</span>
                    ) : (
                        <span style={{ fontSize: "15px" }}>🔊</span>
                    )}
                </div>
            )}

            {/* Fullscreen Toggle */}
            {isActive && !isLoading && !loadError && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 108,
                        right: 14,
                        zIndex: 20,
                        cursor: "pointer",
                        width: "34px",
                        height: "34px",
                        backgroundColor: "rgba(0,0,0,0.5)",
                        borderRadius: "50%",
                        backdropFilter: "blur(10px)",
                        border: "1.5px solid rgba(255,255,255,0.2)",
                        transition: "opacity 0.3s ease, background-color 0.3s ease, transform 0.3s ease",
                        opacity: showControls ? 1 : 0,
                        pointerEvents: showControls ? "auto" : "none",
                        userSelect: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFullscreen();
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.3)";
                        e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.5)";
                        e.currentTarget.style.transform = "scale(1)";
                    }}
                    title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                    {isFullscreen ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                            <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                            <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                            <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                        </svg>
                    ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                        </svg>
                    )}
                </div>
            )}

            {/* Movie Info - small, caption-style */}
            {!isLoading && !loadError && (
                <div
                    className="trailer-caption"
                    style={{
                        position: "absolute",
                        bottom: 40,
                        left: 14,
                        right: 60,
                        color: "white",
                        zIndex: 10,
                        textShadow: "1px 1px 3px rgba(0,0,0,0.9)",
                        opacity: isActive ? 1 : 0,
                        transition: "opacity 0.3s ease",
                        pointerEvents: "none",
                    }}
                >
                    <h2 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "2px", lineHeight: 1.3 }}>
                        {movie.title || movie.name}
                    </h2>
                    <p style={{ fontSize: "11px", opacity: 0.85 }}>
                        ⭐ {movie.vote_average !== "0" ? movie.vote_average.toFixed(1) : "N/A"} | {movie.release_date || movie.first_air_date}
                    </p>
                </div>
            )}

            {/* Navigation Arrows - Desktop */}
            {isActive && showControls && !isLoading && !loadError && (
                <div
                    className="trailer-nav-arrows"
                    style={{
                        position: "absolute",
                        right: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        zIndex: 20,
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        pointerEvents: "none",
                    }}
                >
                    {currentIndex > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onPrevious?.();
                            }}
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
                                pointerEvents: "auto",
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

                    {currentIndex < totalMovies - 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onNext?.();
                            }}
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
                                pointerEvents: "auto",
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

            {showPlaybackIcon && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        pointerEvents: "none",
                        zIndex: 100,
                    }}
                >
                    <div
                        style={{
                            width: 90,
                            height: 90,
                            borderRadius: "50%",
                            background: "rgba(0,0,0,0.55)",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            fontSize: 40,
                            color: "#fff",
                            animation: "playFade .5s ease",
                        }}
                    >
                        {isPaused ? "▶" : "❚❚"}
                    </div>
                </div>
            )}

            {/* Keyboard hint */}
            {isActive && showControls && !isLoading && !loadError && (
                <div
                    className="trailer-keyboard-hint"
                    style={{
                        position: "absolute",
                        bottom: 10,
                        left: "50%",
                        transform: "translateX(-50%)",
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "10px",
                        zIndex: 10,
                        textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                        textAlign: "center",
                        pointerEvents: "none",
                    }}
                >
                    ↑ ↓ to navigate
                </div>
            )}
        </div>


    );
}