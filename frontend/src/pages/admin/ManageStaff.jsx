import Icon from "../../components/ui/Icon.jsx";
import { useEffect, useState } from "react";
import { Table } from "../../components/ui/table";
import Button from "../../components/ui/Button";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import "./ManageStaff.css";

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
    const [fieldErrors, setFieldErrors] = useState({});
    const [formSuccess, setFormSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [busyStaffId, setBusyStaffId] = useState(null);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [actionError, setActionError] = useState("");
    const [actionSuccess, setActionSuccess] = useState("");
    const [confirmDialog, setConfirmDialog] = useState(null);

    const fetchStaff = async () => {
        try {
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
        let isActive = true;

        api.get("/admin/staff")
            .then((response) => {
                if (!isActive) return;
                setStaff(response.data.data || []);
                setError("");
            })
            .catch((err) => {
                if (!isActive) return;
                console.error(err);
                setError("Failed to load staff.");
            })
            .finally(() => {
                if (isActive) setLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, []);

    useEffect(() => {
        if (!formSuccess && !actionSuccess) return undefined;

        const timeout = window.setTimeout(() => {
            setFormSuccess("");
            setActionSuccess("");
        }, 4000);

        return () => window.clearTimeout(timeout);
    }, [formSuccess, actionSuccess]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
        setFormError("");
        setFieldErrors((previous) => {
            if (!previous[name]) return previous;
            const next = { ...previous };
            delete next[name];
            return next;
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setFormError("");
        setFieldErrors({});
        setFormSuccess("");
        setActionSuccess("");
        if (!validateForm(event.currentTarget)) return;

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
                const mappedErrors = Object.fromEntries(
                    Object.entries(errors).map(([field, messages]) => [
                        field,
                        messages[0],
                    ])
                );
                const firstField = Object.keys(mappedErrors)[0];
                setFieldErrors(mappedErrors);
                setFormError(
                    firstField
                        ? "Please review the highlighted fields."
                        : err.response.data.message ||
                              "Please check the form for errors."
                );
                if (firstField) {
                    document.getElementById(`staff-${firstField}`)?.focus();
                }
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

    const fieldErrorProps = (field) => ({
        "aria-invalid": Boolean(fieldErrors[field]),
        "aria-describedby": fieldErrors[field]
            ? `staff-${field}-error`
            : undefined,
    });

    const renderFieldError = (field) =>
        fieldErrors[field] ? (
            <div
                id={`staff-${field}-error`}
                className="staff-field-error"
                role="alert"
            >
                {fieldErrors[field]}
            </div>
        ) : null;

    const handleDelete = async (member) => {
        const name = fullName(member.user) || member.user?.username || "This staff member";
        setConfirmDialog({
            title: "Remove staff account",
            message: `${name} will lose access and be removed from the staff directory.`,
            confirmLabel: "Remove staff account",
            variant: "danger",
            onConfirm: () => runDelete(member, name),
        });
    };

    const runDelete = async (member, name) => {
        try {
            setBusyStaffId(member.staff_id);
            setActionError("");
            setActionSuccess("");
            await api.delete(`/admin/staff/${member.staff_id}`);
            setActionSuccess(`${name} was removed from the staff directory.`);
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

    const initials = (user) =>
        [user?.first_name?.[0], user?.last_name?.[0]]
            .filter(Boolean)
            .join("")
            .toUpperCase() || "S";

    const formatDate = (value) => {
        if (!value) return "Not provided";

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "Not provided";

        return new Intl.DateTimeFormat(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        }).format(date);
    };

    const today = new Date();
    const maxBirthDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
    ].join("-");

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
                    <header className="dashboard-page-header">
                        <div className="header-row-between-lg manage-staff-header-row">
                            <div>
                                <span className="section-label">PEOPLE AND ACCESS</span>
                                <h1>Manage Staff</h1>
                                <p>
                                    Manage the team members who process
                                    barangay service requests.
                                </p>
                            </div>
                            <Button
                                type="button"
                                className="app-button app-button-success staff-create-button"
                                onClick={() => {
                                    setShowForm((current) => !current);
                                    setFormError("");
                                    setFieldErrors({});
                                    setFormSuccess("");
                                    setActionError("");
                                    setActionSuccess("");
                                }}
                            >
                                {showForm
                                    ? "Close form"
                                    : "Create staff account"}
                            </Button>
                        </div>
                    </header>

                    {formSuccess && (
                        <div
                            className="app-alert app-alert-success staff-feedback"
                            role="status"
                            aria-live="polite"
                        >
                            {formSuccess}
                        </div>
                    )}

                    {actionSuccess && (
                        <div
                            className="app-alert app-alert-success staff-feedback"
                            role="status"
                        >
                            {actionSuccess}
                        </div>
                    )}

                    {actionError && (
                        <div
                            className="app-alert app-alert-danger staff-feedback"
                            role="alert"
                        >
                            {actionError}
                        </div>
                    )}

                    {showForm && (
                        <section className="dashboard-section staff-form-section">
                            <div className="admin-form-card staff-form-card">
                                <div className="staff-form-heading">
                                    <div>
                                        <span className="section-label">
                                            NEW TEAM MEMBER
                                        </span>
                                        <h2>New Staff Account</h2>
                                        <p>
                                            Enter the staff member's account
                                            and contact details.
                                        </p>
                                    </div>
                                </div>

                                {formError && (
                                    <div
                                        className="app-alert app-alert-danger staff-form-error"
                                        role="alert"
                                    >
                                        {formError}
                                    </div>
                                )}

                                <form noValidate onSubmit={handleSubmit}>
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                        <div className="md:col-span-6">
                                            <label
                                                className="app-label"
                                                htmlFor="staff-username"
                                            >
                                                Username *
                                            </label>
                                            <input
                                                type="text"
                                                id="staff-username"
                                                name="username"
                                                className="app-input"
                                                value={form.username}
                                                onChange={handleChange}
                                                maxLength={255}
                                                {...fieldErrorProps("username")}
                                                required
                                            />
                                            {renderFieldError("username")}
                                        </div>

                                        <div className="md:col-span-6">
                                            <label
                                                className="app-label"
                                                htmlFor="staff-password"
                                            >
                                                Password *
                                            </label>
                                            <input
                                                type="password"
                                                id="staff-password"
                                                name="password"
                                                className="app-input"
                                                value={form.password}
                                                onChange={handleChange}
                                                minLength={8}
                                                maxLength={255}
                                                {...fieldErrorProps("password")}
                                                required
                                            />
                                            {renderFieldError("password")}
                                        </div>

                                        <div className="md:col-span-4">
                                            <label
                                                className="app-label"
                                                htmlFor="staff-first_name"
                                            >
                                                First Name *
                                            </label>
                                            <input
                                                type="text"
                                                id="staff-first_name"
                                                name="first_name"
                                                className="app-input"
                                                value={form.first_name}
                                                onChange={handleChange}
                                                maxLength={255}
                                                {...fieldErrorProps("first_name")}
                                                required
                                            />
                                            {renderFieldError("first_name")}
                                        </div>

                                        <div className="md:col-span-4">
                                            <label
                                                className="app-label"
                                                htmlFor="staff-middle_name"
                                            >
                                                Middle Name
                                            </label>
                                            <input
                                                type="text"
                                                id="staff-middle_name"
                                                name="middle_name"
                                                className="app-input"
                                                value={form.middle_name}
                                                onChange={handleChange}
                                                maxLength={255}
                                                {...fieldErrorProps("middle_name")}
                                            />
                                            {renderFieldError("middle_name")}
                                        </div>

                                        <div className="md:col-span-4">
                                            <label
                                                className="app-label"
                                                htmlFor="staff-last_name"
                                            >
                                                Last Name *
                                            </label>
                                            <input
                                                type="text"
                                                id="staff-last_name"
                                                name="last_name"
                                                className="app-input"
                                                value={form.last_name}
                                                onChange={handleChange}
                                                maxLength={255}
                                                {...fieldErrorProps("last_name")}
                                                required
                                            />
                                            {renderFieldError("last_name")}
                                        </div>

                                        <div className="md:col-span-4">
                                            <label
                                                className="app-label"
                                                htmlFor="staff-birth_date"
                                            >
                                                Birth Date *
                                            </label>
                                            <input
                                                type="date"
                                                id="staff-birth_date"
                                                name="birth_date"
                                                className="app-input"
                                                value={form.birth_date}
                                                onChange={handleChange}
                                                max={maxBirthDate}
                                                data-validation-message="Birth date cannot be in the future."
                                                {...fieldErrorProps("birth_date")}
                                                required
                                            />
                                            {renderFieldError("birth_date")}
                                        </div>

                                        <div className="md:col-span-4">
                                            <label
                                                className="app-label"
                                                htmlFor="staff-gender"
                                            >
                                                Gender *
                                            </label>
                                            <select
                                                id="staff-gender"
                                                name="gender"
                                                className="app-select"
                                                value={form.gender}
                                                onChange={handleChange}
                                                {...fieldErrorProps("gender")}
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
                                            {renderFieldError("gender")}
                                        </div>

                                        <div className="md:col-span-4">
                                            <label
                                                className="app-label"
                                                htmlFor="staff-civil_status"
                                            >
                                                Civil Status *
                                            </label>
                                            <select
                                                id="staff-civil_status"
                                                name="civil_status"
                                                className="app-select"
                                                value={form.civil_status}
                                                onChange={handleChange}
                                                {...fieldErrorProps("civil_status")}
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
                                            {renderFieldError("civil_status")}
                                        </div>

                                        <div className="col-span-full">
                                            <label
                                                className="app-label"
                                                htmlFor="staff-address"
                                            >
                                                Address *
                                            </label>
                                            <input
                                                type="text"
                                                id="staff-address"
                                                name="address"
                                                className="app-input"
                                                value={form.address}
                                                onChange={handleChange}
                                                maxLength={255}
                                                {...fieldErrorProps("address")}
                                                required
                                            />
                                            {renderFieldError("address")}
                                        </div>

                                        <div className="md:col-span-6">
                                            <label
                                                className="app-label"
                                                htmlFor="staff-contact_number"
                                            >
                                                Contact Number *
                                            </label>
                                            <input
                                                type="tel"
                                                id="staff-contact_number"
                                                name="contact_number"
                                                className="app-input"
                                                value={form.contact_number}
                                                onChange={handleChange}
                                                maxLength={20}
                                                {...fieldErrorProps("contact_number")}
                                                required
                                            />
                                            {renderFieldError("contact_number")}
                                        </div>

                                        <div className="md:col-span-6">
                                            <label
                                                className="app-label"
                                                htmlFor="staff-email"
                                            >
                                                Email *
                                            </label>
                                            <input
                                                type="email"
                                                id="staff-email"
                                                name="email"
                                                className="app-input"
                                                value={form.email}
                                                onChange={handleChange}
                                                maxLength={255}
                                                {...fieldErrorProps("email")}
                                                required
                                            />
                                            {renderFieldError("email")}
                                        </div>
                                    </div>

                                    <div className="form-actions staff-form-actions">
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
                                                setFieldErrors({});
                                                setFormSuccess("");
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
                        <div className="admin-filters filter-bar filter-row staff-toolbar">
                            <label className="staff-search">
                                <span className="staff-search-icon" aria-hidden="true" />
                                <input
                                    type="search"
                                    className="app-input"
                                    placeholder="Search staff by name, username, or email"
                                    aria-label="Search staff"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                />
                            </label>

                            <div className="staff-result-count" aria-live="polite">
                                Showing <strong>{filtered.length}</strong> of{" "}
                                <strong>{staff.length}</strong> staff{" "}
                                {staff.length === 1 ? "member" : "members"}
                            </div>
                        </div>
                    </section>

                    <section className="dashboard-section">
                        {filtered.length === 0 ? (
                            <div className="dashboard-empty-state staff-empty-state">
                                <div
                                    className="dashboard-empty-icon"
                                    aria-hidden="true"
                                >
                                    <Icon name="person-workspace" />
                                </div>
                                <h3>
                                    {search
                                        ? "No matching staff"
                                        : "No staff accounts yet"}
                                </h3>
                                <p>
                                    {search
                                        ? "Try another name, username, or email address."
                                        : "Create a staff account to give a team member access to process requests."}
                                </p>
                            </div>
                        ) : (
                            <div className="table-scroll admin-table-wrapper u-scroll-x staff-table-wrapper">
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
                                            <th scope="col">Staff member</th>
                                            <th scope="col">Username</th>
                                            <th scope="col">Email address</th>
                                            <th scope="col">Contact</th>
                                            <th scope="col">Assigned by</th>
                                            <th scope="col">Date added</th>
                                            <th scope="col">Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filtered.map((member) => (
                                            <tr key={member.staff_id}>
                                                <td>
                                                    <div className="staff-person-cell">
                                                        <span
                                                            className="staff-avatar"
                                                            aria-hidden="true"
                                                        >
                                                            {initials(member.user)}
                                                        </span>
                                                        <div className="staff-person-details">
                                                            <strong>
                                                                {fullName(
                                                                    member.user
                                                                ) || "Unknown staff"}
                                                            </strong>
                                                            <span>
                                                                {member.user
                                                                    ?.address ||
                                                                    "Address not provided"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="staff-username">
                                                        {member.user?.username ||
                                                            "Not provided"}
                                                    </span>
                                                </td>
                                                <td>
                                                    {member.user?.email ||
                                                        "Not provided"}
                                                </td>
                                                <td>
                                                    {member.user?.contact_number ||
                                                        "Not provided"}
                                                </td>
                                                <td>
                                                    {member.assigned_by_name ||
                                                        "System administrator"}
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
                                                    {busyStaffId === member.staff_id
                                                        ? "Removing..."
                                                        : "Remove"}
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
