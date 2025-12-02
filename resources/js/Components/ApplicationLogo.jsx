export default function ApplicationLogo(props) {
    return (
        <svg
            {...props}
            viewBox="0 0 240 80"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
        >
            <defs>
                <linearGradient id="bcGradient" x1="0" y1="0" x2="240" y2="80" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1E3A8A" />
                    <stop offset="0.5" stopColor="#2563EB" />
                    <stop offset="1" stopColor="#22D3EE" />
                </linearGradient>
            </defs>
            <rect x="4" y="8" width="56" height="56" rx="14" fill="url(#bcGradient)" />
            <path
                d="M20 48c4.5-8.5 9-12.5 17-18l8 10 12-22"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <text
                x="72"
                y="36"
                fill="#0F172A"
                fontSize="18"
                fontWeight="700"
                fontFamily="Inter, system-ui, -apple-system, sans-serif"
            >
                BoostClicks
            </text>
            <text
                x="72"
                y="56"
                fill="#2563EB"
                fontSize="14"
                fontWeight="600"
                fontFamily="Inter, system-ui, -apple-system, sans-serif"
            >
                CPA Platform
            </text>
        </svg>
    );
}
