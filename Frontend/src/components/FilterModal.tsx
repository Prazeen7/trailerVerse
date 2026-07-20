import HorizontalFilterRow from "./HorizontalFilterRow";
import { useState } from "react";
import {
    MOVIE_GENRES,
    TV_GENRES,
} from "../constants/genre";
import { COUNTRIES } from "../constants/countries";

interface FilterModalProps {
    open: boolean;
    onClose: () => void;
    onApply: () => void;
    onClear: () => void;

    contentType: "movie" | "tv";

    genre?: number;
    releaseYear?: string;
    originCountry?: string;
    minVoteAverage?: number;

    onGenreChange: (genre?: number) => void;
    onReleaseYearChange: (year?: string) => void;
    onOriginCountryChange: (country?: string) => void;
    onMinVoteAverageChange: (rating?: number) => void;
    showReleaseYear?: boolean;
}

const RATINGS = [9, 8, 7, 6, 5, 4, 3, 2, 1];

export default function FilterModal({
    open,
    onClose,
    onApply,
    onClear,
    genre,
    releaseYear,
    originCountry,
    minVoteAverage,

    onGenreChange,
    onReleaseYearChange,
    onOriginCountryChange,
    onMinVoteAverageChange,
    contentType,
    showReleaseYear
}: FilterModalProps) {

    const [genreSearch, setGenreSearch] = useState("");
    const [yearSearch, setYearSearch] = useState("");
    const [countrySearch, setCountrySearch] = useState("");

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

    const appliedFilters = [
        genre !== undefined
            ? {
                label: genres.find((g) => g.id === genre)?.name ?? "Genre",
                clear: () => onGenreChange(undefined),
            }
            : null,

        showReleaseYear && releaseYear
            ? {
                label: releaseYear,
                clear: () => onReleaseYearChange(undefined),
            }
            : null,

        originCountry
            ? {
                label: originCountry,
                clear: () => onOriginCountryChange(undefined),
            }
            : null,

        minVoteAverage !== undefined
            ? {
                label: `${minVoteAverage}+`,
                clear: () => onMinVoteAverageChange(undefined),
            }
            : null,
    ].filter(Boolean) as {
        label: string;
        clear: () => void;
    }[];

    const filteredGenres = genres.filter((genre) =>
        genre.name.toLowerCase().includes(genreSearch.toLowerCase())
    );

    const filteredYears = years.filter((year) =>
        String(year).includes(yearSearch)
    );

    const filteredCountries = COUNTRIES.filter((country) =>
        country.english_name
            .toLowerCase()
            .includes(countrySearch.toLowerCase())
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

                    {appliedFilters.length > 0 && (
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 6,
                                marginBottom: 12,
                            }}
                        >
                            {appliedFilters.map((filter) => (
                                <button
                                    key={filter.label}
                                    onClick={filter.clear}
                                    style={{
                                        padding: "5px 9px",
                                        borderRadius: 999,
                                        border: "1px solid rgba(255,255,255,.2)",
                                        background: "rgba(255,255,255,.12)",
                                        color: "white",
                                        fontSize: 11,
                                        cursor: "pointer",
                                    }}
                                >
                                    {filter.label} ×
                                </button>
                            ))}
                        </div>
                    )}

                    <section style={filterSectionStyle}>
                        <div style={sectionHeaderStyle}>
                            <h3 style={{ ...sectionTitleStyle, margin: 0 }}>
                                Genre
                            </h3>

                            <input
                                type="text"
                                placeholder="Search..."
                                value={genreSearch}
                                onChange={(e) => setGenreSearch(e.target.value)}
                                style={searchInputStyle}
                            />
                        </div>

                        <HorizontalFilterRow>
                            {filteredGenres.map((g) => (
                                <button
                                    key={g.id}
                                    onClick={() =>
                                        onGenreChange(
                                            genre === g.id ? undefined : g.id
                                        )
                                    }
                                    style={buttonStyle(genre === g.id)}
                                >
                                    {g.name}
                                </button>
                            ))}
                        </HorizontalFilterRow>
                    </section>

                    {showReleaseYear && (
                        <section style={filterSectionStyle}>

                            <div style={sectionHeaderStyle}>
                                <h3 style={{ ...sectionTitleStyle, margin: 0 }}>
                                    Year
                                </h3>

                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={yearSearch}
                                    onChange={(e) => setYearSearch(e.target.value)}
                                    style={searchInputStyle}
                                />
                            </div>

                            <HorizontalFilterRow>
                                {filteredYears.map((year) => (
                                    <label
                                        key={year}
                                        style={radioLabelStyle}
                                    >
                                        <input
                                            type="radio"
                                            name="releaseYear"
                                            checked={releaseYear === String(year)}
                                            onChange={() =>
                                                onReleaseYearChange(
                                                    releaseYear === String(year)
                                                        ? undefined
                                                        : String(year)
                                                )
                                            }
                                        />

                                        {year}
                                    </label>
                                ))}
                            </HorizontalFilterRow>
                        </section>
                    )}

                    <section style={filterSectionStyle}>
                        <div style={sectionHeaderStyle}>
                            <h3 style={{ ...sectionTitleStyle, margin: 0 }}>
                                Origin Country
                            </h3>

                            <input
                                type="text"
                                placeholder="Search..."
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                style={searchInputStyle}
                            />
                        </div>

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

                            {filteredCountries.map((country) => (
                                <label
                                    key={country.iso_3166_1}
                                    style={radioLabelStyle}
                                >
                                    <input
                                        type="radio"
                                        name="originCountry"
                                        checked={
                                            originCountry === country.iso_3166_1
                                        }
                                        onChange={() =>
                                            onOriginCountryChange(
                                                originCountry === country.iso_3166_1
                                                    ? undefined
                                                    : country.iso_3166_1
                                            )
                                        }
                                    />

                                    {country.english_name}
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
                                            onMinVoteAverageChange(
                                                minVoteAverage === rating
                                                    ? undefined
                                                    : rating
                                            )
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
                            onClick={onClear}
                            style={clearButtonStyle}
                        >
                            Clear Filters
                        </button>

                        <button
                            type="button"
                            onClick={onApply}
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
    padding: "14px",
    marginBottom: 10,
    borderRadius: 14,
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.1)",
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

const searchInputStyle: React.CSSProperties = {
    width: 150,
    padding: "6px 9px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,.15)",
    background: "rgba(255,255,255,.08)",
    color: "white",
    outline: "none",
    fontSize: 11,
};

const sectionHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingBottom: 10,
    marginBottom: 10,
    borderBottom: "1px solid rgba(255,255,255,.12)",
};