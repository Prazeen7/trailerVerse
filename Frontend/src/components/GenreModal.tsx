interface GenreModalProps {
    open: boolean;
    onClose: () => void;
    selectedGenre?: number;
    onSelect: (genre?: number) => void;
    contentType: "movie" | "tv";
}

const MOVIE_GENRES = [
    { id: 28, name: "Action" },
    { id: 12, name: "Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 14, name: "Fantasy" },
    { id: 36, name: "History" },
    { id: 27, name: "Horror" },
    { id: 10402, name: "Music" },
    { id: 9648, name: "Mystery" },
    { id: 10749, name: "Romance" },
    { id: 878, name: "Science Fiction" },
    { id: 10770, name: "TV Movie" },
    { id: 53, name: "Thriller" },
    { id: 10752, name: "War" },
    { id: 37, name: "Western" },
];

const TV_GENRES = [
    { id: 10759, name: "Action & Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 10762, name: "Kids" },
    { id: 9648, name: "Mystery" },
    { id: 10763, name: "News" },
    { id: 10764, name: "Reality" },
    { id: 10765, name: "Sci-Fi & Fantasy" },
    { id: 10766, name: "Soap" },
    { id: 10767, name: "Talk" },
    { id: 10768, name: "War & Politics" },
    { id: 37, name: "Western" },
];

export default function GenreModal({
    open,
    onClose,
    selectedGenre,
    onSelect,
    contentType,
}: GenreModalProps) {
    if (!open) return null;

    const genres =
        contentType === "movie"
            ? MOVIE_GENRES
            : TV_GENRES;

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(10px)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: 430,
                    maxWidth: "90vw",
                    maxHeight: "80vh",
                    overflowY: "auto",
                    borderRadius: 20,
                    background: "rgba(30,30,30,.95)",
                    padding: 24,
                    border: "1px solid rgba(255,255,255,.15)",
                    color: "white",
                }}
            >
                <h2
                    style={{
                        marginTop: 0,
                        marginBottom: 20,
                        textAlign: "center",
                    }}
                >
                    Select Genre
                </h2>

                <button
                    onClick={() => {
                        onSelect(undefined);
                        onClose();
                    }}
                    style={buttonStyle(selectedGenre === undefined)}
                >
                    All Genres
                </button>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fill,minmax(150px,1fr))",
                        gap: 10,
                        marginTop: 15,
                    }}
                >
                    {genres.map((genre) => (
                        <button
                            key={genre.id}
                            onClick={() => {
                                onSelect(genre.id);
                                onClose();
                            }}
                            style={buttonStyle(
                                selectedGenre === genre.id
                            )}
                        >
                            {genre.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function buttonStyle(active: boolean): React.CSSProperties {
    return {
        width: "100%",
        padding: "12px 16px",
        borderRadius: 10,
        border: active
            ? "1px solid white"
            : "1px solid rgba(255,255,255,.12)",
        background: active
            ? "rgba(255,255,255,.18)"
            : "rgba(255,255,255,.08)",
        color: "white",
        cursor: "pointer",
        transition: "0.2s",
        fontSize: 14,
    };
}