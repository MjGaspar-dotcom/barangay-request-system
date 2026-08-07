import { Link } from "react-router-dom";

export default function Navbar() {
    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
            <div className="container">

                <Link 
                    className="navbar-brand fw-bold"
                    to="/"
                >
                    Barangay Document Request System
                </Link>


                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarMenu"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>


                <div 
                    className="collapse navbar-collapse"
                    id="navbarMenu"
                >

                    <ul className="navbar-nav ms-auto">

                        <li className="nav-item">
                            <Link 
                                className="nav-link"
                                to="/"
                            >
                                Home
                            </Link>
                        </li>


                        <li className="nav-item">
                            <Link 
                                className="nav-link"
                                to="/login"
                            >
                                Login
                            </Link>
                        </li>


                        <li className="nav-item">
                            <Link 
                                className="nav-link"
                                to="/register"
                            >
                                Register
                            </Link>
                        </li>

                    </ul>

                </div>

            </div>
        </nav>
    );
}