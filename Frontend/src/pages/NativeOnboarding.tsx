import { useNavigate } from "react-router-dom";
import { useState } from "react";
import appIcon from "../assets/TraileVerseLogo.png";
import "./NativeOnboardin.css";

export default function NativeOnboarding() {
    const navigate = useNavigate();
    const [activeSlide, setActiveSlide] = useState(0);

    const onboardingSlides = [
        {
            title: "Movies or TV Shows?",
            description:
                "Switch between movies and TV shows anytime and explore trailers your way.",
            visual: "content-toggle",
        },
        {
            title: "Explore Your Way",
            description:
                "Discover trailers through Now Playing, Popular, Top Rated, and Upcoming.",
            visual: "discovery-filters",
        },
        {
            title: "Find Your Next Favorite",
            description:
                "Filter by genre, country, release year, and rating to find exactly what you want.",
            visual: "advanced-filters",
        },
    ];

    const handleGetStarted = () => {
        localStorage.setItem(
            "trailerverse-onboarding-complete",
            "true"
        );

        navigate("/home", { replace: true });
    };

    const handleNext = () => {
        if (activeSlide < onboardingSlides.length) {
            setActiveSlide((prev) => prev + 1);
        } else {
            handleGetStarted();
        }
    };

    const currentSlide =
        activeSlide > 0
            ? onboardingSlides[activeSlide - 1]
            : null;

    return (
        <div className="onboarding-screen">

            {/* Background glow */}
            <div className="onboarding-glow onboarding-glow-one" />
            <div className="onboarding-glow onboarding-glow-two" />

            <div
                className="onboarding-content"
                key={activeSlide}
            >

                {activeSlide === 0 ? (
                    <>
                        <div className="onboarding-icon-wrapper">
                            <div className="icon-glow" />

                            <img
                                src={appIcon}
                                alt="TrailerVerse"
                                className="onboarding-icon"
                            />
                        </div>

                        <div className="onboarding-text">
                            <h1>TrailerVerse</h1>

                            <p>
                                Discover your next favorite
                                <br />
                                movie or TV show.
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="feature-visual">

                            {currentSlide?.visual === "content-toggle" && (
                                <div className="mock-toggle">
                                    <span className="selected">
                                        🎬 Movies
                                    </span>

                                    <span>
                                        📺 TV Shows
                                    </span>
                                </div>
                            )}

                            {currentSlide?.visual === "discovery-filters" && (
                                <div className="mock-filter-list">
                                    <span>Now Playing</span>
                                    <span>Popular</span>
                                    <span>Top Rated</span>
                                    <span>Upcoming</span>
                                </div>
                            )}

                            {currentSlide?.visual === "advanced-filters" && (
                                <div className="mock-advanced-filters">
                                    <span>Genre</span>
                                    <span>Country</span>
                                    <span>Year</span>
                                    <span>Rating</span>
                                </div>
                            )}

                        </div>

                        <div className="onboarding-text">
                            <h1>{currentSlide?.title}</h1>

                            <p>
                                {currentSlide?.description}
                            </p>
                        </div>
                    </>
                )}

                <button
                    className="onboarding-button"
                    onClick={handleNext}
                >
                    <span>
                        {activeSlide === onboardingSlides.length
                            ? "Start Exploring"
                            : "Continue"}
                    </span>

                    <span className="button-arrow">
                        →
                    </span>
                </button>

                <div className="onboarding-dots">
                    {[0, 1, 2, 3].map((slide) => (
                        <span
                            key={slide}
                            className={
                                activeSlide === slide
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveSlide(slide)
                            }
                        />
                    ))}
                </div>

            </div>
        </div>
    );
}