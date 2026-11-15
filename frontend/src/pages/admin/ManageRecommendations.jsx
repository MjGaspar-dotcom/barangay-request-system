import { useEffect, useMemo, useState } from "react";
import { Table } from "../../components/ui/table";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Icon from "../../components/ui/Icon";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import AdminLayout from "../../layouts/AdminLayout";
import api from "../../services/api";

const CATEGORIES = [
    { value: "program", label: "Barangay program" },
    { value: "service", label: "Service" },
    { value: "announcement", label: "Announcement" },
    { value: "activity", label: "Activity" },
    { value: "government_assistance", label: "Government assistance" },
];

const ELIGIBLE_GENDERS = ["Male", "Female", "Prefer not to say"];
const ELIGIBLE_CIVIL_STATUSES = [
    "Single",
    "Married",
    "Widowed",
    "Separated",
];

const EMPTY_FORM = {
    title: "",
    description: "",
    category: "program",
    eligibility: "",
    min_age: "",
    max_age: "",
    eligible_genders: [],
    eligible_civil_statuses: [],
    requires_verified: false,
    priority: 0,
    starts_at: "",
    ends_at: "",
    is_active: true,
};

function ageRange(item) {
    if (item.min_age == null && item.max_age == null) return "All ages";
    if (item.min_age == null) return `Up to ${item.max_age}`;
    if (item.max_age == null) return `${item.min_age}+`;
    return `${item.min_age}–${item.max_age}`;
}

function toPayload(form) {
    return {
        ...form,
        min_age: form.min_age === "" ? null : Number(form.min_age),
        max_age: form.max_age === "" ? null : Number(form.max_age),
        eligible_genders: form.eligible_genders?.length
            ? form.eligible_genders
            : null,
        eligible_civil_statuses: form.eligible_civil_statuses?.length
            ? form.eligible_civil_statuses
            : null,
        requires_verified: Boolean(form.requires_verified),
        priority: Number(form.priority),
        eligibility: form.eligibility.trim() || null,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
    };
}

