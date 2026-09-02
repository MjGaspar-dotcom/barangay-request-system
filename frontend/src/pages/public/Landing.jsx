import HeroSection from "../../components/sections/HeroSection";
import AboutSection from "../../components/sections/AboutSection";
import DocumentSection from "../../components/sections/DocumentSection";
import RequirementSection from "../../components/sections/RequirementSection";
import RoleSection from "../../components/sections/RoleSection";
import ContactSection from "../../components/sections/ContactSection";

function Landing() {
    return (
        <>
            <HeroSection />
            <DocumentSection />
            <RequirementSection />
            <AboutSection />
            <RoleSection />
            <ContactSection />
        </>
    );
}

export default Landing;
