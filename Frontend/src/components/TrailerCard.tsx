import { useEffect, useState, useRef, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import api from "../api/api";
import TrailerLoader from "./TrailerLoader";

interface Props {
    movie: any;
    isActive?: boolean;
    isMuted?: boolean;
    contentType?: "movie" | "tv";
    isPaused?: boolean;
    isFullscreen?: boolean;
    onFullscreenChange?: (isFullscreen: boolean) => void;
    onTogglePlayPause?: () => void;
    onReady?: () => void;

}

export default function TrailerCard({
    movie,
    isActive = true,
    isMuted = false,
    contentType = "movie",
    isPaused = false,
    isFullscreen = false,
    onFullscreenChange,
    onTogglePlayPause,
    onReady,

}: Props) {
    const [videoKey, setVideoKey] = useState("");
    const [iframeReady, setIframeReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const retryCount = useRef(0);
    const touchStartY = useRef(0);
    const touchStartX = useRef(0);
    const touchStartTime = useRef(0);
    const prevIsPausedRef = useRef(isPaused);
    const prevFullscreenRef = useRef(isFullscreen);

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
    }, [movie.id, contentType]);

    useEffect(() => {
        setIsLoading(true);
        setIframeReady(false);
        setLoadError(false);
    }, [movie.id]);

    const getIframeSrc = () => {
        if (!videoKey) return "";
        return `https://www.youtube.com/embed/${videoKey}?autoplay=1&mute=1&loop=1&controls=0&color=white&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&disablekb=1&cc_load_policy=3&iv_load_policy=3&playlist=${videoKey}&origin=${window.location.origin}&fs=0&showinfo=0&autohide=1&showsearch=0`;
    };

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

    const sendCommand = useCallback((command: string, args: any[] = []) => {
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
    }, [iframeReady]);

    useEffect(() => {
        if (iframeReady && !loadError) {
            sendCommand('unloadModule', ['captions']);
            const interval = window.setInterval(() => {
                sendCommand('unloadModule', ['captions']);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [iframeReady, loadError, sendCommand]);

    useEffect(() => {
        if (!iframeReady || !isActive || loadError) return;

        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== 'https://www.youtube.com') return;

            try {
                const data = JSON.parse(event.data);
                if (data.event === "onReady") {
                    sendCommand("playVideo");
                    setTimeout(() => sendCommand("playVideo"), 100);
                    setTimeout(() => sendCommand("playVideo"), 500);
                    setTimeout(() => sendCommand("playVideo"), 1000);
                    onReady?.()
                }

                if (data.event === "onStateChange") {
                    switch (data.info) {
                        case 1: // Playing
                            break;
                        case 2: // Paused
                            break;
                        case 0: // Ended
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
        return () => window.removeEventListener('message', handleMessage);
    }, [iframeReady, isActive, loadError, sendCommand, movie.id]);

    useEffect(() => {
        if (!iframeReady || loadError) return;

        if (isActive) {
            if (isPaused) {
                sendCommand("pauseVideo");
            } else {
                sendCommand("playVideo");
            }
            if (isMuted) {
                sendCommand("mute");
            } else {
                sendCommand("unMute");
            }
        } else {
            sendCommand("pauseVideo");
            sendCommand("mute");
        }
    }, [isActive, iframeReady, isMuted, loadError, isPaused, sendCommand]);

    useEffect(() => {
        if (!isActive || !iframeReady || loadError) return;

        const prev = prevFullscreenRef.current;
        const curr = isFullscreen;

        if (prev !== curr) {
            if (curr) {
                if (Capacitor.isNativePlatform()) {
                    ScreenOrientation.lock({ orientation: "landscape" });
                } else {
                    // Request fullscreen, then lock orientation once fullscreen is active
                    requestFullscreenOn(document.documentElement)
                        .then(() => {
                            lockOrientationLandscape();
                        })
                        .catch(() => {
                            // Fullscreen denied or not supported — try orientation anyway
                            lockOrientationLandscape();
                        });
                }
            } else {
                exitFullscreenNow();
                unlockOrientation();
            }
        }

        prevFullscreenRef.current = curr;
    }, [isFullscreen, isActive, iframeReady, loadError]);

    // Track isPaused changes (no showControls side-effect needed anymore)
    useEffect(() => {
        prevIsPausedRef.current = isPaused;
    }, [isPaused]);

    /** Lock to landscape using the Web Screen Orientation API (web mobile). */
    const lockOrientationLandscape = () => {
        try {
            const orientation = (screen as any).orientation;
            if (orientation?.lock) {
                orientation.lock("landscape").catch(() => {
                    // Some browsers (Safari) don't support orientation lock — silently ignore
                });
            }
        } catch {
            // Silently ignore
        }
    };

    /** Unlock orientation when exiting fullscreen on web. */
    const unlockOrientation = () => {
        try {
            const orientation = (screen as any).orientation;
            if (orientation?.unlock) {
                orientation.unlock();
            }
        } catch {
            // Silently ignore
        }
    };

    const requestFullscreenOn = (el: HTMLElement): Promise<void> => {
        const anyEl = el as any;
        if (anyEl.requestFullscreen) return anyEl.requestFullscreen();
        if (anyEl.webkitRequestFullscreen) return anyEl.webkitRequestFullscreen();
        if (anyEl.webkitEnterFullscreen) return anyEl.webkitEnterFullscreen();
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

    useEffect(() => {
        const handleFullscreenChange = () => {
            const active = isCurrentlyFullscreen();
            onFullscreenChange?.(active);
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
    }, [onFullscreenChange]);

    // Tap-to-pause (touch devices) — belongs to the player
    const handleTouchStartPlayback = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
        touchStartX.current = e.touches[0].clientX;
        touchStartTime.current = Date.now();
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

        if (isTap && onTogglePlayPause) {
            onTogglePlayPause();
        }
    };

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

    return (
        <div
            className="trailer-root"
            onClick={() => {
                if (!isTouchDevice && isActive && onTogglePlayPause) {
                    onTogglePlayPause();
                }
            }}
            onTouchStart={handleTouchStartPlayback}
            onTouchEnd={handleTouchEndPlayback}
            style={{
                width: "100%",
                position: "relative",
                backgroundColor: "#000",
                overflow: "hidden",
            }}
        >
            <style>
                {`
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

                    @media (max-width: 582px) {
                        .trailer-yt-iframe {
                            top: 50%;
                            left: 0;
                            width: 100%;
                            height: 135%;
                            margin-left: 0;
                            transform: translateY(-50%);
                        }

                        .trailer-caption {
                            bottom: calc(56px + env(safe-area-inset-bottom, 0px)) !important;
                            right: 44px !important;
                        }
                    }

                    @keyframes playFade {
                        0% { opacity: 0; transform: scale(.7); }
                        20% { opacity: 1; transform: scale(1); }
                        100% { opacity: 0; transform: scale(1.15); }
                    }
                `}
            </style>

            {loadError && isActive && <ErrorFallback />}

            {isLoading && !loadError && isActive && <TrailerLoader />}

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
                    <h2 style={{
                        color: "#ffffff",
                        WebkitTextFillColor: "#ffffff", fontSize: "14px", fontWeight: 600, marginBottom: "2px", lineHeight: 1.3
                    }}>
                        {movie.title || movie.name}
                    </h2>
                    <p style={{ fontSize: "11px", opacity: 0.85 }}>
                        ⭐ {movie.vote_count >= 20
                            ? movie.vote_average.toFixed(1)
                            : "N/A"}{" "}
                        | {movie.release_date || movie.first_air_date}
                    </p>
                </div>
            )}
        </div>
    );
}