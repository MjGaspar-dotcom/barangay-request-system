import Icon from "../../components/ui/Icon.jsx";
import { useEffect, useState } from "react";
import { Table } from "../../components/ui/table";
import Button from "../../components/ui/Button";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import SkeletonLoader from "../../components/ui/SkeletonLoader";

import { validateForm } from "../../utils/validateForm";
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
    const [actionError, setActionError] = useState("");
    const [confirmDialog, setConfirmDialog] = useState(null);

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

        if (!validateForm(event.currentTarget)) return;
        setFormError("");
        setFormSuccess("");

        try {
            setSubmitting(true);
            await api.post("/admin/staff", form);

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
        setConfirmDialog({
            title: "Remove staff account",
            message: `Remove staff account for ${member.user?.first_name} ${member.user?.last_name}? This will also delete the underlying user account.`,
            confirmLabel: "Remove staff account",
            variant: "danger",
            onConfirm: () => runDelete(member),
        });
    };

    const runDelete = async (member) => {
        try {
            setBusyStaffId(member.staff_id);
            await api.delete(`/admin/staff/${member.staff_id}`);
            await fetchStaff();
        } catch (err) {
            console.error(err);
            setActionError(
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
                <SkeletonLoader label="Loading staff" variant="table" />
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="page-loading">
                    <div className="app-alert app-alert-danger" role="alert">{error}</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-dashboard manage-staff-page">
                <div className="w-full">
                    <div className="dashboard-page-header">
                        <div className="header-row-between-lg manage-staff-header-row">
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

                            <Button
                                type="button"
                                className="app-button app-button-success staff-create-button"
                                onClick={() => {
                                    setShowForm((current) => !current);
                                    setFormError("");
                                    setFormSuccess("");
                                }}
                            >
                                {showForm ? "Close Form" : "＋ Create Staff"}
                            </Button>
                        </div>
                    </div>

                    {formSuccess && (
                        <div
                            className="app-alert app-alert-success"
                            role="alert"
                        >
                            {formSuccess}
                        </div>
                    )}

                    {formError && (
                        <div className="app-alert app-alert-danger" role="alert">
                            {formError}
                        </div>
                    )}

                    {actionError && (
                        <div className="app-alert app-alert-danger" role="alert">
                            {actionError}
                        </div>
                    )}

                    {showForm && (
                        <section className="dashboard-section">
                            <div className="admin-form-card">
                                <h3 className="section-title-spaced"
                                    
                                >
                                    New Staff Account
                                </h3>

                                <form noValidate onSubmit={handleSubmit}>
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                        <div className="md:col-span-6">
                                            <label className="app-label">
                                                Username *
                                            </label>
                                            <input
                                                type="text"
                                                name="username"
                                                className="app-input"
                                                value={form.username}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="md:col-span-6">
                                            <label className="app-label">
                                                Password *
                                            </label>
                                            <input
                                                type="password"
                                                name="password"
                                                className="app-input"
                                                value={form.password}
                                                onChange={handleChange}
                                                minLength={8}
                                                required
                                            />
                                        </div>

                                        <div className="md:col-span-4">
                                            <label className="app-label">
                                                First Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="first_name"
                                                className="app-input"
                                                value={form.first_name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="md:col-span-4">
                                            <label className="app-label">
                                                Middle Name
                                            </label>
                                            <input
                                                type="text"
                                                name="middle_name"
                                                className="app-input"
                                                value={form.middle_name}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="md:col-span-4">
                                            <label className="app-label">
                                                Last Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="last_name"
                                                className="app-input"
                                                value={form.last_name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="md:col-span-4">
                                            <label className="app-label">
                                                Birth Date *
                                            </label>
                                            <input
                                                type="date"
                                                name="birth_date"
                                                className="app-input"
                                                value={form.birth_date}
                                                onChange={handleChange}
                                                max={new Date()
                                                    .toISOString()
                                                    .slice(0, 10)}
                                                required
                                            />
                                        </div>

                                        <div className="md:col-span-4">
                                            <label className="app-label">
                                                Gender *
                                            </label>
                                            <select
                                                name="gender"
                                                className="app-select"
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

                                        <div className="md:col-span-4">
                                            <label className="app-label">
                                                Civil Status *
                                            </label>
                                            <select
                                                name="civil_status"
                                                className="app-select"
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

                                        <div className="col-span-full">
                                            <label className="app-label">
                                                Address *
                                            </label>
                                            <input
                                                type="text"
                                                name="address"
                                                className="app-input"
                                                value={form.address}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="md:col-span-6">
                                            <label className="app-label">
                                                Contact Number *
                                            </label>
                                            <input
                                                type="text"
                                                name="contact_number"
                                                className="app-input"
                                                value={form.contact_number}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="md:col-span-6">
                                            <label className="app-label">
                                                Email *
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                className="app-input"
                                                value={form.email}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-actions"
                                        
                                    >
                                        <Button
                                            type="submit"
                                            className="app-button app-button-success"
                                            disabled={submitting}
                                            loading={submitting}
                                            loadingLabel="Creating staff account"
                                        >
                                            Create Staff Account
                                        </Button>

                                        <Button
                                            type="button"
                                            className="app-button app-button-outline-secondary"
                                            onClick={() => {
                                                setForm(EMPTY_FORM);
                                                setFormError("");
                                                setShowForm(false);
                                            }}
                                            disabled={submitting}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </section>
                    )}

                    <section className="dashboard-section">
                        <div
                            className="admin-filters filter-bar filter-row"
                            
                        >
                            <input
                                type="search"
                                className="app-input filter-search-360"
                                placeholder="Search by name, username, email..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                
                            />

                            <div className="filter-count"
                                
                            >
                                Showing {filtered.length} of {staff.length}{" "}
                                staff
                            </div>
                        </div>
                    </section>

                    <section className="dashboard-section">
                        {filtered.length === 0 ? (
                            <div className="dashboard-empty-state">
                                <div className="dashboard-empty-icon" aria-hidden="true">
                                    <Icon name="person-workspace" />
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
                                                    <div className="text-muted-sm"
                                                        
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
                                                    <Button
                                                        type="button"
                                                        className="app-button app-button-outline-danger app-button-sm"
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
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </section>
                </div>
            </div>
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
        </AdminLayout>
    );
}
