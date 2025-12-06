const logoSrc = '/logo.png';

export default function ApplicationLogo({ className = '', ...props }) {
    return (
        <img
            src={logoSrc}
            alt="BoostClicks CPA Platform"
            className={`object-contain ${className}`}
            loading="lazy"
            {...props}
        />
    );
}
