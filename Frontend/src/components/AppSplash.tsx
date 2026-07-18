import appIcon from "../assets/TraileVerseLogo.png";
import "./AppSplash.css";

export default function AppSplash() {
    return (
        <div className="app-splash">

            <div className="splash-glow splash-glow-one" />
            <div className="splash-glow splash-glow-two" />

            <div className="splash-content">

                <div className="splash-icon-wrapper">
                    <div className="splash-icon-glow" />

                    <img
                        src={appIcon}
                        alt="TrailerVerse"
                        className="splash-icon"
                    />
                </div>

                <h1>TrailerVerse</h1>

                <div className="splash-loader">
                    <span />
                    <span />
                    <span />
                </div>

            </div>

            <span className="splash-version">
                TrailerVerse
            </span>

        </div>
    );
}