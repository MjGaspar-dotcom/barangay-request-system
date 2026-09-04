import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

function StaffRequestDetails() {
    const { type, requestId } = useParams();
    const navigate = useNavigate();

    const [request, setRequest] = useState(null);
    const [requestType, setRequestType] = useState(type || "registered");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [remarks, setRemarks] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchRequest = async () => {
        setLoading(true);
        setError("");

        try {
            let primaryEndpoint = `/barangay-requests/${requestId}`;
            if (type === "guest") {
                primaryEndpoint = `/guest-requests/${requestId}`;
            }

            let response;
            try {
                response = await api.get(primaryEndpoint);
                setRequestType(type || "registered");
            } catch (err) {
                // Fallback attempt if type was omitted in route
                if (!type && err.response?.status === 404) {
                    response = await api.get(`/guest-requests/${requestId}`);
                    setRequestType("guest");
                } else {
                    throw err;
                }
            }

            const data = response.data.data;
            setRequest(data);
            setRemarks(data.remarks || "");
        } catch (err) {
            console.error(err);
            if (err.response?.status === 403) {
                setError("You are not authorized to view this request.");
            } else if (err.response?.status === 404) {
                setError("Request not found.");
            } else {
                setError("Failed to load request details.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequest();
    }, [type, requestId]);

    const handleStatusUpdate = async (newStatus) => {
        const endpoint =
            requestType === "guest"
                ? `/guest-requests/${requestId}`
                : `/barangay-requests/${requestId}`;

        const confirmAction = window.confirm(
            `Change status to "${newStatus}"?`
        );
        if (!confirmAction) return;

        setSubmitting(true);
        try {
            await api.put(endpoint, {
                status: newStatus,
                remarks: remarks || null,
            });
            alert(`Status updated to ${newStatus}.`);
            fetchRequest();
        } catch (err) {
            console.error("Failed to update status:", err);
            const msg =
                err.response?.data?.message || "Failed to update status.";
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        const endpoint =
            requestType === "guest"
                ? `/guest-requests/${requestId}`
                : `/barangay-requests/${requestId}`;

        const confirmDelete = window.confirm(
            `Are you sure you want to delete this request?`
        );
        if (!confirmDelete) return;

        try {
            await api.delete(endpoint);
            alert("Request deleted successfully.");
            navigate("/staff/dashboard");
        } catch (err) {
            console.error("Failed to delete request:", err);
            const msg =
                err.response?.data?.message || "Failed to delete request.";
            alert(msg);
        }
    };

    if (loading) {
        return <div>Loading request details...</div>;
    }

    if (error) {
        return (
            <div>
                <p>{error}</p>
                <button onClick={() => navigate("/staff/dashboard")}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (!request) return null;

    const isGuest = requestType === "guest";

    return (
        <div style={{ padding: "20px" }}>
            <h1>Request Details</h1>

            <p>
                <strong>Tracking Number:</strong> {request.tracking_number}
            </p>

            <p>
                <strong>Request Type:</strong>{" "}
                {isGuest ? "Guest Request" : "Registered Resident Request"}
            </p>

            <p>
                <strong>Document:</strong>{" "}
                {request.document_type?.document_name || "Unknown"}
            </p>

            <p>
                <strong>Status:</strong> {request.status}
            </p>

            <p>
                <strong>Purpose:</strong> {request.purpose}
            </p>

            <hr />

            <h3>Requester Details</h3>

            {!isGuest && request.user && (
                <div>
                    <p>
                        <strong>Name:</strong> {request.user.first_name}{" "}
                        {request.user.last_name}
                    </p>
                    <p>
                        <strong>Email:</strong> {request.user.email}
                    </p>
                    <p>
                        <strong>Contact:</strong>{" "}
                        {request.user.contact_number || "N/A"}
                    </p>
                </div>
            )}

            {isGuest && (
                <div>
                    <p>
                        <strong>Name:</strong> {request.first_name}{" "}
                        {request.middle_name ? `${request.middle_name} ` : ""}
                        {request.last_name}
                    </p>
                    <p>
                        <strong>Birth Date:</strong> {request.birth_date}
                    </p>
                    <p>
                        <strong>Gender:</strong> {request.gender}
                    </p>
                    <p>
                        <strong>Civil Status:</strong> {request.civil_status}
                    </p>
                    <p>
                        <strong>Address:</strong> {request.address}
                    </p>
                    <p>
                        <strong>Contact Number:</strong> {request.contact_number}
                    </p>
                    <p>
                        <strong>Email:</strong> {request.email || "N/A"}
                    </p>
                    <p>
                        <strong>Valid ID Type:</strong> {request.valid_id_type}
                    </p>
                    {request.valid_id_image && (
                        <p>
                            <strong>Valid ID Image:</strong>{" "}
                            <a
                                href={`http://127.0.0.1:8000/storage/${request.valid_id_image}`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                View Submitted ID
                            </a>
                        </p>
                    )}
                </div>
            )}

            <hr />

            <h3>Timestamps & Remarks</h3>

            <p>
                <strong>Submitted:</strong>{" "}
                {new Date(request.created_at).toLocaleString()}
            </p>
            {request.approved_at && (
                <p>
                    <strong>Approved At:</strong>{" "}
                    {new Date(request.approved_at).toLocaleString()}
                </p>
            )}
            {request.ready_for_pickup_at && (
                <p>
                    <strong>Ready for Pickup At:</strong>{" "}
                    {new Date(request.ready_for_pickup_at).toLocaleString()}
                </p>
            )}
            {request.claimed_at && (
                <p>
                    <strong>Claimed/Completed At:</strong>{" "}
                    {new Date(request.claimed_at).toLocaleString()}
                </p>
            )}

            <div style={{ margin: "15px 0" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                    <strong>Remarks / Processing Notes:</strong>
                </label>
                <textarea
                    rows={3}
                    style={{ width: "100%", maxWidth: "500px" }}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter optional remarks before changing status"
                />
            </div>

            <div style={{ margin: "20px 0" }}>
                <h4>Actions</h4>

                {request.status === "Pending" && (
                    <>
                        <button
                            disabled={submitting}
                            onClick={() => handleStatusUpdate("Approved")}
                            style={{ marginRight: "10px" }}
                        >
                            Approve
                        </button>
                        <button
                            disabled={submitting}
                            onClick={() => handleStatusUpdate("Rejected")}
                            style={{ marginRight: "10px" }}
                        >
                            Reject
                        </button>
                    </>
                )}

                {request.status === "Approved" && (
                    <button
                        disabled={submitting}
                        onClick={() => handleStatusUpdate("Processing")}
                        style={{ marginRight: "10px" }}
                    >
                        Start Processing
                    </button>
                )}

                {request.status === "Processing" && (
                    <button
                        disabled={submitting}
                        onClick={() => handleStatusUpdate("Ready for Pickup")}
                        style={{ marginRight: "10px" }}
                    >
                        Ready for Pickup
                    </button>
                )}

                {request.status === "Ready for Pickup" && (
                    <button
                        disabled={submitting}
                        onClick={() => handleStatusUpdate("Completed")}
                        style={{ marginRight: "10px" }}
                    >
                        Mark Completed
                    </button>
                )}

                <button
                    disabled={submitting}
                    onClick={handleDelete}
                    style={{ marginRight: "10px", color: "red" }}
                >
                    Delete Request
                </button>
            </div>

            <button onClick={() => navigate("/staff/dashboard")}>
                Back to Dashboard
            </button>
        </div>
    );
}

export default StaffRequestDetails;
