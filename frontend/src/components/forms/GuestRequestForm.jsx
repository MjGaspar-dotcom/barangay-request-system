    import { useEffect, useState } from "react";
    import api from "../../services/api";

    export default function GuestRequestForm() {
        const [documentTypes, setDocumentTypes] = useState([]);
        const [loadingDocumentTypes, setLoadingDocumentTypes] = useState(true);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState("");
        const [success, setSuccess] = useState("");
        const [trackingNumber, setTrackingNumber] = useState("");

        const [formData, setFormData] = useState({
            document_type_id: "",
            first_name: "",
            middle_name: "",
            last_name: "",
            birth_date: "",
            gender: "",
            civil_status: "",
            address: "",
            contact_number: "",
            email: "",
            valid_id_type: "",
            valid_id_image: null,
            purpose: "",
        });

        // Load document types from the API on mount.
        useEffect(() => {
            const fetchDocumentTypes = async () => {
                try {
                    const response = await api.get("/document-types");
                    setDocumentTypes(response.data.data);
                } catch (err) {
                    console.error(err);
                    setError("Failed to load document types.");
                } finally {
                    setLoadingDocumentTypes(false);
                }
            };

            fetchDocumentTypes();
        }, []);

        const handleChange = (e) => {
            const { name, value, files } = e.target;

            setFormData((prev) => ({
                ...prev,
                [name]: files ? files[0] : value,
            }));
        };

        const handleSubmit = async (e) => {
            e.preventDefault();

            setError("");
            setSuccess("");
            setTrackingNumber("");
            setLoading(true);

            try {
                const data = new FormData();

                for (const key in formData) {
                    if (formData[key] !== null && formData[key] !== "") {
                        data.append(key, formData[key]);
                    }
                }

                const response = await api.post("/guest-requests", data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                setTrackingNumber(response.data.data.tracking_number);
                setSuccess("Your request has been submitted successfully!");

                // Reset the form.
                setFormData({
                    document_type_id: "",
                    first_name: "",
                    middle_name: "",
                    last_name: "",
                    birth_date: "",
                    gender: "",
                    civil_status: "",
                    address: "",
                    contact_number: "",
                    email: "",
                    valid_id_type: "",
                    valid_id_image: null,
                    purpose: "",
                });
            } catch (err) {
                console.error(err);

                if (err.response?.status === 422) {
                    const validationErrors = err.response.data.errors;
                    const firstError = validationErrors
                        ? Object.values(validationErrors)[0][0]
                        : "Please check the information you entered.";
                    setError(firstError);
                } else {
                    setError("Failed to submit request. Please try again.");
                }
            } finally {
                setLoading(false);
            }
        };

        if (loadingDocumentTypes) {
            return <p>Loading document types...</p>;
        }

        return (
            <form onSubmit={handleSubmit}>

                {/* Document Type */}
                <div className="mb-3">
                    <label htmlFor="document_type_id" className="form-label">
                        Select Document
                    </label>

                    <select
                        id="document_type_id"
                        className="form-select"
                        name="document_type_id"
                        value={formData.document_type_id}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select document</option>

                        {documentTypes.map((documentType) => (
                            <option
                                key={documentType.document_type_id}
                                value={documentType.document_type_id}
                            >
                                {documentType.document_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* First Name */}
                <div className="mb-3">
                    <label htmlFor="first_name" className="form-label">
                        First Name
                    </label>

                    <input
                        id="first_name"
                        type="text"
                        className="form-control"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="Enter first name"
                        required
                    />
                </div>

                {/* Middle Name */}
                <div className="mb-3">
                    <label htmlFor="middle_name" className="form-label">
                        Middle Name
                    </label>

                    <input
                        id="middle_name"
                        type="text"
                        className="form-control"
                        name="middle_name"
                        value={formData.middle_name}
                        onChange={handleChange}
                        placeholder="Enter middle name (optional)"
                    />
                </div>

                {/* Last Name */}
                <div className="mb-3">
                    <label htmlFor="last_name" className="form-label">
                        Last Name
                    </label>

                    <input
                        id="last_name"
                        type="text"
                        className="form-control"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="Enter last name"
                        required
                    />
                </div>

                {/* Birth Date */}
                <div className="mb-3">
                    <label htmlFor="birth_date" className="form-label">
                        Birth Date
                    </label>

                    <input
                        id="birth_date"
                        type="date"
                        className="form-control"
                        name="birth_date"
                        value={formData.birth_date}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Gender */}
                <div className="mb-3">
                    <label htmlFor="gender" className="form-label">
                        Gender
                    </label>

                    <select
                        id="gender"
                        className="form-select"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                </div>

                {/* Civil Status */}
                <div className="mb-3">
                    <label htmlFor="civil_status" className="form-label">
                        Civil Status
                    </label>

                    <select
                        id="civil_status"
                        className="form-select"
                        name="civil_status"
                        value={formData.civil_status}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select civil status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Separated">Separated</option>
                    </select>
                </div>

                {/* Address */}
                <div className="mb-3">
                    <label htmlFor="address" className="form-label">
                        Address
                    </label>

                    <textarea
                        id="address"
                        className="form-control"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter complete address"
                        required
                    />
                </div>

                {/* Contact Number */}
                <div className="mb-3">
                    <label htmlFor="contact_number" className="form-label">
                        Contact Number
                    </label>

                    <input
                        id="contact_number"
                        type="text"
                        className="form-control"
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={handleChange}
                        placeholder="09XXXXXXXXX"
                        required
                    />
                </div>

                {/* Email */}
                <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                        Email <span className="text-muted">(optional)</span>
                    </label>

                    <input
                        id="email"
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email address"
                    />
                </div>

                {/* Valid ID Type */}
                <div className="mb-3">
                    <label htmlFor="valid_id_type" className="form-label">
                        Valid ID Type
                    </label>

                    <select
                        id="valid_id_type"
                        className="form-select"
                        name="valid_id_type"
                        value={formData.valid_id_type}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select ID type</option>
                        <option value="National ID">National ID</option>
                        <option value="Driver's License">Driver's License</option>
                        <option value="Passport">Passport</option>
                        <option value="UMID">UMID</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                {/* Valid ID Image */}
                <div className="mb-3">
                    <label htmlFor="valid_id_image" className="form-label">
                        Upload Valid ID
                    </label>

                    <input
                        id="valid_id_image"
                        type="file"
                        className="form-control"
                        name="valid_id_image"
                        onChange={handleChange}
                        accept="image/*"
                        required
                    />
                </div>

                {/* Purpose */}
                <div className="mb-3">
                    <label htmlFor="purpose" className="form-label">
                        Purpose
                    </label>

                    <textarea
                        id="purpose"
                        className="form-control"
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleChange}
                        placeholder="Purpose of requesting document"
                        required
                    />
                </div>

                {/* Error */}
                {error && (
                    <p className="text-danger">{error}</p>
                )}

                {/* Success + Tracking Number */}
                {success && (
                    <div className="alert alert-success">
                        <p className="mb-1">{success}</p>
                        <p className="mb-0">
                            <strong>Tracking Number:</strong>{" "}
                            <span className="font-monospace">{trackingNumber}</span>
                        </p>
                        <small className="text-muted">
                            Save this tracking number to check your request status.
                        </small>
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                >
                    {loading ? "Submitting..." : "Submit Request"}
                </button>

            </form>
        );
    }
