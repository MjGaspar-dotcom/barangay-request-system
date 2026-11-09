import { useState } from "react";
import api from "../../services/api";

import { validateForm } from "../../utils/validateForm";
export default function TrackRequest() {
    const [trackingNumber, setTrackingNumber] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleTrack = async (e) => {
        e.preventDefault();

        if (!validateForm(e.currentTarget)) return;

        setError("");
        setResult(null);
        setLoading(true);

        try {
            const response = await api.get(
                `/track/${trackingNumber.trim()}`
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
        <div className="mx-auto w-full max-w-7xl py-12">

            <h1 className="font-bold text-center mb-6">
                Track Your Request
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-12 justify-center">

                <div className="md:col-span-6">

                    <div className="app-card shadow-sm border-0">

                        <div className="app-card-body">

                            <form noValidate onSubmit={handleTrack}>

                                <label
                                    htmlFor="tracking_number"
                                    className="app-label"
                                >
                                    Enter Tracking Number
                                </label>

                                <input
                                    id="tracking_number"
                                    type="text"
                                    className="app-input mb-4"
                                    placeholder="Example: BR-20260902-ABCDEF"
                                    value={trackingNumber}
                                    onChange={(e) =>
                                        setTrackingNumber(e.target.value)
                                    }
                                    required
                                />

                                <button
                                    type="submit"
                                    className="app-button app-button-primary w-full"
                                    disabled={loading}
                                    aria-busy={loading || undefined}
                                    aria-label={loading ? "Searching requests" : undefined}
                                >
                                    {loading ? "Searching..." : "Track Request"}
                                </button>

                            </form>

                            {/* Error */}
                            {error && (
                                <p className="text-destructive mt-4">{error}</p>
                            )}

                            {/* Result */}
                            {result && (
                                <div className="mt-6">
                                    <h5 className="font-bold">Request Status</h5>

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
                                                <td>{result.document_type}</td>
                                            </tr>
                                            <tr>
                                                <th>Status</th>
                                                <td>
                                                    <span className="app-badge bg-primary">
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
