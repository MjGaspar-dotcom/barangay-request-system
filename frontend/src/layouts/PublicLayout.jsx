import Navbar from "../components/navigation/Navbar";
import Footer from "../components/layout/Footer";
import { PublicLayoutRoot, PublicMain } from "./PublicLayout.styles";

export default function PublicLayout({ children }) {
    return (
        <PublicLayoutRoot>
            <Navbar />

            <PublicMain>{children}</PublicMain>

            <Footer />
        </PublicLayoutRoot>
    );
}
