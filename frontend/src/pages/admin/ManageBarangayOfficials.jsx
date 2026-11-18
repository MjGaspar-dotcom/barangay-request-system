import { useCallback, useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import Button from "../../components/ui/Button";
import api from "../../services/api";
import "./ManageBarangayOfficials.css";

const EMPTY_FORM = {
    captain_name: "",
    secretary_name: "",
};

const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;
const NAME_FIELDS = [
    { name: "captain_name", label: "Barangay Captain" },
    { name: "secretary_name", label: "Barangay Secretary" },
];

export default function ManageBarangayOfficials() {
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});

    const loadOfficials = useCallback(async () => {
        try {
            const response = await api.get("/admin/barangay-officials");
            setForm({
                captain_name: response.data?.data?.captain_name || "",
                secretary_name: response.data?.data?.secretary_name || "",
            });
            setError("");
        } catch (requestError) {
            console.error(requestError);
            setError(
                requestError.response?.data?.message ||
                    "Failed to load barangay officials.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        api.get("/admin/barangay-officials")
            .then((response) => {
                if (!cancelled) {
                    setForm({
                        captain_name:
                            response.data?.data?.captain_name || "",
                        secretary_name:
                            response.data?.data?.secretary_name || "",
                    });
                    setError("");
                }
            })
            .catch((requestError) => {
                console.error(requestError);
                if (!cancelled) {
                    setError(
                        requestError.response?.data?.message ||
                            "Failed to load barangay officials.",
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const validationErrors = {};
        NAME_FIELDS.forEach(({ name, label }) => {
            const value = form[name].trim();
            if (!value) {
                validationErrors[name] = `${label} name is required.`;
            } else if (!NAME_PATTERN.test(value)) {
                validationErrors[name] =
                    "Use letters, spaces, periods, apostrophes, or hyphens only.";
            } else if (value.length > 255) {
                validationErrors[name] =
                    "The name must be 255 characters or fewer.";
            }
        });

        setFieldErrors(validationErrors);
        setSubmitting(true);
        setError("");

        if (Object.keys(validationErrors).length) {
            setSubmitting(false);
            document
                .getElementById(Object.keys(validationErrors)[0])
                ?.focus();
            return;
        }

        try {
            const response = await api.put("/admin/barangay-officials", {
                captain_name: form.captain_name.trim(),
                secretary_name: form.secretary_name.trim(),
            });
            setForm(response.data.data);
            setFieldErrors({});
        } catch (requestError) {
            console.error(requestError);
            const responseErrors = requestError.response?.data?.errors;
            if (responseErrors && typeof responseErrors === "object") {
                const nextFieldErrors = Object.fromEntries(
                    Object.entries(responseErrors).map(([field, messages]) => [
                        field,
                        Array.isArray(messages)
                            ? messages[0]
                            : "Please check this value.",
                    ]),
                );
                setFieldErrors(nextFieldErrors);
                setError("Please review the highlighted fields.");
            } else {
                setError(
                    requestError.response?.data?.message ||
                        "Could not save barangay officials. Please try again.",
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AdminLayout>
            <div className="admin-dashboard barangay-officials-page">
                <div className="w-full">
                    <header className="dashboard-page-header">
                        <div className="page-header-row">
                            <div>
                                <span className="section-label">SYSTEM</span>
                                <h1>Barangay Officials</h1>
                                <p>
                                    Manage the names that appear on official
                                    barangay documents.
                                </p>
                            </div>
                        </div>
                    </header>

                    {error && (
                        <div
                            className="app-alert app-alert-danger officials-load-error"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <section className="dashboard-section">
                            <div
                                className="admin-form-card officials-form-card"
                                aria-busy="true"
                            >
                                <span className="officials-loading-indicator" />
                                <span>Loading barangay officials...</span>
                            </div>
                        </section>
                    ) : error && !form.captain_name && !form.secretary_name ? (
                        <section className="dashboard-section">
                            <Button
                                className="app-button app-button-outline-secondary"
                                onClick={() => {
                                    setLoading(true);
                                    loadOfficials();
                                }}
                            >
                                Retry
                            </Button>
                        </section>
                    ) : (
                        <section className="dashboard-section">
                            <div className="admin-form-card officials-form-card">
                                <div className="officials-form-heading">
                                    <span className="section-label">
                                        DOCUMENT DETAILS
                                    </span>
                                    <h2 className="form-section-title">
                                        Official names
                                    </h2>
                                    <p>
                                        Enter the current office holders’ names.
                                        These changes apply to newly generated
                                        documents.
                                    </p>
                                </div>
                                <form
                                    noValidate
                                    onSubmit={handleSubmit}
                                    aria-busy={submitting || undefined}
                                >
                                    <div className="officials-fields">
                                        <div className="officials-field">
                                            <label
                                                className="app-label"
                                                htmlFor="captain_name"
                                            >
                                                Barangay Captain *
                                            </label>
                                            <input
                                                id="captain_name"
                                                name="captain_name"
                                                className={`app-input ${fieldErrors.captain_name ? "is-invalid" : ""}`}
                                                value={form.captain_name}
                                                onChange={(event) => {
                                                    setForm((current) => ({
                                                        ...current,
                                                        captain_name:
                                                            event.target.value,
                                                    }));
                                                    setFieldErrors((current) => ({
                                                        ...current,
                                                        captain_name: "",
                                                    }));
                                                }}
                                                autoComplete="name"
                                                aria-invalid={
                                                    fieldErrors.captain_name
                                                        ? "true"
                                                        : undefined
                                                }
                                                aria-describedby={
                                                    fieldErrors.captain_name
                                                        ? "captain_name-error"
                                                        : undefined
                                                }
                                                maxLength={255}
                                                required
                                            />
                                            {fieldErrors.captain_name && (
                                                <p
                                                    className="officials-field-error"
                                                    id="captain_name-error"
                                                >
                                                    {fieldErrors.captain_name}
                                                </p>
                                            )}
                                        </div>
                                        <div className="officials-field">
                                            <label
                                                className="app-label"
                                                htmlFor="secretary_name"
                                            >
                                                Barangay Secretary *
                                            </label>
                                            <input
                                                id="secretary_name"
                                                name="secretary_name"
                                                className={`app-input ${fieldErrors.secretary_name ? "is-invalid" : ""}`}
                                                value={form.secretary_name}
                                                onChange={(event) => {
                                                    setForm((current) => ({
                                                        ...current,
                                                        secretary_name:
                                                            event.target.value,
                                                    }));
                                                    setFieldErrors((current) => ({
                                                        ...current,
                                                        secretary_name: "",
                                                    }));
                                                }}
                                                autoComplete="name"
                                                aria-invalid={
                                                    fieldErrors.secretary_name
                                                        ? "true"
                                                        : undefined
                                                }
                                                aria-describedby={
                                                    fieldErrors.secretary_name
                                                        ? "secretary_name-error"
                                                        : undefined
                                                }
                                                maxLength={255}
                                                required
                                            />
                                            {fieldErrors.secretary_name && (
                                                <p
                                                    className="officials-field-error"
                                                    id="secretary_name-error"
                                                >
                                                    {fieldErrors.secretary_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="officials-form-actions">
                                        <Button
                                            type="submit"
                                            className="app-button app-button-success"
                                            loading={submitting}
                                            loadingLabel="Saving officials"
                                        >
                                            Save changes
                                        </Button>
                                        <span className="officials-form-note">
                                            Required fields are marked with *
                                        </span>
                                    </div>
                                </form>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
