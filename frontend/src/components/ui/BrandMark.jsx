const BARANGAY_LOGO = "/assets/images/barangay-aurora-logo.png";

export default function BrandMark({
    src = BARANGAY_LOGO,
    className = "",
    alt = "Barangay Aurora, Alicia, Isabela official seal",
}) {
    return (
        <img
            className={`brand-mark ${className}`.trim()}
            src={src}
            alt={alt}
            decoding="async"
        />
    );
}
