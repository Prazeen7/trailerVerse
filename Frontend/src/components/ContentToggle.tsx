interface ContentToggleProps {
    contentType: "movie" | "tv";
    onChange: (type: "movie" | "tv") => void;
}

export default function ContentToggle({
    contentType,
    onChange,
}: ContentToggleProps) {
    return (
        <div
            style={{
                position: "fixed",
                top: 20,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 100,
            }}
        >
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    width: 220,
                    padding: 4,
                    borderRadius: 999,
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(15px)",
                }}
            >
                {/* Sliding background */}
                <div
                    style={{
                        position: "absolute",
                        top: 4,
                        left: contentType === "movie" ? 4 : "50%",
                        width: "calc(50% - 4px)",
                        height: "calc(100% - 8px)",
                        borderRadius: 999,
                        background: "#fff",
                        transition:
                            "left 0.3s cubic-bezier(0.22,1,0.36,1)",
                    }}
                />

                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onChange("movie");
                    }}

                    style={{
                        flex: 1,
                        zIndex: 1,
                        border: "none",
                        background: "transparent",
                        padding: "10px 0",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 15,
                        color:
                            contentType === "movie"
                                ? "#000"
                                : "#fff",
                        transition: "color .3s",
                        outline: "none",
                    }}
                >
                    Movies
                </button>

                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onChange("tv");
                    }}
                    style={{
                        flex: 1,
                        zIndex: 1,
                        border: "none",
                        background: "transparent",
                        padding: "10px 0",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 15,
                        color:
                            contentType === "tv"
                                ? "#000"
                                : "#fff",
                        transition: "color .3s",
                        outline: "none",
                    }}
                >
                    TV Shows
                </button>
            </div>
        </div >
    );
}