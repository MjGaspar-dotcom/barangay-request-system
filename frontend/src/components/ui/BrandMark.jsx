const BARANGAY_LOGO = "/assets/images/logo.webp";

export default function BrandMark({
    className = "",
    alt = "Barangay Aurora, Alicia, Isabela official seal",
}) {
    return (
        <img
            className={`brand-mark ${className}`.trim()}
            src={BARANGAY_LOGO}
            alt={alt}
            decoding="async"
        />
    );
}
