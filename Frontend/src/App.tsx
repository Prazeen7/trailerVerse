import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import AppSplash from "./components/AppSplash";
import NativeOnboarding from "./pages/NativeOnboarding";
import Home from "./pages/Home";
import "./App.css"

export default function App() {
    const [isStarting, setIsStarting] = useState(true);

    const [hasCompletedOnboarding] = useState(() => {
        return localStorage.getItem(
            "trailerverse-onboarding-complete"
        ) === "true";
    });

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setIsStarting(false);
        }, 1800);

        return () => clearTimeout(timer);
    }, []);

    if (isStarting) {
        return <AppSplash />;
    }

    return (
        <Routes>
            <Route
                path="/"
                element={
                    hasCompletedOnboarding
                        ? <Navigate to="/home" replace />
                        : <Navigate to="/onboarding" replace />
                }
            />

            <Route
                path="/onboarding"
                element={<NativeOnboarding />}
            />

            <Route
                path="/home"
                element={<Home />}
            />
        </Routes>
    );
}