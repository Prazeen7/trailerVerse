import React, { useState, useEffect, useRef } from "react";

interface ContentToggleProps {
    contentType: "movie" | "tv";
    onChange: (type: "movie" | "tv") => void;
    filterType: "now_playing" | "popular" | "top_rated" | "upcoming";
    onFilterChange: (filter: "now_playing" | "popular" | "top_rated" | "upcoming") => void;
}

export default function ContentToggle({
    contentType,
    onChange,
    filterType,
    onFilterChange,
}: ContentToggleProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const inactivityTimeoutRef = useRef<number | null>(null);
    const filterContainerRef = useRef<HTMLDivElement>(null);
    const [buttonWidths, setButtonWidths] = useState<number[]>([]);
    const resizeTimeoutRef = useRef<number | null>(null);

    // Define filters based on content type
    const getFilters = () => {
        if (contentType === "movie") {
            return [
                { id: "now_playing" as const, label: "Now Playing" },
                { id: "popular" as const, label: "Popular" },
                { id: "top_rated" as const, label: "Top Rated" },
                { id: "upcoming" as const, label: "Upcoming" },
            ];
        } else {
            return [
                { id: "now_playing" as const, label: "Airing Today" },
                { id: "popular" as const, label: "On The Air" },
                { id: "top_rated" as const, label: "Popular" },
                { id: "upcoming" as const, label: "Top Rated" },
            ];
        }
    };

    const filters = getFilters();

    // Map filter to position (desktop) - adjusted for 46px height buttons with 3px gap
    const getFilterPosition = (filter: string) => {
        switch (filter) {
            case "now_playing": return 4;
            case "popular": return 53; // 4 + 46 + 3
            case "top_rated": return 102; // 53 + 46 + 3
            case "upcoming": return 151; // 102 + 46 + 3
            default: return 4;
        }
    };

    // Get filter width for mobile sliding
    const getFilterWidth = (index: number) => {
        if (buttonWidths.length > 0 && index < buttonWidths.length) {
            return buttonWidths[index];
        }
        return 60; // fallback
    };

    // Calculate button widths - extracted to a separate function
    const calculateButtonWidths = () => {
        if (!isMobile || !filterContainerRef.current) {
            return;
        }

        const buttons = filterContainerRef.current.querySelectorAll('.filter-button');
        const widths: number[] = [];
        buttons.forEach((button) => {
            widths.push((button as HTMLElement).offsetWidth || 60);
        });
        
        // Only update if widths have changed
        const widthsChanged = widths.length !== buttonWidths.length || 
            widths.some((w, i) => w !== buttonWidths[i]);
        
        if (widthsChanged && widths.length > 0) {
            setButtonWidths(widths);
        }
    };

    // Calculate button widths after render - FIXED: Only run on mount and when filterType changes
    useEffect(() => {
        // Use requestAnimationFrame to ensure DOM is fully rendered
        const timeoutId = setTimeout(() => {
            requestAnimationFrame(calculateButtonWidths);
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [isMobile, filterType]); // Remove buttonWidths from dependencies

    // Handle window resize - FIXED: Use ref to avoid dependency issues
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            
            // Recalculate widths after resize
            if (mobile) {
                if (resizeTimeoutRef.current) {
                    clearTimeout(resizeTimeoutRef.current);
                }
                resizeTimeoutRef.current = setTimeout(() => {
                    requestAnimationFrame(calculateButtonWidths);
                }, 200);
            } else {
                setButtonWidths([]);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
        };
    }, []); // Empty dependency array - only run on mount

    // Show controls on user interaction
    const showControls = () => {
        setIsVisible(true);

        if (inactivityTimeoutRef.current) {
            clearTimeout(inactivityTimeoutRef.current);
        }

        inactivityTimeoutRef.current = setTimeout(() => {
            setIsVisible(false);
        }, 3000);
    };

    // Set up event listeners for user activity
    useEffect(() => {
        const events = ['mousemove', 'mousedown', 'click', 'scroll', 'keydown', 'touchstart'];

        const handleActivity = () => {
            showControls();
        };

        events.forEach(event => {
            document.addEventListener(event, handleActivity);
        });

        inactivityTimeoutRef.current = setTimeout(() => {
            setIsVisible(false);
        }, 3000);

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
            if (inactivityTimeoutRef.current) {
                clearTimeout(inactivityTimeoutRef.current);
            }
        };
    }, []);

    // Get left position for mobile sliding background
    const getMobileSlidePosition = () => {
        const activeIndex = filters.findIndex(f => f.id === filterType);
        let position = 4; // Initial padding
        for (let i = 0; i < activeIndex; i++) {
            position += getFilterWidth(i) + 3; // width + gap
        }
        return position;
    };

    return (
        <>
            <style>
                {`
                    button, button:focus, button:active, button:focus-visible {
                        outline: none !important;
                        outline-color: transparent !important;
                        outline-style: none !important;
                        box-shadow: none !important;
                        -webkit-tap-highlight-color: transparent !important;
                        -webkit-focus-ring-color: transparent !important;
                    }
                    *:focus {
                        outline: none !important;
                        outline-color: transparent !important;
                    }
                    button::-moz-focus-inner {
                        border: 0 !important;
                    }
                `}
            </style>

            {/* Content Type Toggle - Centered at top with glass style */}
            <div
                style={{
                    position: "fixed",
                    top: isMobile ? 10 : 20,
                    left: "50%",
                    transform: `translateX(-50%) ${!isVisible ? 'translateY(-120%)' : 'translateY(0)'}`,
                    zIndex: 100,
                    transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)",
                    opacity: isVisible ? 1 : 0,
                    pointerEvents: isVisible ? "auto" : "none",
                }}
                onMouseEnter={() => {
                    if (inactivityTimeoutRef.current) {
                        clearTimeout(inactivityTimeoutRef.current);
                    }
                }}
                onMouseLeave={() => {
                    inactivityTimeoutRef.current = setTimeout(() => {
                        setIsVisible(false);
                    }, 3000);
                }}
            >
                <div
                    style={{
                        position: "relative",
                        display: "flex",
                        width: isMobile ? 160 : 220,
                        padding: isMobile ? 3 : 4,
                        borderRadius: 999,
                        background: "rgba(255, 255, 255, 0.15)",
                        backdropFilter: "blur(20px) saturate(180%)",
                        WebkitBackdropFilter: "blur(20px) saturate(180%)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: isMobile ? 3 : 4,
                            left: contentType === "movie" ? (isMobile ? 3 : 4) : "50%",
                            width: "calc(50% - 6px)",
                            height: `calc(100% - ${isMobile ? 6 : 8}px)`,
                            borderRadius: 999,
                            background: "rgba(255, 255, 255, 0.9)",
                            backdropFilter: "blur(10px)",
                            transition: "left 0.3s cubic-bezier(0.22,1,0.36,1)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        }}
                    />

                    <button
                        onClick={() => onChange("movie")}
                        style={{
                            flex: 1,
                            zIndex: 1,
                            border: "none",
                            background: "transparent",
                            padding: isMobile ? "8px 0" : "10px 0",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: isMobile ? 12 : 15,
                            color: contentType === "movie" ? "#000" : "rgba(255,255,255,0.8)",
                            transition: "color .3s",
                            outline: "none",
                            WebkitTapHighlightColor: "transparent",
                        }}
                    >
                        Movies
                    </button>

                    <button
                        onClick={() => onChange("tv")}
                        style={{
                            flex: 1,
                            zIndex: 1,
                            border: "none",
                            background: "transparent",
                            padding: isMobile ? "8px 0" : "10px 0",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: isMobile ? 12 : 15,
                            color: contentType === "tv" ? "#000" : "rgba(255,255,255,0.8)",
                            transition: "color .3s",
                            outline: "none",
                            WebkitTapHighlightColor: "transparent",
                        }}
                    >
                        TV Shows
                    </button>
                </div>
            </div>

            {/* Filter Tabs with Glass Style and Mobile Sliding */}
            <div
                style={{
                    position: "fixed",
                    top: isMobile ? "auto" : "50%",
                    bottom: isMobile ? 20 : "auto",
                    left: isMobile ? "50%" : 20,
                    transform: isMobile
                        ? `translateX(-50%) ${!isVisible ? 'translateY(100%)' : 'translateY(0)'}`
                        : `translateY(-50%) ${!isVisible ? 'translateX(-120%)' : 'translateX(0)'}`,
                    zIndex: 1000,
                    transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease",
                    opacity: isVisible ? 1 : 0,
                    pointerEvents: isVisible ? "auto" : "none",
                    display: "flex",
                    justifyContent: isMobile ? "center" : "flex-start",
                    width: isMobile ? "100%" : "auto",
                    padding: isMobile ? "0 10px" : 0,
                }}
            >
                <div
                    ref={filterContainerRef}
                    style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: isMobile ? "row" : "column",
                        flexWrap: "nowrap",
                        padding: isMobile ? 4 : 6,
                        borderRadius: isMobile ? 12 : 14,
                        background: "rgba(255, 255, 255, 0.12)",
                        backdropFilter: "blur(20px) saturate(180%)",
                        WebkitBackdropFilter: "blur(20px) saturate(180%)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        gap: isMobile ? 3 : 3,
                        width: isMobile ? "100%" : 140,
                        maxWidth: isMobile ? "100%" : 140,
                        justifyContent: isMobile ? "stretch" : "flex-start",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                        overflow: "hidden",
                    }}
                >
                    {/* Sliding background for desktop - now with proper rounded rectangle */}
                    {!isMobile && (
                        <div
                            style={{
                                position: "absolute",
                                top: getFilterPosition(filterType),
                                left: 4,
                                width: "calc(100% - 8px)",
                                height: 46,
                                borderRadius: 10,
                                background: "rgba(255, 255, 255, 0.9)",
                                backdropFilter: "blur(10px)",
                                transition: "top 0.3s cubic-bezier(0.22,1,0.36,1)",
                                boxShadow: "0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.5)",
                            }}
                        />
                    )}

                    {/* Sliding background for mobile */}
                    {isMobile && buttonWidths.length > 0 && (
                        <div
                            style={{
                                position: "absolute",
                                top: 4,
                                left: getMobileSlidePosition(),
                                width: getFilterWidth(filters.findIndex(f => f.id === filterType)),
                                height: "calc(100% - 8px)",
                                borderRadius: 10,
                                background: "rgba(255, 255, 255, 0.9)",
                                backdropFilter: "blur(10px)",
                                transition: "left 0.3s cubic-bezier(0.22,1,0.36,1), width 0.3s cubic-bezier(0.22,1,0.36,1)",
                                boxShadow: "0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.5)",
                            }}
                        />
                    )}

                    {filters.map((filter, index) => {
                        const isActive = filterType === filter.id;

                        return (
                            <button
                                key={filter.id}
                                className="filter-button"
                                onClick={() => onFilterChange(filter.id)}
                                style={{
                                    zIndex: 1,
                                    padding: isMobile ? "6px 8px" : "10px 16px",
                                    borderRadius: isMobile ? 10 : 10,
                                    border: "none",
                                    background: "transparent",
                                    color: isActive 
                                        ? "#000" 
                                        : "rgba(255, 255, 255, 0.75)",
                                    fontWeight: isActive ? 600 : 500,
                                    fontSize: isMobile ? 10 : 14,
                                    cursor: "pointer",
                                    transition: "color 0.3s ease",
                                    whiteSpace: "nowrap",
                                    outline: "none",
                                    height: isMobile ? "auto" : 46,
                                    textAlign: isMobile ? "center" : "left",
                                    WebkitTapHighlightColor: "transparent",
                                    flex: isMobile ? "1 1 0" : "none",
                                    width: isMobile ? "0" : "100%",
                                    minWidth: isMobile ? "0" : "auto",
                                }}
                            >
                                {filter.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );
}