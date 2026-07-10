export default function TrailerLoader() {
    return (
        <div
            style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
            }}
        >
            <div
                style={{
                    width: "50px",
                    height: "50px",
                    border: "4px solid rgba(255,255,255,0.1)",
                    borderTop: "4px solid #ffffff",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                }}
            />
            <p
                style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "14px",
                    fontFamily: "Arial, sans-serif",
                }}
            >
                Loading trailer...
            </p>
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
}