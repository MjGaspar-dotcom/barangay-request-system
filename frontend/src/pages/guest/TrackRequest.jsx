export default function TrackRequest() {
    return (
        <div className="container py-5">

            <h1 className="fw-bold text-center mb-4">
                Track Your Request
            </h1>

            <div className="row justify-content-center">

                <div className="col-md-6">

                    <div className="card shadow-sm border-0">

                        <div className="card-body">

                            <form>

                                <label
                                    htmlFor="tracking_number"
                                    className="form-label"
                                >
                                    Enter Tracking Number
                                </label>

                                <input
                                    id="tracking_number"
                                    type="text"
                                    className="form-control mb-3"
                                    placeholder="Example: GR-20260902-ABCDEF"
                                    disabled
                                    required
                                />

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled
                                >
                                    Tracking unavailable
                                </button>

                            </form>

                            <div className="alert alert-info mt-3" role="status">
                                Tracking cannot be looked up because the API
                                does not provide a public tracking endpoint.
                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}
