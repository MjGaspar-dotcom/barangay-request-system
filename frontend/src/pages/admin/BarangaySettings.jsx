import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import StaffLayout from "../../layouts/StaffLayout";
import Button from "../../components/ui/Button";
import api from "../../services/api";

const EMPTY_SETTINGS = {
    barangay_name: "Barangay Aurora",
    municipality: "",
    province: "",
    punong_barangay_name: "",
    office_address: "",
    contact_information: "",
    council_roster_text: "",
};

const FIELDS = [
    ["barangay_name", "Barangay name"],
    ["municipality", "Municipality / City"],
    ["province", "Province"],
    ["punong_barangay_name", "Punong Barangay name"],
    ["office_address", "Office address"],
    ["contact_information", "Contact information"],
];

const normalizeSettings = (data) => ({
    ...EMPTY_SETTINGS,
    ...data,
    council_roster_text: (data.council_roster || [])
        .map((official) => `${official.name} | ${official.position}`)
        .join("\n"),
});

export default function BarangaySettings({ isAdmin = true }) {
    const navigate = useNavigate();
    const Layout = isAdmin ? AdminLayout : StaffLayout;
    const [settings, setSettings] = useState(EMPTY_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        let active = true;
        api.get(
            isAdmin
                ? "/admin/barangay-settings"
                : "/staff/barangay-settings",
        )
            .then((response) => {
                if (active) {
                    setSettings(normalizeSettings(response.data.data));
                }
            })
            .catch((requestError) => {
                console.error(requestError);
                if (active) {
                    setError(
                        requestError.response?.data?.message ||
                            "Failed to load barangay settings.",
                    );
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [isAdmin]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!isAdmin) return;

        setSaving(true);
        setError("");
        setMessage("");

        const formData = new FormData();
        formData.append("_method", "PUT");
        FIELDS.forEach(([key]) => {
            formData.append(key, settings[key] || "");
        });
        formData.append("council_roster", settings.council_roster_text || "");

        try {
            const response = await api.post(
                "/admin/barangay-settings",
                formData,
            );
            setSettings(normalizeSettings(response.data.data));
            setMessage("Barangay settings saved.");
        } catch (saveError) {
            console.error(saveError);
            setError(
                saveError.response?.data?.message ||
                    "Failed to save barangay settings.",
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout>
            <div className="admin-dashboard">
                <header className="dashboard-page-header">
                    <span className="section-label">SYSTEM CONFIGURATION</span>
                    <h1>Barangay Settings</h1>
                    <p>
                        {isAdmin
                            ? "Configure the official information used by generated document templates."
                            : "View the official information used by generated document templates."}
                    </p>
                    <Button
                        className="app-button app-button-outline-primary mt-4"
                        onClick={() =>
                            navigate(
                                isAdmin
                                    ? "/admin/document-template-sample"
                                    : "/staff/document-template-sample",
                            )
                        }
                        type="button"
                    >
                        Preview School Demo Template
                    </Button>
                </header>

                {loading ? (
                    <p>Loading barangay settings...</p>
                ) : (
                    <form
                        className="admin-form-card flex flex-col gap-4"
                        onSubmit={handleSubmit}
                    >
                        <div className="app-alert app-alert-info" role="note">
                            {isAdmin
                                ? "Official details are blank until configured by an administrator. Document generation stays unavailable until the required details are provided."
                                : "These official details are read-only and can only be changed by an administrator."}
                        </div>

                        {FIELDS.map(([key, label]) => (
                            <div key={key}>
                                <label
                                    className="app-label"
                                    htmlFor={`barangay-setting-${key}`}
                                >
                                    {label}
                                </label>
                                <input
                                    className="app-input"
                                    id={`barangay-setting-${key}`}
                                    maxLength={255}
                                    readOnly={!isAdmin}
                                    onChange={(event) =>
                                        setSettings((current) => ({
                                            ...current,
                                            [key]: event.target.value,
                                        }))
                                    }
                                    required={key === "barangay_name"}
                                    value={settings[key] || ""}
                                />
                            </div>
                        ))}

                        <div>
                            <label
                                className="app-label"
                                htmlFor="barangay-council-roster"
                            >
                                Sangguniang Barangay roster
                            </label>
                            <textarea
                                className="app-input"
                                id="barangay-council-roster"
                                readOnly={!isAdmin}
                                onChange={(event) =>
                                    setSettings((current) => ({
                                        ...current,
                                        council_roster_text: event.target.value,
                                    }))
                                }
                                placeholder={
                                    "Name | Position\nOfficial name | Sangguniang Barangay Member"
                                }
                                rows={7}
                                value={settings.council_roster_text}
                            />
                            <p className="text-sm text-muted-foreground">
                                {isAdmin
                                    ? 'Enter one official per line as "Name | Position". Only enter verified current officeholders.'
                                    : "Current Sangguniang Barangay roster."}
                            </p>
                        </div>

                        {error && (
                            <div className="app-alert app-alert-danger" role="alert">
                                {error}
                            </div>
                        )}
                        {message && (
                            <div className="app-alert app-alert-success" role="status">
                                {message}
                            </div>
                        )}
                        {isAdmin && (
                            <div className="flex justify-end">
                                <Button
                                    className="app-button app-button-primary"
                                    disabled={saving}
                                    loading={saving}
                                    loadingLabel="Saving settings"
                                    type="submit"
                                >
                                    Save Settings
                                </Button>
                            </div>
                        )}
                    </form>
                )}
            </div>
        </Layout>
    );
}
