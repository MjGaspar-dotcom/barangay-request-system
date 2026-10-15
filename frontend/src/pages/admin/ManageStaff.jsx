import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    Alert,
    Button,
    CircularProgress,
    MenuItem,
    TableBody,
    TableHead,
    TextField,
} from "@mui/material";
import FieldValidationError from "../../components/forms/FieldValidationError";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import {
    AdminActionHeaderCell,
    AdminDataTable,
    AdminEmptyIcon,
    AdminEmptyState,
    AdminFilterBar,
    AdminMessages,
    AdminPage,
    AdminPageHeader,
    AdminPageLabel,
    AdminPageState,
    AdminResultsCount,
    AdminRowActions,
    AdminSearchField,
    AdminSection,
    AdminTableDataCell,
    AdminTableHeaderCell,
    AdminTablePrimaryText,
    AdminTableRow,
    AdminTableSecondaryText,
    AdminTableWrapper,
} from "../../components/admin/AdminCrud.styles";
import {
    StaffFormActions,
    StaffFormGrid,
    StaffFormTitle,
    StaffFullField,
    StaffHalfField,
    StaffPageHeaderRow,
    StaffThirdField,
} from "./ManageStaff.styles";

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
    const [error, setErrorMessage] = useState("");
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [busyStaffId, setBusyStaffId] = useState(null);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);

    const {
        control,
        handleSubmit,
        setError,
        clearErrors,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: EMPTY_FORM,
        mode: "onSubmit",
        reValidateMode: "onChange",
    });

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const response = await api.get("/admin/staff");
            setStaff(response.data.data || []);
            setErrorMessage("");
        } catch (err) {
            console.error(err);
            setErrorMessage("Failed to load staff.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const applyServerValidationErrors = (validationErrors) => {
        let hasMappedError = false;

        Object.entries(validationErrors).forEach(([fieldName, messages]) => {
            if (!Object.prototype.hasOwnProperty.call(EMPTY_FORM, fieldName)) {
                return;
            }

            const message = Array.isArray(messages) ? messages[0] : messages;

            setError(fieldName, {
                type: "server",
                message,
            });

            hasMappedError = true;
        });

        return hasMappedError;
    };

    const submitStaff = async (values) => {
        setFormError("");
        setFormSuccess("");

        try {
            setSubmitting(true);

            await api.post("/admin/staff", values);

            setFormSuccess(
                `Staff account for ${values.first_name} ${values.last_name} created successfully.`,
            );

            reset(EMPTY_FORM);
            setShowForm(false);

            await fetchStaff();
        } catch (err) {
            console.error(err);

            if (err.response?.status === 422) {
                const validationErrors = err.response.data.errors || {};
                const hasMappedError =
                    applyServerValidationErrors(validationErrors);

                if (!hasMappedError) {
                    setFormError(
                        "Please review the staff information and try again.",
                    );
                }
            } else {
                setFormError(
                    err.response?.data?.message ||
                        "Failed to create staff account.",
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (member) => {
        const confirmDelete = window.confirm(
            `Remove staff account for ${member.user?.first_name} ${member.user?.last_name}? This will also delete the underlying user account.`,
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
                    "Failed to remove staff account.",
            );
        } finally {
            setBusyStaffId(null);
        }
    };

    const filtered = staff.filter((member) => {
        if (!search) return true;

        const needle = search.toLowerCase();
        const user = member.user || {};

        return [
            user.first_name,
            user.last_name,
            user.username,
            user.email,
            user.contact_number,
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
                <AdminPageState>
                    <CircularProgress color="success" size={32} />

                    <p>Loading staff...</p>
                </AdminPageState>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <AdminPageState>
                    <Alert severity="error">{error}</Alert>
                </AdminPageState>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <AdminPage>
                <AdminPageHeader>
                    <StaffPageHeaderRow>
                        <div>
                            <AdminPageLabel>STAFF MANAGEMENT</AdminPageLabel>

                            <h1>Manage Staff</h1>

                            <p>
                                Create staff accounts and assign personnel to
                                process barangay document requests.
                            </p>
                        </div>

                        <Button
                            type="button"
                            variant="contained"
                            color="success"
                            onClick={() => {
                                if (showForm) {
                                    reset(EMPTY_FORM);
                                    clearErrors();
                                    setShowForm(false);
                                } else {
                                    reset(EMPTY_FORM);
                                    clearErrors();
                                    setShowForm(true);
                                }

                                setFormError("");
                                setFormSuccess("");
                            }}
                        >
                            {showForm ? "Close Form" : "＋ Create Staff"}
                        </Button>
                    </StaffPageHeaderRow>
                </AdminPageHeader>

                {formSuccess && (
                    <AdminMessages>
                        <Alert severity="success">{formSuccess}</Alert>
                    </AdminMessages>
                )}

                {showForm && (
                    <AdminSection>
                        <StaffFormTitle>New Staff Account</StaffFormTitle>

                        <form onSubmit={handleSubmit(submitStaff)} noValidate>
                            <StaffFormGrid>
                                <StaffHalfField>
                                    <Controller
                                        name="username"
                                        control={control}
                                        rules={{
                                            required: "Username is required.",
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                id="staff-create-username"
                                                type="text"
                                                name={field.name}
                                                fullWidth
                                                required
                                                label="Username"
                                                value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                inputRef={field.ref}
                                                error={Boolean(errors.username)}
                                                slotProps={{
                                                    htmlInput: {
                                                        "aria-invalid": Boolean(
                                                            errors.username,
                                                        ),
                                                        "aria-describedby":
                                                            errors.username
                                                                ? "staff-create-username-error"
                                                                : undefined,
                                                    },
                                                }}
                                            />
                                        )}
                                    />

                                    <FieldValidationError
                                        id="staff-create-username-error"
                                        error={errors.username}
                                    />
                                </StaffHalfField>

                                <StaffHalfField>
                                    <Controller
                                        name="password"
                                        control={control}
                                        rules={{
                                            required: "Password is required.",
                                            minLength: {
                                                value: 8,
                                                message:
                                                    "Password must be at least 8 characters.",
                                            },
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                id="staff-create-password"
                                                type="password"
                                                name={field.name}
                                                fullWidth
                                                required
                                                label="Password"
                                                value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                inputRef={field.ref}
                                                error={Boolean(errors.password)}
                                                slotProps={{
                                                    htmlInput: {
                                                        minLength: 8,
                                                        "aria-invalid": Boolean(
                                                            errors.password,
                                                        ),
                                                        "aria-describedby":
                                                            errors.password
                                                                ? "staff-create-password-error"
                                                                : undefined,
                                                    },
                                                }}
                                            />
                                        )}
                                    />

                                    <FieldValidationError
                                        id="staff-create-password-error"
                                        error={errors.password}
                                    />
                                </StaffHalfField>

                                <StaffThirdField>
                                    <Controller
                                        name="first_name"
                                        control={control}
                                        rules={{
                                            required: "First name is required.",
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                id="staff-create-first-name"
                                                type="text"
                                                name={field.name}
                                                fullWidth
                                                required
                                                label="First Name"
                                                value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                inputRef={field.ref}
                                                error={Boolean(
                                                    errors.first_name,
                                                )}
                                                slotProps={{
                                                    htmlInput: {
                                                        "aria-invalid": Boolean(
                                                            errors.first_name,
                                                        ),
                                                        "aria-describedby":
                                                            errors.first_name
                                                                ? "staff-create-first-name-error"
                                                                : undefined,
                                                    },
                                                }}
                                            />
                                        )}
                                    />

                                    <FieldValidationError
                                        id="staff-create-first-name-error"
                                        error={errors.first_name}
                                    />
                                </StaffThirdField>

                                <StaffThirdField>
                                    <Controller
                                        name="middle_name"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                id="staff-create-middle-name"
                                                type="text"
                                                name={field.name}
                                                fullWidth
                                                label="Middle Name"
                                                value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                inputRef={field.ref}
                                            />
                                        )}
                                    />
                                </StaffThirdField>

                                <StaffThirdField>
                                    <Controller
                                        name="last_name"
                                        control={control}
                                        rules={{
                                            required: "Last name is required.",
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                id="staff-create-last-name"
                                                type="text"
                                                name={field.name}
                                                fullWidth
                                                required
                                                label="Last Name"
                                                value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                inputRef={field.ref}
                                                error={Boolean(
                                                    errors.last_name,
                                                )}
                                                slotProps={{
                                                    htmlInput: {
                                                        "aria-invalid": Boolean(
                                                            errors.last_name,
                                                        ),
                                                        "aria-describedby":
                                                            errors.last_name
                                                                ? "staff-create-last-name-error"
                                                                : undefined,
                                                    },
                                                }}
                                            />
                                        )}
                                    />

                                    <FieldValidationError
                                        id="staff-create-last-name-error"
                                        error={errors.last_name}
                                    />
                                </StaffThirdField>

                                <StaffThirdField>
                                    <Controller
                                        name="birth_date"
                                        control={control}
                                        rules={{
                                            required: "Birth date is required.",
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                id="staff-create-birth-date"
                                                type="date"
                                                name={field.name}
                                                fullWidth
                                                required
                                                label="Birth Date"
                                                value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                inputRef={field.ref}
                                                error={Boolean(
                                                    errors.birth_date,
                                                )}
                                                slotProps={{
                                                    inputLabel: {
                                                        shrink: true,
                                                    },
                                                    htmlInput: {
                                                        max: new Date()
                                                            .toISOString()
                                                            .slice(0, 10),
                                                        "aria-invalid": Boolean(
                                                            errors.birth_date,
                                                        ),
                                                        "aria-describedby":
                                                            errors.birth_date
                                                                ? "staff-create-birth-date-error"
                                                                : undefined,
                                                    },
                                                }}
                                            />
                                        )}
                                    />

                                    <FieldValidationError
                                        id="staff-create-birth-date-error"
                                        error={errors.birth_date}
                                    />
                                </StaffThirdField>

                                <StaffThirdField>
                                    <Controller
                                        name="gender"
                                        control={control}
                                        rules={{
                                            required: "Select a gender.",
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                id="staff-create-gender"
                                                select
                                                name={field.name}
                                                fullWidth
                                                required
                                                label="Gender"
                                                value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                inputRef={field.ref}
                                                error={Boolean(errors.gender)}
                                                slotProps={{
                                                    htmlInput: {
                                                        "aria-invalid": Boolean(
                                                            errors.gender,
                                                        ),
                                                        "aria-describedby":
                                                            errors.gender
                                                                ? "staff-create-gender-error"
                                                                : undefined,
                                                    },
                                                }}
                                            >
                                                <MenuItem value="Male">
                                                    Male
                                                </MenuItem>

                                                <MenuItem value="Female">
                                                    Female
                                                </MenuItem>

                                                <MenuItem value="Prefer not to say">
                                                    Prefer not to say
                                                </MenuItem>
                                            </TextField>
                                        )}
                                    />

                                    <FieldValidationError
                                        id="staff-create-gender-error"
                                        error={errors.gender}
                                    />
                                </StaffThirdField>

                                <StaffThirdField>
                                    <Controller
                                        name="civil_status"
                                        control={control}
                                        rules={{
                                            required: "Select a civil status.",
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                id="staff-create-civil-status"
                                                select
                                                name={field.name}
                                                fullWidth
                                                required
                                                label="Civil Status"
                                                value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                inputRef={field.ref}
                                                error={Boolean(
                                                    errors.civil_status,
                                                )}
                                                slotProps={{
                                                    htmlInput: {
                                                        "aria-invalid": Boolean(
                                                            errors.civil_status,
                                                        ),
                                                        "aria-describedby":
                                                            errors.civil_status
                                                                ? "staff-create-civil-status-error"
                                                                : undefined,
                                                    },
                                                }}
                                            >
                                                <MenuItem value="Single">
                                                    Single
                                                </MenuItem>

                                                <MenuItem value="Married">
                                                    Married
                                                </MenuItem>

                                                <MenuItem value="Separated">
                                                    Separated
                                                </MenuItem>

                                                <MenuItem value="Divorced">
                                                    Divorced
                                                </MenuItem>

                                                <MenuItem value="Widowed">
                                                    Widowed
                                                </MenuItem>
                                            </TextField>
                                        )}
                                    />

                                    <FieldValidationError
                                        id="staff-create-civil-status-error"
                                        error={errors.civil_status}
                                    />
                                </StaffThirdField>

                                <StaffFullField>
                                    <Controller
                                        name="address"
                                        control={control}
                                        rules={{
                                            required: "Purok is required.",
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                id="staff-create-purok"
                                                type="text"
                                                name={field.name}
                                                fullWidth
                                                required
                                                label="Purok"
                                                value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                inputRef={field.ref}
                                                error={Boolean(errors.address)}
                                                placeholder="e.g., Purok 3"
                                                slotProps={{
                                                    htmlInput: {
                                                        "aria-invalid": Boolean(
                                                            errors.address,
                                                        ),
                                                        "aria-describedby":
                                                            errors.address
                                                                ? "staff-create-purok-error"
                                                                : undefined,
                                                    },
                                                }}
                                            />
                                        )}
                                    />

                                    <FieldValidationError
                                        id="staff-create-purok-error"
                                        error={errors.address}
                                    />
                                </StaffFullField>

                                <StaffHalfField>
                                    <Controller
                                        name="contact_number"
                                        control={control}
                                        rules={{
                                            required:
                                                "Contact number is required.",
                                            pattern: {
                                                value: /^09\d{9}$/,
                                                message:
                                                    "Enter a valid 11-digit mobile number.",
                                            },
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                id="staff-create-contact-number"
                                                type="text"
                                                name={field.name}
                                                fullWidth
                                                required
                                                label="Contact Number"
                                                value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                inputRef={field.ref}
                                                error={Boolean(
                                                    errors.contact_number,
                                                )}
                                                slotProps={{
                                                    htmlInput: {
                                                        inputMode: "numeric",
                                                        maxLength: 11,
                                                        "aria-invalid": Boolean(
                                                            errors.contact_number,
                                                        ),
                                                        "aria-describedby":
                                                            errors.contact_number
                                                                ? "staff-create-contact-number-error"
                                                                : undefined,
                                                    },
                                                }}
                                            />
                                        )}
                                    />

                                    <FieldValidationError
                                        id="staff-create-contact-number-error"
                                        error={errors.contact_number}
                                    />
                                </StaffHalfField>

                                <StaffHalfField>
                                    <Controller
                                        name="email"
                                        control={control}
                                        rules={{
                                            required: "Email is required.",
                                            pattern: {
                                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                message:
                                                    "Enter a valid email address.",
                                            },
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                id="staff-create-email"
                                                type="email"
                                                name={field.name}
                                                fullWidth
                                                required
                                                label="Email"
                                                value={field.value}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                inputRef={field.ref}
                                                error={Boolean(errors.email)}
                                                slotProps={{
                                                    htmlInput: {
                                                        "aria-invalid": Boolean(
                                                            errors.email,
                                                        ),
                                                        "aria-describedby":
                                                            errors.email
                                                                ? "staff-create-email-error"
                                                                : undefined,
                                                    },
                                                }}
                                            />
                                        )}
                                    />

                                    <FieldValidationError
                                        id="staff-create-email-error"
                                        error={errors.email}
                                    />
                                </StaffHalfField>
                            </StaffFormGrid>

                            {formError && (
                                <FieldValidationError
                                    id="staff-create-form-error"
                                    error={formError}
                                />
                            )}

                            <StaffFormActions>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="success"
                                    disabled={submitting}
                                >
                                    {submitting
                                        ? "Creating..."
                                        : "Create Staff Account"}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outlined"
                                    color="secondary"
                                    disabled={submitting}
                                    onClick={() => {
                                        reset(EMPTY_FORM);
                                        clearErrors();
                                        setFormError("");
                                        setShowForm(false);
                                    }}
                                >
                                    Cancel
                                </Button>
                            </StaffFormActions>
                        </form>
                    </AdminSection>
                )}

                <AdminSection>
                    <AdminFilterBar>
                        <AdminSearchField
                            type="search"
                            size="small"
                            label="Search Staff"
                            placeholder="Search by name, username, email..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />

                        <AdminResultsCount>
                            Showing {filtered.length} of {staff.length} staff
                        </AdminResultsCount>
                    </AdminFilterBar>
                </AdminSection>

                <AdminSection>
                    {filtered.length === 0 ? (
                        <AdminEmptyState>
                            <AdminEmptyIcon>🧑‍💼</AdminEmptyIcon>

                            <h3>No Staff Found</h3>

                            <p>
                                No staff accounts match the current filters. Use
                                the "Create Staff" button to add a new staff
                                member.
                            </p>
                        </AdminEmptyState>
                    ) : (
                        <AdminTableWrapper>
                            <AdminDataTable>
                                <TableHead>
                                    <AdminTableRow>
                                        <AdminTableHeaderCell>
                                            Name
                                        </AdminTableHeaderCell>

                                        <AdminTableHeaderCell>
                                            Username
                                        </AdminTableHeaderCell>

                                        <AdminTableHeaderCell>
                                            Email
                                        </AdminTableHeaderCell>

                                        <AdminTableHeaderCell>
                                            Contact
                                        </AdminTableHeaderCell>

                                        <AdminTableHeaderCell>
                                            Assigned By
                                        </AdminTableHeaderCell>

                                        <AdminTableHeaderCell>
                                            Created
                                        </AdminTableHeaderCell>

                                        <AdminActionHeaderCell>
                                            Actions
                                        </AdminActionHeaderCell>
                                    </AdminTableRow>
                                </TableHead>

                                <TableBody>
                                    {filtered.map((member) => (
                                        <AdminTableRow key={member.staff_id}>
                                            <AdminTableDataCell>
                                                <AdminTablePrimaryText>
                                                    {fullName(member.user)}
                                                </AdminTablePrimaryText>

                                                <AdminTableSecondaryText>
                                                    {member.user?.address ||
                                                        "—"}
                                                </AdminTableSecondaryText>
                                            </AdminTableDataCell>

                                            <AdminTableDataCell>
                                                {member.user?.username}
                                            </AdminTableDataCell>

                                            <AdminTableDataCell>
                                                {member.user?.email}
                                            </AdminTableDataCell>

                                            <AdminTableDataCell>
                                                {member.user?.contact_number ||
                                                    "—"}
                                            </AdminTableDataCell>

                                            <AdminTableDataCell>
                                                {member.assigned_by_name || "—"}
                                            </AdminTableDataCell>

                                            <AdminTableDataCell>
                                                {formatDate(member.created_at)}
                                            </AdminTableDataCell>

                                            <AdminTableDataCell>
                                                <AdminRowActions>
                                                    <Button
                                                        type="button"
                                                        variant="outlined"
                                                        color="error"
                                                        size="small"
                                                        disabled={
                                                            busyStaffId ===
                                                            member.staff_id
                                                        }
                                                        onClick={() =>
                                                            handleDelete(member)
                                                        }
                                                    >
                                                        Remove
                                                    </Button>
                                                </AdminRowActions>
                                            </AdminTableDataCell>
                                        </AdminTableRow>
                                    ))}
                                </TableBody>
                            </AdminDataTable>
                        </AdminTableWrapper>
                    )}
                </AdminSection>
            </AdminPage>
        </AdminLayout>
    );
}
