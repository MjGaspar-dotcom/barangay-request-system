import { useEffect, useState } from "react";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";

const EMPTY_FORM = {
    username: "",
    password: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    birth_date: "",
    gender: "Male",
    civil_status: "Single",
    address: "",
    contact_number: "",
    email: "",
};

export default function ManageStaff() {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [form, setForm] = useState(EMPTY_FORM);
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [busyStaffId, setBusyStaffId] = useState(null);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const response = await api.get("/admin/staff");
            setStaff(response.data.data || []);
            setError("");
        } catch (err) {
            console.error(err);
            setError("Failed to load staff.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError("");
        setFormSuccess("");

        try {
            setSubmitting(true);
            const response = await api.post("/admin/staff", form);

            setFormSuccess(
                `Staff account for ${form.first_name} ${form.last_name} created successfully.`
            );
            setForm(EMPTY_FORM);
            setShowForm(false);
            await fetchStaff();
        } catch (err) {
            console.error(err);
            if (err.response?.status === 422) {
                const errors = err.response.data.errors || {};
                const firstKey = Object.keys(errors)[0];
                setFormError(
                    firstKey
                        ? errors[firstKey][0]
                        : "Please check the form for errors."
                );
            } else {
                setFormError(
                    err.response?.data?.message ||
                        "Failed to create staff account."
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (member) => {
        const confirmDelete = window.confirm(
            `Remove staff account for ${member.user?.first_name} ${member.user?.last_name}? This will also delete the underlying user account.`
        );
        if (!confirmDelete) return;

        try {
            setBusyStaffId(member.staff_id);
            await api.delete(`/admin/staff/${member.staff_id}`);
            await fetchStaff();
        } catch (err) {
            console.error(err);
            alert(
                err.response?.data?.message ||
                    "Failed to remove staff account."
            );
        } finally {
            setBusyStaffId(null);
        }
    };

    const filtered = staff.filter((member) => {
        if (!search) return true;
        const needle = search.toLowerCase();
        const u = member.user || {};
        return [
            u.first_name,
            u.last_name,
            u.username,
            u.email,
            u.contact_number,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(needle);
    });

    const fullName = (user) =>
        [user?.first_name, user?.middle_name, user?.last_name]
            .filter(Boolean)
            .join(" ");

    const formatDate = (value) =>
        value ? new Date(value).toLocaleString() : "—";

    if (loading) {
        return (
            <AdminLayout>
                <div className="page-loading">
                    <div
                        className="spinner-border text-success"
                        role="status"
                    >
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading staff...</p>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="page-loading">
                    <p>{error}</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-dashboard">
                <div className="container-fluid">
                    <div className="dashboard-page-header">
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                flexWrap: "wrap",
                                gap: "12px",
                            }}
                        >
                            <div>
                                <span className="section-label">
                                    STAFF MANAGEMENT
                                </span>

                                <h1>Manage Staff</h1>

                                <p>
                                    Create staff accounts and assign personnel
                                    to process barangay document requests.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={() => {
                                    setShowForm((current) => !current);
                                    setFormError("");
                                    setFormSuccess("");
                                }}
                            >
                                {showForm ? "Close Form" : "＋ Create Staff"}
                            </button>
                        </div>
                    </div>

                    {formSuccess && (
                        <div
                            className="alert alert-success"
                            role="alert"
                        >
                            {formSuccess}
                        </div>
                    )}

                    {formError && (
                        <div className="alert alert-danger" role="alert">
                            {formError}
                        </div>
                    )}

                    {showForm && (
                        <section className="dashboard-section">
                            <div className="admin-form-card">
                                <h3
                                    style={{
                                        marginBottom: "20px",
                                        color: "#14532d",
                                    }}
                                >
                                    New Staff Account
                                </h3>

                                <form onSubmit={handleSubmit}>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Username *
                                            </label>
                                            <input
                                                type="text"
                                                name="username"
                                                className="form-control"
                                                value={form.username}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Password *
                                            </label>
                                            <input
                                                type="password"
                                                name="password"
                                                className="form-control"
                                                value={form.password}
                                                onChange={handleChange}
                                                minLength={8}
                                                required
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label">
                                                First Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="first_name"
                                                className="form-control"
                                                value={form.first_name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label">
                                                Middle Name
                                            </label>
                                            <input
                                                type="text"
                                                name="middle_name"
                                                className="form-control"
                                                value={form.middle_name}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label">
                                                Last Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="last_name"
                                                className="form-control"
                                                value={form.last_name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label">
                                                Birth Date *
                                            </label>
                                            <input
                                                type="date"
                                                name="birth_date"
                                                className="form-control"
                                                value={form.birth_date}
                                                onChange={handleChange}
                                                max={new Date()
                                                    .toISOString()
                                                    .slice(0, 10)}
                                                required
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label">
                                                Gender *
                                            </label>
                                            <select
                                                name="gender"
                                                className="form-select"
                                                value={form.gender}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="Male">
                                                    Male
                                                </option>
                                                <option value="Female">
                                                    Female
                                                </option>
                                                <option value="Prefer not to say">
                                                    Prefer not to say
                                                </option>
                                            </select>
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label">
                                                Civil Status *
                                            </label>
                                            <select
                                                name="civil_status"
                                                className="form-select"
                                                value={form.civil_status}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="Single">
                                                    Single
                                                </option>
                                                <option value="Married">
                                                    Married
                                                </option>
                                                <option value="Separated">
                                                    Separated
                                                </option>
                                                <option value="Divorced">
                                                    Divorced
                                                </option>
                                                <option value="Widowed">
                                                    Widowed
                                                </option>
                                            </select>
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label">
                                                Address *
                                            </label>
                                            <input
                                                type="text"
                                                name="address"
                                                className="form-control"
                                                value={form.address}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Contact Number *
                                            </label>
                                            <input
                                                type="text"
                                                name="contact_number"
                                                className="form-control"
                                                value={form.contact_number}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Email *
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                className="form-control"
                                                value={form.email}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            marginTop: "20px",
                                            display: "flex",
                                            gap: "10px",
                                        }}
                                    >
                                        <button
                                            type="submit"
                                            className="btn btn-success"
                                            disabled={submitting}
                                        >
                                            {submitting
                                                ? "Creating..."
                                                : "Create Staff Account"}
                                        </button>

                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => {
                                                setForm(EMPTY_FORM);
                                                setFormError("");
                                                setShowForm(false);
                                            }}
                                            disabled={submitting}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </section>
                    )}

                    <section className="dashboard-section">
                        <div
                            className="admin-filters"
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "12px",
                                alignItems: "center",
                            }}
                        >
                            <input
                                type="search"
                                className="form-control"
                                placeholder="Search by name, username, email..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                style={{ maxWidth: "360px", flex: "1 1 280px" }}
                            />

                            <div
                                style={{
                                    marginLeft: "auto",
                                    color: "#6b7280",
                                    fontSize: "14px",
                                }}
                            >
                                Showing {filtered.length} of {staff.length}{" "}
                                staff
                            </div>
                        </div>
                    </section>

                    <section className="dashboard-section">
                        {filtered.length === 0 ? (
                            <div className="dashboard-empty-state">
                                <div className="dashboard-empty-icon">
                                    🧑‍💼
                                </div>
                                <h3>No Staff Found</h3>
                                <p>
                                    No staff accounts match the current
                                    filters. Use the "Create Staff" button to
                                    add a new staff member.
                                </p>
                            </div>
                        ) : (
                            <div
                                className="admin-table-wrapper"
                                style={{ overflowX: "auto" }}
                            >
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Username</th>
                                            <th>Email</th>
                                            <th>Contact</th>
                                            <th>Assigned By</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filtered.map((member) => (
                                            <tr key={member.staff_id}>
                                                <td>
                                                    <strong>
                                                        {fullName(
                                                            member.user
                                                        )}
                                                    </strong>
                                                    <div
                                                        style={{
                                                            fontSize: "12px",
                                                            color: "#6b7280",
                                                        }}
                                                    >
                                                        {member.user?.address ||
                                                            "—"}
                                                    </div>
                                                </td>
                                                <td>
                                                    {member.user?.username}
                                                </td>
                                                <td>
                                                    {member.user?.email}
                                                </td>
                                                <td>
                                                    {member.user
                                                        ?.contact_number || "—"}
                                                </td>
                                                <td>
                                                    {member.assigned_by_name ||
                                                        "—"}
                                                </td>
                                                <td>
                                                    {formatDate(
                                                        member.created_at
                                                    )}
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger btn-sm"
                                                        disabled={
                                                            busyStaffId ===
                                                            member.staff_id
                                                        }
                                                        onClick={() =>
                                                            handleDelete(
                                                                member
                                                            )
                                                        }
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}
