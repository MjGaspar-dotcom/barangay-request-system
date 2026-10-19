import { useEffect, useState } from "react";
<<<<<<< HEAD
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";

=======
import Table from "react-bootstrap/Table";
import Button from "../../components/ui/Button";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

import { validateForm } from "../../utils/validateForm";
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
=======
    const [actionError, setActionError] = useState("");
    const [confirmDialog, setConfirmDialog] = useState(null);
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c

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
<<<<<<< HEAD
=======

        if (!validateForm(event.currentTarget)) return;
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
        setFormError("");
        setFormSuccess("");

        try {
            setSubmitting(true);
<<<<<<< HEAD
            const response = await api.post("/admin/staff", form);
=======
            await api.post("/admin/staff", form);
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c

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
<<<<<<< HEAD
        const confirmDelete = window.confirm(
            `Remove staff account for ${member.user?.first_name} ${member.user?.last_name}? This will also delete the underlying user account.`
        );
        if (!confirmDelete) return;

=======
        setConfirmDialog({
            title: "Remove staff account",
            message: `Remove staff account for ${member.user?.first_name} ${member.user?.last_name}? This will also delete the underlying user account.`,
            confirmLabel: "Remove staff account",
            variant: "danger",
            onConfirm: () => runDelete(member),
        });
    };

    const runDelete = async (member) => {
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
        try {
            setBusyStaffId(member.staff_id);
            await api.delete(`/admin/staff/${member.staff_id}`);
            await fetchStaff();
        } catch (err) {
            console.error(err);
<<<<<<< HEAD
            alert(
=======
            setActionError(
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
                    <p>{error}</p>
=======
                    <div className="alert alert-danger" role="alert">{error}</div>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
<<<<<<< HEAD
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
=======
            <div className="admin-dashboard manage-staff-page">
                <div className="container-fluid">
                    <div className="dashboard-page-header">
                        <div className="header-row-between-lg manage-staff-header-row">
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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

<<<<<<< HEAD
                            <button
                                type="button"
                                className="btn btn-success"
=======
                            <Button
                                type="button"
                                className="btn btn-success staff-create-button"
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                onClick={() => {
                                    setShowForm((current) => !current);
                                    setFormError("");
                                    setFormSuccess("");
                                }}
                            >
                                {showForm ? "Close Form" : "＋ Create Staff"}
<<<<<<< HEAD
                            </button>
=======
                            </Button>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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

<<<<<<< HEAD
                    {showForm && (
                        <section className="dashboard-section">
                            <div className="admin-form-card">
                                <h3
                                    style={{
                                        marginBottom: "20px",
                                        color: "#14532d",
                                    }}
=======
                    {actionError && (
                        <div className="alert alert-danger" role="alert">
                            {actionError}
                        </div>
                    )}

                    {showForm && (
                        <section className="dashboard-section">
                            <div className="admin-form-card">
                                <h3 className="section-title-spaced"
                                    
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                >
                                    New Staff Account
                                </h3>

<<<<<<< HEAD
                                <form onSubmit={handleSubmit}>
=======
                                <form noValidate onSubmit={handleSubmit}>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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

<<<<<<< HEAD
                                    <div
                                        style={{
                                            marginTop: "20px",
                                            display: "flex",
                                            gap: "10px",
                                        }}
                                    >
                                        <button
=======
                                    <div className="form-actions"
                                        
                                    >
                                        <Button
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                            type="submit"
                                            className="btn btn-success"
                                            disabled={submitting}
                                        >
                                            {submitting
                                                ? "Creating..."
                                                : "Create Staff Account"}
<<<<<<< HEAD
                                        </button>

                                        <button
=======
                                        </Button>

                                        <Button
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
                                        </button>
=======
                                        </Button>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                    </div>
                                </form>
                            </div>
                        </section>
                    )}

                    <section className="dashboard-section">
                        <div
<<<<<<< HEAD
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
=======
                            className="admin-filters filter-bar filter-row"
                            
                        >
                            <input
                                type="search"
                                className="form-control filter-search-360"
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                placeholder="Search by name, username, email..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
<<<<<<< HEAD
                                style={{ maxWidth: "360px", flex: "1 1 280px" }}
                            />

                            <div
                                style={{
                                    marginLeft: "auto",
                                    color: "#6b7280",
                                    fontSize: "14px",
                                }}
=======
                                
                            />

                            <div className="filter-count"
                                
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                            >
                                Showing {filtered.length} of {staff.length}{" "}
                                staff
                            </div>
                        </div>
                    </section>

                    <section className="dashboard-section">
                        {filtered.length === 0 ? (
                            <div className="dashboard-empty-state">
<<<<<<< HEAD
                                <div className="dashboard-empty-icon">
                                    🧑‍💼
=======
                                <div className="dashboard-empty-icon" aria-hidden="true">
                                    <i className="bi bi-person-workspace" />
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
                                className="admin-table-wrapper"
                                style={{ overflowX: "auto" }}
                            >
                                <table className="admin-table">
=======
                                className="table-scroll admin-table-wrapper u-scroll-x"
                                
                            >
                                <Table className="admin-table data-table manage-staff-table">
                                    <colgroup>
                                        <col className="staff-name-column" />
                                        <col className="staff-username-column" />
                                        <col className="staff-email-column" />
                                        <col className="staff-contact-column" />
                                        <col className="staff-assigned-column" />
                                        <col className="staff-created-column" />
                                        <col className="staff-actions-column" />
                                    </colgroup>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
                                                    <div
                                                        style={{
                                                            fontSize: "12px",
                                                            color: "#6b7280",
                                                        }}
=======
                                                    <div className="text-muted-sm"
                                                        
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
                                                    <button
=======
                                                    <Button
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
                                                    </button>
=======
                                                    </Button>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
<<<<<<< HEAD
                                </table>
=======
                                </Table>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                            </div>
                        )}
                    </section>
                </div>
            </div>
<<<<<<< HEAD
=======
            <ConfirmDialog
                isOpen={Boolean(confirmDialog)}
                onClose={() => setConfirmDialog(null)}
                onConfirm={() => {
                    const action = confirmDialog?.onConfirm;
                    setConfirmDialog(null);
                    action?.();
                }}
                title={confirmDialog?.title}
                confirmLabel={confirmDialog?.confirmLabel}
                variant={confirmDialog?.variant}
            >
                {confirmDialog?.message}
            </ConfirmDialog>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
        </AdminLayout>
    );
}
