import { useEffect, useState } from "react";
import {
    Avatar,
    Button,
    LinearProgress,
    TextField,
    Typography,
} from "@mui/material";
import { useAuth } from "../../hooks/useAuth";
import PortalLayout from "../../layouts/PortalLayout";
import PageHeader from "../../components/ui/PageHeader";
import SectionCard from "../../components/ui/SectionCard";
import api from "../../services/api";

const fileFields = [
    {
        field: "profile_picture",
        title: "Profile picture",
        urlField: "profile_picture_url",
        nameField: "profile_picture_original_name",
        uploadedAtField: "profile_picture_uploaded_at",
        avatar: true,
    },
    {
        field: "valid_id_front",
        title: "Valid ID — front",
        urlField: "valid_id_front_url",
        nameField: "valid_id_front_original_name",
        uploadedAtField: "valid_id_front_uploaded_at",
    },
    {
        field: "valid_id_back",
        title: "Valid ID — back",
        urlField: "valid_id_back_url",
        nameField: "valid_id_back_original_name",
        uploadedAtField: "valid_id_back_uploaded_at",
    },
];

const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
};

function ProfileFileCard({
    definition,
    user,
    file,
    previewUrl,
    onSelect,
    inputKey,
}) {
    const savedUrl = user?.[definition.urlField];
    const imageUrl = previewUrl || savedUrl;

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                minWidth: 0,
                padding: 16,
                border: "1px solid rgba(32, 73, 52, 0.16)",
                borderRadius: 14,
                background: "#fff",
            }}
        >
            <Typography fontWeight={700}>{definition.title}</Typography>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    minHeight: definition.avatar ? 88 : 112,
                }}
            >
                {definition.avatar ? (
                    <Avatar
                        src={imageUrl || undefined}
                        alt="Resident profile picture"
                        sx={{ width: 76, height: 76 }}
                    />
                ) : imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={`${definition.title} preview`}
                        style={{
                            width: 150,
                            height: 100,
                            borderRadius: 8,
                            objectFit: "contain",
                            background: "#f5f7f5",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: 150,
                            height: 100,
                            display: "grid",
                            placeItems: "center",
                            borderRadius: 8,
                            background: "#f5f7f5",
                            color: "#66736b",
                            fontSize: 13,
                        }}
                    >
                        No file saved
                    </div>
                )}
                <div style={{ minWidth: 0 }}>
                    <Typography variant="body2" color="text.secondary">
                        {file?.name ||
                            user?.[definition.nameField] ||
                            (savedUrl ? "Saved on your account" : "No upload yet")}
                    </Typography>
                    {user?.[definition.uploadedAtField] && !file && (
                        <Typography variant="caption" color="text.secondary">
                            Uploaded {formatDate(user[definition.uploadedAtField])}
                        </Typography>
                    )}
                </div>
            </div>
            <Button component="label" variant="outlined" sx={{ alignSelf: "flex-start" }}>
                {savedUrl || file ? "Choose replacement" : "Choose image"}
                <input
                    key={inputKey}
                    hidden
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => onSelect(definition.field, event.target.files?.[0])}
                />
            </Button>
        </div>
    );
}

