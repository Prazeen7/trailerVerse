import { useRef } from "react";

interface HorizontalFilterRowProps {
    children: React.ReactNode;
}

export default function HorizontalFilterRow({
    children,
}: HorizontalFilterRowProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        scrollRef.current?.scrollBy({
            left: direction === "left" ? -250 : 250,
            behavior: "smooth",
        });
    };

    return (
        <div style={filterRowWrapperStyle}>
            <button
                onClick={() => scroll("left")}
                style={arrowButtonStyle}
                aria-label="Scroll filters left"
            >
                ‹
            </button>

            <div
                ref={scrollRef}
                style={filterRowStyle}
            >
                {children}
            </div>

            <button
                onClick={() => scroll("right")}
                style={arrowButtonStyle}
                aria-label="Scroll filters right"
            >
                ›
            </button>
        </div>
    );
}

const filterRowWrapperStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
};

const filterRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    overflowX: "auto",
    overflowY: "hidden",
    flex: 1,
    scrollbarWidth: "none",
};

const arrowButtonStyle: React.CSSProperties = {
    flexShrink: 0,
    width: 24,
    height: 24,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,.15)",
    background: "rgba(255,255,255,.08)",
    color: "white",
    fontSize: 18,
    lineHeight: 1,
    cursor: "pointer",
    padding: 0,
};