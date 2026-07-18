import HorizontalFilterRow from "./HorizontalFilterRow";

interface FilterModalProps {
    open: boolean;
    onClose: () => void;

    contentType: "movie" | "tv";

    genre?: number;
    releaseYear?: string;
    originCountry?: string;
    minVoteAverage?: number;

    onGenreChange: (genre?: number) => void;
    onReleaseYearChange: (year?: string) => void;
    onOriginCountryChange: (country?: string) => void;
    onMinVoteAverageChange: (rating?: number) => void;
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

const COUNTRIES = [
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" },
    { code: "IN", name: "India" },
    { code: "JP", name: "Japan" },
    { code: "KR", name: "South Korea" },
    { code: "CN", name: "China" },
    { code: "FR", name: "France" },
    { code: "DE", name: "Germany" },
    { code: "IT", name: "Italy" },
    { code: "ES", name: "Spain" },
    { code: "MX", name: "Mexico" },
    { code: "BR", name: "Brazil" },
    { code: "NP", name: "Nepal" },
];

const RATINGS = [9, 8, 7, 6, 5, 4, 3, 2, 1];

export default function FilterModal({
    open,
    onClose,
    genre,
    releaseYear,
    originCountry,
    minVoteAverage,

    onGenreChange,
    onReleaseYearChange,
    onOriginCountryChange,
    onMinVoteAverageChange,
    contentType,
}: FilterModalProps) {

    const genres =
        contentType === "movie"
            ? MOVIE_GENRES
            : TV_GENRES;

    if (!open) return null;

    const currentYear = new Date().getFullYear();

    const years = Array.from(
        { length: currentYear - 1900 + 1 },
        (_, i) => currentYear - i
    );

    return (

        <>
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
                        position: "relative",
                        width: 430,
                        maxWidth: "90vw",
                        maxHeight: "85vh",
                        overflowY: "auto",
                        borderRadius: 20,
                        background: "rgba(30,30,30,.95)",
                        padding: 10,
                        border: "1px solid rgba(255,255,255,.15)",
                        color: "white",
                    }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close filters"
                        style={closeButtonStyle}
                    >
                        ×
                    </button>
                    <h2
                        style={{
                            marginTop: 0,
                            marginBottom: 20,
                            textAlign: "center",
                        }}
                    >
                        Filters
                    </h2>

                    <section style={filterSectionStyle}>
                        <h3 style={sectionTitleStyle}>Genre</h3>

                        <HorizontalFilterRow>

                            {genres.map((g) => (
                                <button
                                    key={g.id}
                                    onClick={() => onGenreChange(g.id)}
                                    style={buttonStyle(genre === g.id)}
                                >
                                    {g.name}
                                </button>
                            ))}
                        </HorizontalFilterRow>
                    </section>

                    <section style={filterSectionStyle}>
                        <h3 style={sectionTitleStyle}>Year</h3>

                        <HorizontalFilterRow>
                            {years.map((year) => (
                                <label
                                    key={year}
                                    style={radioLabelStyle}
                                >
                                    <input
                                        type="radio"
                                        name="releaseYear"
                                        checked={releaseYear === String(year)}
                                        onChange={() =>
                                            onReleaseYearChange(String(year))
                                        }
                                    />

                                    {year}
                                </label>
                            ))}
                        </HorizontalFilterRow>
                    </section>

                    <section style={filterSectionStyle}>
                        <h3 style={sectionTitleStyle}>Country</h3>

                        <HorizontalFilterRow>
                            <label style={radioLabelStyle}>
                                <input
                                    type="radio"
                                    name="originCountry"
                                    checked={originCountry === undefined}
                                    onChange={() =>
                                        onOriginCountryChange(undefined)
                                    }
                                />

                                All Countries
                            </label>

                            {COUNTRIES.map((country) => (
                                <label
                                    key={country.code}
                                    style={radioLabelStyle}
                                >
                                    <input
                                        type="radio"
                                        name="originCountry"
                                        checked={
                                            originCountry === country.code
                                        }
                                        onChange={() =>
                                            onOriginCountryChange(country.code)
                                        }
                                    />

                                    {country.name}
                                </label>
                            ))}
                        </HorizontalFilterRow>
                    </section>

                    <section style={filterSectionStyle}>
                        <h3 style={sectionTitleStyle}>Rating</h3>

                        <HorizontalFilterRow>
                            {RATINGS.map((rating) => (
                                <label
                                    key={rating}
                                    style={radioLabelStyle}
                                >
                                    <input
                                        type="radio"
                                        name="minVoteAverage"
                                        checked={minVoteAverage === rating}
                                        onChange={() =>
                                            onMinVoteAverageChange(rating)
                                        }
                                    />

                                    {rating}+
                                </label>
                            ))}
                        </HorizontalFilterRow>
                    </section>
                    <div style={actionButtonsStyle}>
                        <button
                            type="button"
                            onClick={() => {
                                onGenreChange(undefined);
                                onReleaseYearChange(undefined);
                                onOriginCountryChange(undefined);
                                onMinVoteAverageChange(undefined);
                            }}
                            style={clearButtonStyle}
                        >
                            Clear Filters
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            style={applyButtonStyle}
                        >
                            Apply Filters
                        </button>
                    </div>
                </div >
            </div >
        </>
    );
}

function buttonStyle(active: boolean): React.CSSProperties {
    return {
        width: "auto",
        flexShrink: 0,
        padding: "7px 12px",
        borderRadius: 999,
        border: active
            ? "1px solid white"
            : "1px solid rgba(255,255,255,.12)",
        background: active
            ? "rgba(255,255,255,.18)"
            : "rgba(255,255,255,.08)",
        color: "white",
        cursor: "pointer",
        transition: "0.2s",
        fontSize: 13,
        whiteSpace: "nowrap",
    };
}

const sectionTitleStyle: React.CSSProperties = {
    margin: "0 0 8px",
    fontSize: 14,
    fontWeight: 600,
};

const genreContainerStyle: React.CSSProperties = {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    overflowY: "hidden",
    paddingBottom: 6,
};

const inlineFilterStyle: React.CSSProperties = {
    display: "flex",
    gap: 16,
    overflowX: "auto",
    overflowY: "hidden",
    paddingBottom: 8,
};

const radioLabelStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
    whiteSpace: "nowrap",
    cursor: "pointer",
    fontSize: 12,
};

const filterSectionStyle: React.CSSProperties = {
    padding: "12px 0",
    borderBottom: "1px solid rgba(255,255,255,.1)",
};

const actionButtonsStyle: React.CSSProperties = {
    display: "flex",
    gap: 8,
    marginTop: 16,
};

const clearButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,.15)",
    background: "transparent",
    color: "rgba(255,255,255,.75)",
    cursor: "pointer",
    fontSize: 12,
};

const applyButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: "9px 12px",
    borderRadius: 8,
    border: "none",
    background: "white",
    color: "black",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
};

const closeButtonStyle: React.CSSProperties = {
    position: "absolute",
    top: 8,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "none",
    background: "rgba(255,255,255,.1)",
    color: "white",
    fontSize: 22,
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};