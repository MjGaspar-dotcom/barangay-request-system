import { useState } from "react";

export default function GuestRequestForm() {
    const [formData, setFormData] = useState({
        document_type_id: "",
        guest_first_name: "",
        guest_middle_name: "",
        guest_last_name: "",
        guest_birth_date: "",
        guest_gender: "",
        guest_civil_status: "",
        guest_address: "",
        guest_contact_number: "",
        guest_email: "",
        guest_valid_id_type: "",
        guest_valid_id_image: null,
        purpose: "",
    });

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const data = new FormData();

        for (const key in formData) {
            data.append(key, formData[key]);
        }

        // Loop through the FormData entries
        // and print each field to the browser console.
        for (const [key, value] of data.entries()) {
            console.log(`${key}:`, value);
        }
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
                    name="document_type_id"
                    value={formData.document_type_id}
                    onChange={handleChange}
                    required
                >
                    <option value="">Select document</option>
                    <option value="1">Barangay Clearance</option>
                    <option value="2">Certificate of Residency</option>
                    <option value="3">Certificate of Indigency</option>
                    <option value="4">Business Clearance</option>
                </select>
            </div>

            {/* First Name */}
            <div className="mb-3">
                <label className="form-label">
                    First Name
                </label>

                <input
                    type="text"
                    className="form-control"
                    name="guest_first_name"
                    value={formData.guest_first_name}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    required
                />
            </div>

            {/* Middle Name */}
            <div className="mb-3">
                <label className="form-label">
                    Middle Name
                </label>

                <input
                    type="text"
                    className="form-control"
                    name="guest_middle_name"
                    value={formData.guest_middle_name}
                    onChange={handleChange}
                    placeholder="Enter middle name"
                />
            </div>

            {/* Last Name */}
            <div className="mb-3">
                <label className="form-label">
                    Last Name
                </label>

                <input
                    type="text"
                    className="form-control"
                    name="guest_last_name"
                    value={formData.guest_last_name}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    required
                />
            </div>

            {/* Birth Date */}
            <div className="mb-3">
                <label className="form-label">
                    Birth Date
                </label>

                <input
                    type="date"
                    className="form-control"
                    name="guest_birth_date"
                    value={formData.guest_birth_date}
                    onChange={handleChange}
                    required
                />
            </div>

            {/* Gender */}
            <div className="mb-3">
                <label className="form-label">
                    Gender
                </label>

                <select
                    className="form-select"
                    name="guest_gender"
                    value={formData.guest_gender}
                    onChange={handleChange}
                    required
                >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
            </div>

            {/* Civil Status */}
            <div className="mb-3">
                <label className="form-label">
                    Civil Status
                </label>

                <select
                    className="form-select"
                    name="guest_civil_status"
                    value={formData.guest_civil_status}
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
                <label className="form-label">
                    Address
                </label>

                <textarea
                    className="form-control"
                    name="guest_address"
                    value={formData.guest_address}
                    onChange={handleChange}
                    placeholder="Enter complete address"
                    required
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
                    name="guest_contact_number"
                    value={formData.guest_contact_number}
                    onChange={handleChange}
                    placeholder="09XXXXXXXXX"
                    required
                />
            </div>

            {/* Email */}
            <div className="mb-3">
                <label className="form-label">
                    Email
                </label>

                <input
                    type="email"
                    className="form-control"
                    name="guest_email"
                    value={formData.guest_email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                />
            </div>

            {/* Valid ID Type */}
            <div className="mb-3">
                <label className="form-label">
                    Valid ID Type
                </label>

                <select
                    className="form-select"
                    name="guest_valid_id_type"
                    value={formData.guest_valid_id_type}
                    onChange={handleChange}
                    required
                >
                    <option value="">Select ID type</option>
                    <option value="National ID">National ID</option>
                    <option value="Driver's License">
                        Driver's License
                    </option>
                    <option value="Passport">Passport</option>
                    <option value="UMID">UMID</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            {/* Valid ID */}
            <div className="mb-3">
                <label className="form-label">
                    Upload Valid ID
                </label>

                <input
                    type="file"
                    className="form-control"
                    name="guest_valid_id_image"
                    onChange={handleChange}
                    accept="image/*"
                    required
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
                    required
                />
            </div>

            {/* Submit */}
            <button
                type="submit"
                className="btn btn-primary"
            >
                Submit Request
            </button>

        </form>
    );
}