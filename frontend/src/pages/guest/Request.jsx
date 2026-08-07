export default function Request() {
    return (
        <div className="container py-5">

            <h1 className="fw-bold text-center mb-4">
                Request Barangay Document
            </h1>


            <form>

                {/* Document Type */}
                <div className="mb-3">
                    <label className="form-label">
                        Select Document
                    </label>

                    <select className="form-select">

                        <option>
                            Barangay Clearance
                        </option>

                        <option>
                            Certificate of Residency
                        </option>

                        <option>
                            Certificate of Indigency
                        </option>

                        <option>
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
                        placeholder="Enter your complete address"
                    />

                </div>


                {/* Contact */}
                <div className="mb-3">

                    <label className="form-label">
                        Contact Number
                    </label>

                    <input
                        type="text"
                        className="form-control"
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
                        placeholder="Purpose of requesting document"
                    />

                </div>


                {/* ID Upload */}
                <div className="mb-3">

                    <label className="form-label">
                        Upload Valid ID
                    </label>

                    <input
                        type="file"
                        className="form-control"
                    />

                </div>


                <button className="btn btn-primary">
                    Submit Request
                </button>


            </form>

        </div>
    );
}