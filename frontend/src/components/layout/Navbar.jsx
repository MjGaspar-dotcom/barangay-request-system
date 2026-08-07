import { Link } from "react-router-dom";

export default function Navbar() {
    return (
    <header>
        <nav>
            <h2>Barangay Document Request System</h2>

            <ul>
                <li>
                    <Link to="/">Home</Link>
                </li>

                <li>
                    <Link to="/about">About</Link>
                </li>

                <li>
                    <Link to="/contact">Contact</Link>
                </li>

                <li>
                    <Link to="/login">Login</Link>
                </li>

                <li>
                    <Link to="/register">Register</Link>
                </li>
            </ul>
        </nav>
    </header>
    );
}