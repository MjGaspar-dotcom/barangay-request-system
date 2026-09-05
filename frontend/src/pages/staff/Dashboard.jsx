import { useEffect, useState } from "react";
import api from "../../services/api";

export default function StaffDashboard() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("all");
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        processing: 0,
        ready: 0,
        completed: 0,
        rejected: 0,
    });

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get("/staff/requests");
            const data = response.data.data || [];
            setRequests(data);
            calculateStats(data);
        } catch (error) {
            console.error(error);
            setError("Failed to load requests.");
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const newStats = {
            total: data.length,
            pending: 0,
            approved: 0,
            processing: 0,
            ready: 0,
            completed: 0,
            rejected: 0,
        };
        data.forEach((req) => {
            const status = (req.status || "").toLowerCase();
            if (status === "pending") newStats.pending++;
            else if (status === "approved") newStats.approved++;
            else if (status === "processing") newStats.processing++;
            else if (status === "ready for pickup") newStats.ready++;
            else if (status === "completed") newStats.completed++;
            else if (status === "rejected") newStats.rejected++;
        });
        setStats(newStats);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const getEndpoint = (request) => {
        const id = request.request_id || request.guest_request_id;
        return request.request_type === "guest"
            ? `/guest-requests/${id}`
            : `/barangay-requests/${id}`;
    };

    const getRequesterName = (request) => {
        if (request.request_type === "registered" && request.user) {
            return `${request.user.first_name} ${request.user.last_name}`;
        }
        if (request.request_type === "guest") {
            const g = request.guest || request;
            if (g.first_name) {
                return `${g.first_name} ${g.last_name}`;
            }
        }
        return "Unknown";
    };

    const getValidIdImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        return `http://127.0.0.1:8000/storage/${path}`;
    };

    const handleStatusUpdate = async (request, newStatus) => {
        const confirmAction = window.confirm(
            `Are you sure you want to change status to "${newStatus}"?`
        );
        if (!confirmAction) return;

        try {
            await api.put(getEndpoint(request), { status: newStatus });
            alert(`Request status updated to ${newStatus}.`);
            fetchRequests();
        } catch (err) {
            console.error("Failed to update status:", err);
            const msg = err.response?.data?.message || "Failed to update status.";
            alert(msg);
        }
    };

    const handleDelete = async (request) => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete tracking number ${request.tracking_number}?`
        );
        if (!confirmDelete) return;

        try {
            await api.delete(getEndpoint(request));
            alert("Request deleted successfully.");
            fetchRequests();
        } catch (err) {
            console.error("Failed to delete request:", err);
            const msg = err.response?.data?.message || "Failed to delete request.";
            alert(msg);
        }
    };

    const filteredRequests = requests.filter((req) => {
        if (filter === "all") return true;
        return (req.status || "").toLowerCase() === filter.toLowerCase();
    });

    if (loading) {
        return <div>Loading requests...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    const statCards = [
        { label: "Total", value: stats.total, color: "#14532d" },
        { label: "Pending", value: stats.pending, color: "#f59e0b" },
        { label: "Approved", value: stats.approved, color: "#3b82f6" },
        { label: "Processing", value: stats.processing, color: "#8b5cf6" },
        { label: "Ready", value: stats.ready, color: "#10b981" },
        { label: "Completed", value: stats.completed, color: "#16a34a" },
        { label: "Rejected", value: stats.rejected, color: "#dc2626" },
    ];

    return (
        <div className="admin-dashboard">
            <div className="container-fluid">
                <div className="dashboard-page-header">
                    <div>
                        <span className="section-label">STAFF PANEL</span>
                        <h1>Staff Dashboard</h1>
                        <p>
                            Process document requests from residents and guests.
                            Approve, reject, and track status updates here.
                        </p>
                    </div>
                </div>

                <section className="dashboard-section">
                    <div className="row g-3">
                        {statCards.map((s) => (
                            <div className="col-sm-6 col-md-4 col-xl" key={s.label}>
                                <div className="dashboard-stat-card">
                                    <div
                                        className="dashboard-stat-icon"
                                        style={{ backgroundColor: s.color + "22", color: s.color }}
                                    >
                                        {s.label[0]}
                                    </div>
                                    <div>
                                        <span className="dashboard-stat-label">{s.label}</span>
                                        <strong className="dashboard-stat-value">{s.value}</strong>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="dashboard-section">
                    <div className="dashboard-page-header" style={{ padding: "20px" }}>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            {["all", "pending", "approved", "processing", "ready for pickup", "completed", "rejected"].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`btn ${filter === f ? "btn-success" : "btn-outline-secondary"}`}
                                    style={{ textTransform: "capitalize" }}
                                >
                                    {f === "ready for pickup" ? "Ready" : f}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="dashboard-section">
                    {filteredRequests.length === 0 ? (
                        <div className="dashboard-empty-state">
                            <div className="dashboard-empty-icon">📭</div>
                            <h3>No Requests Found</h3>
                            <p>There are no requests matching this filter.</p>
                        </div>
                    ) : (
                        <div className="row g-3">
                            {filteredRequests.map((request) => {
                                const reqId = request.request_id || request.guest_request_id;
                                const reqType = request.request_type || "registered";
                                const idImage = request.guest?.valid_id_image;

                                return (
                                    <div className="col-12" key={`${reqType}-${reqId}`}>
                                        <div className="admin-management-card">
                                            <div className="admin-management-icon">
                                                {reqType === "registered" ? "👤" : "🧑"}
                                            </div>

                                            <div className="admin-management-content">
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                                                    <div>
                                                        <h3 style={{ marginBottom: "4px" }}>
                                                            {getRequesterName(request)}
                                                        </h3>
                                                        <p style={{ marginBottom: "8px", fontSize: "13px" }}>
                                                            <strong>{request.tracking_number}</strong>
                                                            {" • "}
                                                            <span style={{ textTransform: "capitalize" }}>{reqType}</span>
                                                            {" • "}
                                                            {request.document_type?.document_name || "Unknown"}
                                                        </p>
                                                    </div>
                                                    <span
                                                        style={{
                                                            padding: "4px 10px",
                                                            borderRadius: "12px",
                                                            backgroundColor: "#e5e7eb",
                                                            fontSize: "12px",
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {request.status}
                                                    </span>
                                                </div>

                                                <p style={{ fontSize: "14px", margin: "8px 0" }}>
                                                    <strong>Purpose:</strong> {request.purpose || "—"}
                                                </p>

                                                {idImage && (
                                                    <div style={{ marginBottom: "10px" }}>
                                                        <strong style={{ fontSize: "13px" }}>Valid ID:</strong>{" "}
                                                        <a
                                                            href={getValidIdImageUrl(idImage)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            style={{ color: "#166534", fontWeight: 600 }}
                                                        >
                                                            View uploaded ID
                                                        </a>
                                                    </div>
                                                )}

                                                <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "12px" }}>
                                                    Submitted: {new Date(request.created_at).toLocaleString()}
                                                </p>

                                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                                    {request.status === "Pending" && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusUpdate(request, "Approved")}
                                                                className="btn btn-success btn-sm"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(request, "Rejected")}
                                                                className="btn btn-danger btn-sm"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}

                                                    {request.status === "Approved" && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(request, "Processing")}
                                                            className="btn btn-primary btn-sm"
                                                        >
                                                            Start Processing
                                                        </button>
                                                    )}

                                                    {request.status === "Processing" && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(request, "Ready for Pickup")}
                                                            className="btn btn-info btn-sm"
                                                        >
                                                            Ready for Pickup
                                                        </button>
                                                    )}

                                                    {request.status === "Ready for Pickup" && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(request, "Completed")}
                                                            className="btn btn-success btn-sm"
                                                        >
                                                            Mark Completed
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleDelete(request)}
                                                        className="btn btn-outline-danger btn-sm"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