export default function Profile() {
    const { user, refreshUser } = useAuth();
    const [validIdTypeOverride, setValidIdTypeOverride] = useState(null);
    const validIdType = validIdTypeOverride ?? user?.valid_id_type ?? "";
    const [streetName, setStreetName] = useState(null);
    const [files, setFiles] = useState({});
    const [previews, setPreviews] = useState({});
    const [inputKey, setInputKey] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        refreshUser().catch((refreshError) => {
            console.error(refreshError);
            if (active) {
                setError("Could not refresh your saved profile files.");
            }
        });
        return () => {
            active = false;
        };
    }, [refreshUser]);

    useEffect(
        () => () => {
            Object.values(previews).forEach((url) => URL.revokeObjectURL(url));
        },
        [previews],
    );

    const selectFile = (field, file) => {
        if (!file) return;
        setError("");
        setMessage("");
        setFiles((current) => ({ ...current, [field]: file }));
        setPreviews((current) => ({
            ...current,
            [field]: URL.createObjectURL(file),
        }));
    };

    const saveProfile = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");

        const streetNameValue = streetName ?? user?.street_name ?? "";
        const streetNameChanged =
            streetNameValue.trim() !== (user?.street_name || "").trim();
        if (streetNameChanged && !streetNameValue.trim()) {
            setError("Enter your street name to update your address.");
            return;
        }
        if (
            !Object.keys(files).length &&
            validIdType === (user?.valid_id_type || "") &&
            !streetNameChanged
        ) {
            setError("Update your street name, choose an image, or update the ID type.");
            return;
        }

        const formData = new FormData();
        formData.append("_method", "PATCH");
        if (streetNameChanged) {
            formData.append("street_name", streetNameValue.trim());
        }
        if (validIdType.trim()) {
            formData.append("valid_id_type", validIdType.trim());
        }
        Object.entries(files).forEach(([field, file]) => {
            formData.append(field, file);
        });

        setUploading(true);
        setProgress(0);
        try {
            const response = await api.post("/profile", formData, {
                onUploadProgress: (event) => {
                    if (event.total) {
                        setProgress(Math.round((event.loaded / event.total) * 100));
                    }
                },
            });
            await refreshUser();
            setValidIdTypeOverride(null);
            setFiles({});
            setPreviews({});
            setInputKey((key) => key + 1);
            setMessage(response.data?.message || "Profile files saved.");
        } catch (uploadError) {
            console.error(uploadError);
            const validationErrors = Object.values(
                uploadError.response?.data?.errors || {},
            )
                .flat()
                .join(" ");
            setError(
                validationErrors ||
                    uploadError.response?.data?.message ||
                    "Could not save your profile files. Please try again.",
            );
        } finally {
            setUploading(false);
        }
    };

    return (
        <PortalLayout portalLabel="RESIDENT SERVICES">
            <div style={{ width: "100%", maxWidth: 980, margin: "0 auto" }}>
                <PageHeader
                    title="My Profile"
                    description="Update your street name. Barangay Aurora, Alicia, Isabela, and postal code 3306 are added automatically."
                />
                <SectionCard eyebrow="Account" title={user?.first_name || "Resident"}>
                    <form onSubmit={saveProfile}>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                                gap: 16,
                            }}
                        >
                            {fileFields.map((definition) => (
                                <ProfileFileCard
                                    key={definition.field}
                                    definition={definition}
                                    user={user}
                                    file={files[definition.field]}
                                    previewUrl={previews[definition.field]}
                                    onSelect={selectFile}
                                    inputKey={inputKey}
                                />
                            ))}
                        </div>
                        <TextField
                            label="Street Name"
                            value={streetName ?? user?.street_name ?? ""}
                            onChange={(event) => setStreetName(event.target.value)}
                            helperText="Only your street name is editable; the barangay and municipality are fixed."
                            fullWidth
                            margin="normal"
                            inputProps={{ maxLength: 255 }}
                        />
                        <TextField
                            label="Valid ID type (automatically detected)"
                            value={validIdType}
                            onChange={(event) => setValidIdTypeOverride(event.target.value)}
                            helperText="Detected from the uploaded front image when you save. Review or correct it if needed."
                            fullWidth
                            margin="normal"
                            inputProps={{ maxLength: 255 }}
                        />
                        {uploading && (
                            <div style={{ margin: "12px 0" }}>
                                <LinearProgress variant="determinate" value={progress} />
                                <Typography variant="caption" color="text.secondary">
                                    Uploading {progress}%
                                </Typography>
                            </div>
                        )}
                        {message && (
                            <Typography role="status" color="success.main" sx={{ my: 1 }}>
                                {message}
                            </Typography>
                        )}
                        {error && (
                            <Typography role="alert" color="error.main" sx={{ my: 1 }}>
                                {error}
                            </Typography>
                        )}
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={uploading}
                            sx={{ mt: 1 }}
                        >
                            {uploading ? "Saving..." : "Save changes"}
                        </Button>
                    </form>
                </SectionCard>
            </div>
        </PortalLayout>
    );
}
