import { useState } from "react";
import api from "../../services/api";


export default function GuestRequestForm() {

    const [formData, setFormData] = useState({
        documentType: "",
        fullName: "",
        address: "",
        contactNumber: "",
        purpose: "",
        validId: null,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFileChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            validId: e.target.files[0],
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        console.log(formData);

        // Later:
        // axios.post("http://localhost:8000/api/barangay-requests", formData);
    };

    return (
        <form onSubmit={handleSubmit}>

            {/* Document Type */}
            <div className="mb-3">
                <label className="form-label">
                    Select Document
                </label>

                <select
                    className="form-select"
                    name="documentType"
                    value={formData.documentType}
                    onChange={handleChange}
                >
                    <option value="">
                        -- Select Document --
                    </option>

                    <option value="Barangay Clearance">
                        Barangay Clearance
                    </option>

                    <option value="Certificate of Residency">
                        Certificate of Residency
                    </option>

                    <option value="Certificate of Indigency">
                        Certificate of Indigency
                    </option>

                    <option value="Business Clearance">
                        Business Clearance
                    </option>

                </select>
            </div>


            {/* Full Name */}
            <div className="mb-3">

                <label className="form-label">
                    Full Name
                </label>

                <input
                    type="text"
                    className="form-control"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                />

            </div>


            {/* Address */}
            <div className="mb-3">

                <label className="form-label">
                    Address
                </label>

                <textarea
                    className="form-control"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your complete address"
                    rows="3"
                />

            </div>


            {/* Contact Number */}
            <div className="mb-3">

                <label className="form-label">
                    Contact Number
                </label>

                <input
                    type="text"
                    className="form-control"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    placeholder="09XXXXXXXXX"
                />

            </div>


            {/* Purpose */}
            <div className="mb-3">

                <label className="form-label">
                    Purpose
                </label>

                <textarea
                    className="form-control"
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    placeholder="Purpose of requesting document"
                    rows="3"
                />

            </div>


            {/* Upload Valid ID */}
            <div className="mb-4">

                <label className="form-label">
                    Upload Valid ID
                </label>

                <input
                    type="file"
                    className="form-control"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                />

            </div>


            <button
                type="submit"
                className="btn btn-primary w-100"
            >
                Submit Request
            </button>

        </form>
    );
}