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

                            <label className="form-label">
                                Enter Tracking Code
                            </label>


                            <input
                                type="text"
                                className="form-control mb-3"
                                placeholder="Example: BRGY-2026-000123"
                            />


                            <button className="btn btn-primary w-100">
                                Track Request
                            </button>


                        </div>

                    </div>


                </div>

            </div>


        </div>
    );
}