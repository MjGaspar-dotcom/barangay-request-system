import { useState } from "react";
import api from "../../services/api";

export default function TrackRequest() {
    const [trackingNumber, setTrackingNumber] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleTrack = async (e) => {
        e.preventDefault();

        setError("");
        setResult(null);
        setLoading(true);

        try {
            const response = await api.get(
                `/guest-requests/track/${trackingNumber.trim()}`
            );

            setResult(response.data.data);
        } catch (err) {
            console.error(err);

            if (err.response?.status === 404) {
                setError(
                    "No request found with that tracking number. Please check and try again."
                );
            } else {
                setError("Failed to look up the tracking number. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-5">

            <h1 className="fw-bold text-center mb-4">
                Track Your Request
            </h1>

            <div className="row justify-content-center">

                <div className="col-md-6">

                    <div className="card shadow-sm border-0">

                        <div className="card-body">

                            <form onSubmit={handleTrack}>

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
                                    value={trackingNumber}
                                    onChange={(e) =>
                                        setTrackingNumber(e.target.value)
                                    }
                                    required
                                />

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={loading}
                                >
                                    {loading ? "Searching..." : "Track Request"}
                                </button>

                            </form>

                            {/* Error */}
                            {error && (
                                <p className="text-danger mt-3">{error}</p>
                            )}

                            {/* Result */}
                            {result && (
                                <div className="mt-4">
                                    <h5 className="fw-bold">Request Status</h5>

                                    <table className="table table-bordered">
                                        <tbody>
                                            <tr>
                                                <th>Tracking Number</th>
                                                <td className="font-monospace">
                                                    {result.tracking_number}
                                                </td>
                                            </tr>
                                            <tr>
                                                <th>Document</th>
                                                <td>{result.document}</td>
                                            </tr>
                                            <tr>
                                                <th>Status</th>
                                                <td>
                                                    <span className="badge bg-primary">
                                                        {result.status}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <th>Purpose</th>
                                                <td>{result.purpose}</td>
                                            </tr>
                                            <tr>
                                                <th>Submitted</th>
                                                <td>
                                                    {new Date(
                                                        result.submitted_at
                                                    ).toLocaleString()}
                                                </td>
                                            </tr>

                                            {result.remarks && (
                                                <tr>
                                                    <th>Remarks</th>
                                                    <td>{result.remarks}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}
