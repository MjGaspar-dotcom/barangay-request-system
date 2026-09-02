import Navbar from "../components/navigation/Navbar";
import Footer from "../components/layout/Footer";

export default function PublicLayout({ children }) {
    return (
        <div className="app-layout">
            <Navbar />

            <main className="main-content">{children}</main>

            <Footer />
        </div>
    );
}