export default function ManageRecommendations() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formError, setFormError] = useState("");
    const [actionMessage, setActionMessage] = useState("");
    const [actionIsError, setActionIsError] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await api.get("/admin/recommendations");
            if (!Array.isArray(response.data?.data)) {
                throw new Error("Unexpected recommendation catalog response.");
            }
            setItems(response.data.data);
            setError("");
        } catch (requestError) {
            console.error(requestError);
            setError(
                requestError.response?.data?.message ||
                    "Failed to load the recommendation catalog.",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const loadItems = async () => {
            try {
                const response = await api.get("/admin/recommendations");
                if (!Array.isArray(response.data?.data)) {
                    throw new Error(
                        "Unexpected recommendation catalog response.",
                    );
                }
                if (!cancelled) {
                    setItems(response.data.data);
                    setError("");
                }
            } catch (requestError) {
                console.error(requestError);
                if (!cancelled) {
                    setError(
                        requestError.response?.data?.message ||
                            "Failed to load the recommendation catalog.",
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadItems();
        return () => {
            cancelled = true;
        };
    }, []);

    const filteredItems = useMemo(() => {
        const needle = search.trim().toLowerCase();
        if (!needle) return items;
        return items.filter((item) =>
            [item.title, item.description, item.category, item.eligibility]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(needle),
        );
    }, [items, search]);

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowForm(false);
        setFormError("");
    };

    const handleChange = (event) => {
        const { name, type, value, checked } = event.target;
        setForm((current) => ({
            ...current,
            [name]:
                type === "checkbox"
                    ? checked
                    : type === "select-multiple"
                      ? Array.from(
                            event.target.selectedOptions,
                            (option) => option.value,
                        )
                    : name === "priority"
                      ? Number(value)
                      : value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError("");
        setSubmitting(true);

        try {
            const payload = toPayload(form);
            if (editingId == null) {
                await api.post("/admin/recommendations", payload);
                setActionMessage("Recommendation created.");
            } else {
                await api.put(`/admin/recommendations/${editingId}`, payload);
                setActionMessage("Recommendation updated.");
            }
            setActionIsError(false);
            resetForm();
            await fetchItems();
        } catch (requestError) {
            console.error(requestError);
            const errors = requestError.response?.data?.errors || {};
            const firstError = Object.values(errors).flat()[0];
            setFormError(
                firstError ||
                    requestError.response?.data?.message ||
                    "Failed to save the recommendation.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (item) => {
        setForm({
            title: item.title,
            description: item.description,
            category: item.category,
            eligibility: item.eligibility || "",
            min_age: item.min_age ?? "",
            max_age: item.max_age ?? "",
            eligible_genders: item.eligible_genders || [],
            eligible_civil_statuses: item.eligible_civil_statuses || [],
            requires_verified: Boolean(item.requires_verified),
            priority: item.priority ?? 0,
            starts_at: item.starts_at || "",
            ends_at: item.ends_at || "",
            is_active: Boolean(item.is_active),
        });
        setEditingId(item.id);
        setShowForm(true);
        setFormError("");
    };

    const handleToggleActive = async (item) => {
        try {
            setBusyId(item.id);
            await api.put(
                `/admin/recommendations/${item.id}`,
                toPayload({
                    ...item,
                    eligibility: item.eligibility || "",
                    min_age: item.min_age ?? "",
                    max_age: item.max_age ?? "",
                    priority: item.priority ?? 0,
                    starts_at: item.starts_at || "",
                    ends_at: item.ends_at || "",
                    is_active: !item.is_active,
                }),
            );
            setActionMessage(
                `Recommendation ${item.is_active ? "deactivated" : "activated"}.`,
            );
            setActionIsError(false);
            await fetchItems();
        } catch (requestError) {
            console.error(requestError);
            setActionMessage(
                requestError.response?.data?.message ||
                    "Failed to update recommendation status.",
            );
            setActionIsError(true);
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setBusyId(deleteTarget.id);
            await api.delete(`/admin/recommendations/${deleteTarget.id}`);
            setActionMessage("Recommendation removed.");
            setActionIsError(false);
            setDeleteTarget(null);
            await fetchItems();
        } catch (requestError) {
            console.error(requestError);
            setActionMessage(
                requestError.response?.data?.message ||
                    "Failed to remove recommendation.",
            );
            setActionIsError(true);
        } finally {
            setBusyId(null);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <SkeletonLoader label="Loading recommendations" variant="table" />
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-dashboard">
                <div className="dashboard-page-header">
                    <div className="page-header-row">
                        <div>
                            <span className="section-label">
                                COMMUNITY CONTENT
                            </span>
                            <h1>Programs &amp; Recommendations</h1>
                            <p>
                                Manage official programs, services,
                                announcements, and activities shown to
                                residents. Age, gender, civil status, and
                                verification filters are enforced; eligibility
                                notes provide additional details. Leave both
                                age limits blank for general recommendations.
                            </p>
                        </div>
                        <Button
                            className="app-button app-button-success"
                            onClick={() => {
                                if (showForm && editingId == null) {
                                    resetForm();
                                } else {
                                    setForm(EMPTY_FORM);
                                    setEditingId(null);
                                    setShowForm(true);
                                }
                            }}
                        >
                            {showForm && editingId == null
                                ? "Close Form"
                                : "＋ New Recommendation"}
                        </Button>
                    </div>
                </div>

                {actionMessage && (
                    <div
                        className={`app-alert app-alert-${actionIsError ? "danger" : "success"}`}
                        role="status"
                    >
                        {actionMessage}
                    </div>
                )}

                {error ? (
                    <section className="dashboard-section">
                        <div className="app-alert app-alert-danger" role="alert">
                            {error}
                        </div>
                        <Button
                            className="app-button app-button-outline-secondary"
                            onClick={fetchItems}
                        >
                            Retry
                        </Button>
                    </section>
                ) : (
                    <>
                        {showForm && (
                            <section className="dashboard-section">
                                <div className="admin-form-card">
                                    <h2 className="form-section-title mb-5-token">
                                        {editingId == null
                                            ? "New Recommendation"
                                            : "Edit Recommendation"}
                                    </h2>
                                    <form noValidate onSubmit={handleSubmit}>
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                            <div className="md:col-span-8">
                                                <label className="app-label" htmlFor="recommendation-title">
                                                    Title *
                                                </label>
                                                <input
                                                    id="recommendation-title"
                                                    className="app-input"
                                                    name="title"
                                                    value={form.title}
                                                    onChange={handleChange}
                                                    maxLength={255}
                                                    required
                                                />
                                            </div>
                                            <div className="md:col-span-4">
                                                <label className="app-label" htmlFor="recommendation-category">
                                                    Category *
                                                </label>
                                                <select
                                                    id="recommendation-category"
                                                    className="app-input"
                                                    name="category"
                                                    value={form.category}
                                                    onChange={handleChange}
                                                >
                                                    {CATEGORIES.map((category) => (
                                                        <option
                                                            key={category.value}
                                                            value={category.value}
                                                        >
                                                            {category.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-span-full">
                                                <label className="app-label" htmlFor="recommendation-description">
                                                    Description *
                                                </label>
                                                <textarea
                                                    id="recommendation-description"
                                                    className="app-input"
                                                    name="description"
                                                    rows={3}
                                                    value={form.description}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                            <div className="md:col-span-6">
                                                <label className="app-label" htmlFor="recommendation-eligibility">
                                                    Eligibility notes
                                                </label>
                                                <textarea
                                                    id="recommendation-eligibility"
                                                    className="app-input"
                                                    name="eligibility"
                                                    rows={2}
                                                    value={form.eligibility}
                                                    onChange={handleChange}
                                                />
                                                <small>
                                                    Displayed to residents. Use
                                                    the profile filters below
                                                    for automatic eligibility
                                                    checks.
                                                </small>
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="app-label" htmlFor="recommendation-genders">
                                                    Eligible genders
                                                </label>
                                                <select
                                                    id="recommendation-genders"
                                                    className="app-input"
                                                    name="eligible_genders"
                                                    value={form.eligible_genders}
                                                    onChange={handleChange}
                                                    multiple
                                                    size={3}
                                                >
                                                    {ELIGIBLE_GENDERS.map((gender) => (
                                                        <option key={gender} value={gender}>
                                                            {gender}
                                                        </option>
                                                    ))}
                                                </select>
                                                <small>Blank means any gender.</small>
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="app-label" htmlFor="recommendation-civil-statuses">
                                                    Eligible civil statuses
                                                </label>
                                                <select
                                                    id="recommendation-civil-statuses"
                                                    className="app-input"
                                                    name="eligible_civil_statuses"
                                                    value={form.eligible_civil_statuses}
                                                    onChange={handleChange}
                                                    multiple
                                                    size={3}
                                                >
                                                    {ELIGIBLE_CIVIL_STATUSES.map((status) => (
                                                        <option key={status} value={status}>
                                                            {status}
                                                        </option>
                                                    ))}
                                                </select>
                                                <small>Blank means any status.</small>
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="app-label" htmlFor="recommendation-min-age">
                                                    Minimum age
                                                </label>
                                                <input
                                                    id="recommendation-min-age"
                                                    className="app-input"
                                                    type="number"
                                                    name="min_age"
                                                    min={0}
                                                    max={120}
                                                    value={form.min_age}
                                                    onChange={handleChange}
                                                    placeholder="Any"
                                                />
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="app-label" htmlFor="recommendation-max-age">
                                                    Maximum age
                                                </label>
                                                <input
                                                    id="recommendation-max-age"
                                                    className="app-input"
                                                    type="number"
                                                    name="max_age"
                                                    min={0}
                                                    max={120}
                                                    value={form.max_age}
                                                    onChange={handleChange}
                                                    placeholder="Any"
                                                />
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="app-label" htmlFor="recommendation-starts-at">
                                                    Starts on
                                                </label>
                                                <input
                                                    id="recommendation-starts-at"
                                                    className="app-input"
                                                    type="date"
                                                    name="starts_at"
                                                    value={form.starts_at}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="app-label" htmlFor="recommendation-ends-at">
                                                    Ends on
                                                </label>
                                                <input
                                                    id="recommendation-ends-at"
                                                    className="app-input"
                                                    type="date"
                                                    name="ends_at"
                                                    value={form.ends_at}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="app-label" htmlFor="recommendation-priority">
                                                    Priority
                                                </label>
                                                <input
                                                    id="recommendation-priority"
                                                    className="app-input"
                                                    type="number"
                                                    name="priority"
                                                    min={0}
                                                    max={65535}
                                                    value={form.priority}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="app-label" htmlFor="recommendation-verified">
                                                    Verification required
                                                </label>
                                                <div className="flex items-center gap-2 form-switch form-switch-spaced">
                                                    <input
                                                        id="recommendation-verified"
                                                        type="checkbox"
                                                        name="requires_verified"
                                                        checked={form.requires_verified}
                                                        onChange={handleChange}
                                                    />
                                                    <span>
                                                        {form.requires_verified
                                                            ? "Verified residents only"
                                                            : "Any verification status"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="app-label" htmlFor="recommendation-active">
                                                    Status
                                                </label>
                                                <div className="flex items-center gap-2 form-switch form-switch-spaced">
                                                    <input
                                                        id="recommendation-active"
                                                        type="checkbox"
                                                        name="is_active"
                                                        checked={form.is_active}
                                                        onChange={handleChange}
                                                    />
                                                    <span>
                                                        {form.is_active
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {formError && (
                                            <div
                                                className="app-alert app-alert-danger mt-4"
                                                role="alert"
                                            >
                                                {formError}
                                            </div>
                                        )}
                                        <div className="form-actions-row">
                                            <Button
                                                type="submit"
                                                className="app-button app-button-success"
                                                loading={submitting}
                                                loadingLabel="Saving recommendation"
                                            >
                                                {editingId == null
                                                    ? "Create Recommendation"
                                                    : "Save Changes"}
                                            </Button>
                                            <Button
                                                className="app-button app-button-outline-secondary"
                                                onClick={resetForm}
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
                            <div className="admin-filters filter-bar">
                                <input
                                    type="search"
                                    className="app-input filter-search"
                                    placeholder="Search recommendations..."
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                />
                                <div className="filter-summary">
                                    Showing {filteredItems.length} of{" "}
                                    {items.length} recommendation
                                    {items.length === 1 ? "" : "s"}
                                </div>
                            </div>
                        </section>

                        <section className="dashboard-section">
                            {filteredItems.length === 0 ? (
                                <div className="dashboard-empty-state">
                                    <div className="dashboard-empty-icon">
                                        <Icon name="activity" />
                                    </div>
                                    <h3>No recommendations yet</h3>
                                    <p>
                                        Add verified barangay content to the
                                        catalog. Nothing is shown to residents
                                        until an administrator publishes it.
                                    </p>
                                </div>
                            ) : (
                                <div className="admin-table-wrapper table-scroll">
                                    <Table className="admin-table data-table">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Category</th>
                                                <th>Age range</th>
                                                <th>Priority</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredItems.map((item) => (
                                                <tr key={item.id}>
                                                    <td>
                                                        <strong>{item.title}</strong>
                                                        <div className="text-sm text-muted-token">
                                                            {item.description}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {CATEGORIES.find(
                                                            (category) =>
                                                                category.value ===
                                                                item.category,
                                                        )?.label || item.category}
                                                    </td>
                                                    <td>{ageRange(item)}</td>
                                                    <td>{item.priority}</td>
                                                    <td>
                                                        {item.is_active
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </td>
                                                    <td>
                                                        <div className="table-action-group">
                                                            <Button
                                                                size="sm"
                                                                variant="outline-success"
                                                                disabled={busyId === item.id}
                                                                onClick={() =>
                                                                    handleEdit(item)
                                                                }
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant={
                                                                    item.is_active
                                                                        ? "outline-warning"
                                                                        : "outline-success"
                                                                }
                                                                disabled={busyId === item.id}
                                                                onClick={() =>
                                                                    handleToggleActive(item)
                                                                }
                                                            >
                                                                {item.is_active
                                                                    ? "Deactivate"
                                                                    : "Activate"}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline-danger"
                                                                disabled={busyId === item.id}
                                                                onClick={() =>
                                                                    setDeleteTarget(item)
                                                                }
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>
            <ConfirmDialog
                isOpen={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete recommendation?"
                confirmLabel="Delete recommendation"
                variant="danger"
            >
                Delete “{deleteTarget?.title}”? It will no longer be shown to
                residents.
            </ConfirmDialog>
        </AdminLayout>
    );
}
