import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: "",
        password: "",
        password_confirmation: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        birth_date: "",
        gender: "",
        civil_status: "",
        address: "",
        contact_number: "",
        email: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (form.password !== form.password_confirmation) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            await api.post("/register", form);

            setSuccess(
                "Registration successful. You can now log in to your account.",
            );

            setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (error) {
            console.error("Registration failed:", error);

            if (error.response?.status === 422) {
                const validationErrors = error.response.data?.errors;

                if (validationErrors) {
                    const firstError = Object.values(validationErrors)
                        .flat()
                        .find(Boolean);

                    setError(firstError || "Please check your information.");
                } else {
                    setError(
                        error.response.data?.message ||
                            "Please check your information.",
                    );
                }
            } else {
                setError(
                    error.response?.data?.message ||
                        "Registration failed. Please try again.",
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card auth-card-wide">
                <div className="auth-header">
                    <span className="section-label">CREATE ACCOUNT</span>

                    <h1>Resident Registration</h1>

                    <p>
                        Create an account to request and track barangay
                        documents online.
                    </p>
                </div>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="alert alert-success" role="alert">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <h2>Account Information</h2>

                        <div className="row g-3">
                            <div className="col-md-6">
                                <label
                                    htmlFor="username"
                                    className="form-label"
                                >
                                    Username
                                </label>

                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    className="form-control"
                                    value={form.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <label htmlFor="email" className="form-label">
                                    Email
                                </label>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    className="form-control"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <label
                                    htmlFor="password"
                                    className="form-label"
                                >
                                    Password
                                </label>

                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    className="form-control"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    minLength={8}
                                />
                            </div>

                            <div className="col-md-6">
                                <label
                                    htmlFor="password_confirmation"
                                    className="form-label"
                                >
                                    Confirm Password
                                </label>

                                <input
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    type="password"
                                    className="form-control"
                                    value={form.password_confirmation}
                                    onChange={handleChange}
                                    required
                                    minLength={8}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>Personal Information</h2>

                        <div className="row g-3">
                            <div className="col-md-4">
                                <label
                                    htmlFor="first_name"
                                    className="form-label"
                                >
                                    First Name
                                </label>

                                <input
                                    id="first_name"
                                    name="first_name"
                                    type="text"
                                    className="form-control"
                                    value={form.first_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="col-md-4">
                                <label
                                    htmlFor="middle_name"
                                    className="form-label"
                                >
                                    Middle Name
                                </label>

                                <input
                                    id="middle_name"
                                    name="middle_name"
                                    type="text"
                                    className="form-control"
                                    value={form.middle_name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-md-4">
                                <label
                                    htmlFor="last_name"
                                    className="form-label"
                                >
                                    Last Name
                                </label>

                                <input
                                    id="last_name"
                                    name="last_name"
                                    type="text"
                                    className="form-control"
                                    value={form.last_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="col-md-4">
                                <label
                                    htmlFor="birth_date"
                                    className="form-label"
                                >
                                    Birth Date
                                </label>

                                <input
                                    id="birth_date"
                                    name="birth_date"
                                    type="date"
                                    className="form-control"
                                    value={form.birth_date}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="col-md-4">
                                <label htmlFor="gender" className="form-label">
                                    Gender
                                </label>

                                <select
                                    id="gender"
                                    name="gender"
                                    className="form-select"
                                    value={form.gender}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>

                            <div className="col-md-4">
                                <label
                                    htmlFor="civil_status"
                                    className="form-label"
                                >
                                    Civil Status
                                </label>

                                <select
                                    id="civil_status"
                                    name="civil_status"
                                    className="form-select"
                                    value={form.civil_status}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">
                                        Select civil status
                                    </option>
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Widowed">Widowed</option>
                                    <option value="Separated">Separated</option>
                                </select>
                            </div>

                            <div className="col-12">
                                <label htmlFor="address" className="form-label">
                                    Address
                                </label>

                                <textarea
                                    id="address"
                                    name="address"
                                    className="form-control"
                                    rows="3"
                                    value={form.address}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <label
                                    htmlFor="contact_number"
                                    className="form-label"
                                >
                                    Contact Number
                                </label>

                                <input
                                    id="contact_number"
                                    name="contact_number"
                                    type="tel"
                                    className="form-control"
                                    value={form.contact_number}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-success w-100"
                        disabled={loading}
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <div className="auth-footer">
                    <span>Already have an account?</span>{" "}
                    <Link to="/login">Login</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;
