import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import PdfDocumentCanvas from "../../components/documents/PdfDocumentCanvas";
import api from "../../services/api";
import "./DocumentTemplates.css";

const formatDate = (value) => {
    if (!value) return "Not recorded";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not recorded";
    return new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeZone: "UTC",
    }).format(date);
};

const formatSize = (bytes = 0) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getErrorMessage = (error, fallback) =>
    error.response?.data?.message || fallback;

function MappingSelect({ value, options, disabled, onChange }) {
    return (
        <select
            aria-label="System data field"
            className="app-select document-template-mapping-select"
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            value={value || ""}
        >
            <option value="">Do not map</option>
            {options.map((option) => (
                <optgroup key={option.group} label={option.group}>
                    {option.fields.map((field) => (
                        <option key={field.key} value={field.key}>
                            {field.label}
                        </option>
                    ))}
                </optgroup>
            ))}
        </select>
    );
}

function TemplateEditor({ editor, onClose, onSaved }) {
    const [mappings, setMappings] = useState(
        () => editor.active_version?.mappings || [],
    );
    const [selectedFieldName, setSelectedFieldName] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [pageNumber, setPageNumber] = useState(1);
    const fieldOptions = editor.field_catalog || [];
    const activeVersion = editor.active_version;
    const supportedFormFields = useMemo(
        () => (editor.form_fields || []).filter((field) => field.supported),
        [editor.form_fields],
    );
    const overlayFields = mappings.filter((field) => field.field_type === "overlay");
    const updateFormMapping = (fieldName, systemField) => {
        setMappings((current) => {
            const existing = current.find(
                (field) => field.field_name === fieldName,
            );
            if (!systemField) {
                return current.filter((field) => field.field_name !== fieldName);
            }
            if (existing) {
                return current.map((field) =>
                    field.field_name === fieldName
                        ? { ...field, system_field: systemField }
                        : field,
                );
            }
            return [
                ...current,
                {
                    field_name: fieldName,
                    field_type: "acroform",
                    system_field: systemField,
                    is_required: false,
                },
            ];
        });
    };

    const addOverlay = () => {
        const fieldName = `overlay-${crypto.randomUUID()}`;
        const firstSystemField = fieldOptions[0]?.fields[0]?.key || "";
        const field = {
            field_name: fieldName,
            field_type: "overlay",
            system_field: firstSystemField,
            page_number: pageNumber,
            x: 0.12,
            y: 0.12,
            width: 0.42,
            height: 0.06,
            font_size: 12,
            font_family: "Helvetica",
            text_align: "left",
            is_required: false,
        };
        setMappings((current) => [...current, field]);
        setSelectedFieldName(fieldName);
    };

    const updateField = (fieldName, updates) => {
        setMappings((current) =>
            current.map((field) =>
                field.field_name === fieldName
                    ? { ...field, ...updates }
                    : field,
            ),
        );
    };

    const removeField = (fieldName) => {
        setMappings((current) =>
            current.filter((field) => field.field_name !== fieldName),
        );
        if (selectedFieldName === fieldName) setSelectedFieldName("");
    };

    const saveMappings = async () => {
        if (!activeVersion) return;
        setSaving(true);
        setError("");
        setMessage("");
        try {
            const response = await api.put(
                `/admin/document-template-versions/${activeVersion.template_version_id}/mappings`,
                { fields: mappings },
            );
            setMappings(response.data.data.mappings);
            setMessage("PDF field mappings saved.");
            await onSaved();
        } catch (saveError) {
            console.error(saveError);
            setError(
                getErrorMessage(
                    saveError,
                    "The PDF field mappings could not be saved.",
                ),
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="document-template-modal-backdrop">
            <section
                aria-labelledby="document-template-editor-title"
                aria-modal="true"
                className="document-template-modal document-template-editor-modal"
                role="dialog"
            >
                <header className="document-template-modal-header">
                    <div>
                        <p className="section-label">PDF TEMPLATE EDITOR</p>
                        <h2 id="document-template-editor-title">
                            {editor.document_type.document_name}
                        </h2>
                        {activeVersion && (
                            <p>
                                {activeVersion.filename} · Version{" "}
                                {activeVersion.version_number}
                            </p>
                        )}
                    </div>
                    <button
                        aria-label="Close template editor"
                        className="document-template-close"
                        onClick={onClose}
                        type="button"
                    >
                        ×
                    </button>
                </header>

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

                {activeVersion ? (
                    <div className="document-template-editor-grid">
                        <section className="document-template-canvas-panel">
                            {activeVersion.page_count > 1 && (
                                <div className="document-template-page-picker">
                                    <label htmlFor="template-page-number">
                                        Select PDF page
                                    </label>
                                    <select
                                        className="app-select"
                                        id="template-page-number"
                                        onChange={(event) =>
                                            setPageNumber(Number(event.target.value))
                                        }
                                        value={pageNumber}
                                    >
                                        {Array.from(
                                            { length: activeVersion.page_count },
                                            (_, index) => index + 1,
                                        ).map((page) => (
                                            <option key={page} value={page}>
                                                Page {page}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <PdfDocumentCanvas
                                editable
                                fields={mappings}
                                onChangeField={(field) =>
                                    updateField(field.field_name, field)
                                }
                                onSelectField={setSelectedFieldName}
                                selectedFieldName={selectedFieldName}
                                source={editor.source_url}
                            />
                            <button
                                className="app-button app-button-outline-primary document-template-add-field"
                                onClick={addOverlay}
                                type="button"
                            >
                                Add Text Field
                            </button>
                            <p className="document-template-editor-help">
                                Drag a box to move it. Use its corner handle to
                                resize. Positions are saved relative to the PDF
                                page, not the current zoom.
                            </p>
                        </section>

                        <aside className="document-template-fields-panel">
                            {editor.form_fields?.length > 0 && (
                                <section>
                                    <h3>Fillable PDF fields</h3>
                                    {editor.form_fields
                                        .filter((field) => !field.supported)
                                        .map((field) => (
                                            <p
                                                className="document-template-warning"
                                                key={field.name}
                                            >
                                                {field.name} is not a supported
                                                text or choice field.
                                            </p>
                                        ))}
                                    {supportedFormFields.length === 0 && (
                                        <p className="document-template-muted">
                                            No supported text fields were found.
                                        </p>
                                    )}
                                    {supportedFormFields.map((field) => {
                                        const mapping = mappings.find(
                                            (item) =>
                                                item.field_name === field.name,
                                        );
                                        return (
                                            <div
                                                className="document-template-field-row"
                                                key={field.name}
                                            >
                                                <strong title={field.name}>
                                                    {field.name}
                                                </strong>
                                                <MappingSelect
                                                    onChange={(systemField) =>
                                                        updateFormMapping(
                                                            field.name,
                                                            systemField,
                                                        )
                                                    }
                                                    options={fieldOptions}
                                                    value={mapping?.system_field}
                                                />
                                                {mapping && (
                                                    <label className="document-template-required">
                                                        <input
                                                            checked={mapping.is_required}
                                                            onChange={(event) =>
                                                                updateField(
                                                                    field.name,
                                                                    {
                                                                        is_required:
                                                                            event
                                                                                .target
                                                                                .checked,
                                                                    },
                                                                )
                                                            }
                                                            type="checkbox"
                                                        />
                                                        Required
                                                    </label>
                                                )}
                                            </div>
                                        );
                                    })}
                                </section>
                            )}

                            <section>
                                <h3>Visual text fields</h3>
                                {overlayFields.length === 0 ? (
                                    <p className="document-template-muted">
                                        Add a text field to place information on
                                        this PDF.
                                    </p>
                                ) : (
                                    overlayFields.map((field) => (
                                        <div
                                            className={`document-template-field-row ${
                                                selectedFieldName ===
                                                field.field_name
                                                    ? "is-selected"
                                                    : ""
                                            }`}
                                            key={field.field_name}
                                            onClick={() =>
                                                setSelectedFieldName(
                                                    field.field_name,
                                                )
                                            }
                                        >
                                            <div className="document-template-field-heading">
                                                <strong>
                                                    Page {field.page_number}
                                                </strong>
                                                <button
                                                    className="document-template-remove-field"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        removeField(
                                                            field.field_name,
                                                        );
                                                    }}
                                                    type="button"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <MappingSelect
                                                onChange={(systemField) =>
                                                    updateField(
                                                        field.field_name,
                                                        {
                                                            system_field:
                                                                systemField,
                                                        },
                                                    )
                                                }
                                                options={fieldOptions}
                                                value={field.system_field}
                                            />
                                            <div className="document-template-field-options">
                                                <label>
                                                    Font size
                                                    <input
                                                        className="app-input"
                                                        max="48"
                                                        min="6"
                                                        onChange={(event) =>
                                                            updateField(
                                                                field.field_name,
                                                                {
                                                                    font_size:
                                                                        Number(
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        ),
                                                                },
                                                            )
                                                        }
                                                        type="number"
                                                        value={field.font_size}
                                                    />
                                                </label>
                                                <label>
                                                    Font
                                                    <select
                                                        className="app-select"
                                                        onChange={(event) =>
                                                            updateField(
                                                                field.field_name,
                                                                {
                                                                    font_family:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                        value={
                                                            field.font_family ||
                                                            "Helvetica"
                                                        }
                                                    >
                                                        <option value="Helvetica">
                                                            Helvetica
                                                        </option>
                                                        <option value="Helvetica-Bold">
                                                            Helvetica Bold
                                                        </option>
                                                        <option value="Times-Roman">
                                                            Times Roman
                                                        </option>
                                                        <option value="Courier">
                                                            Courier
                                                        </option>
                                                    </select>
                                                </label>
                                                <label>
                                                    Alignment
                                                    <select
                                                        className="app-select"
                                                        onChange={(event) =>
                                                            updateField(
                                                                field.field_name,
                                                                {
                                                                    text_align:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                        value={
                                                            field.text_align ||
                                                            "left"
                                                        }
                                                    >
                                                        <option value="left">
                                                            Left
                                                        </option>
                                                        <option value="center">
                                                            Center
                                                        </option>
                                                        <option value="right">
                                                            Right
                                                        </option>
                                                    </select>
                                                </label>
                                            </div>
                                            <label className="document-template-required">
                                                <input
                                                    checked={field.is_required}
                                                    onChange={(event) =>
                                                        updateField(
                                                            field.field_name,
                                                            {
                                                                is_required:
                                                                    event.target
                                                                        .checked,
                                                            },
                                                        )
                                                    }
                                                    type="checkbox"
                                                />
                                                Required information
                                            </label>
                                        </div>
                                    ))
                                )}
                            </section>

                            <button
                                className="app-button app-button-primary document-template-save-mappings"
                                disabled={saving || mappings.length === 0}
                                onClick={saveMappings}
                                type="button"
                            >
                                {saving ? "Saving..." : "Save Field Mappings"}
                            </button>
                        </aside>
                    </div>
                ) : (
                    <p className="document-template-muted">
                        Upload a PDF template to configure its fields.
                    </p>
                )}

                {editor.versions?.length > 0 && (
                    <section className="document-template-history">
                        <h3>Template Version History</h3>
                        <div className="document-template-history-list">
                            {editor.versions.map((version) => (
                                <div key={version.template_version_id}>
                                    <span>
                                        Version {version.version_number} ·{" "}
                                        {version.filename} · Uploaded{" "}
                                        {formatDate(version.uploaded_at)}
                                        {version.is_active ? " · Active" : ""}
                                    </span>
                                    <button
                                        className="app-button app-button-outline-secondary"
                                        onClick={() =>
                                            editor.downloadVersion(version)
                                        }
                                        type="button"
                                    >
                                        Download
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </section>
        </div>
    );
}

export default function DocumentTemplates() {
    const inputRef = useRef(null);
    const targetTypeRef = useRef(null);
    const editorUrlRef = useRef(null);
    const [templates, setTemplates] = useState([]);
    const [upload, setUpload] = useState(null);
    const [editor, setEditor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");
    const [loadError, setLoadError] = useState("");
    const [notice, setNotice] = useState("");
    const [detailLoading, setDetailLoading] = useState(false);

    const loadTemplates = useCallback(async () => {
        setLoading(true);
        setError("");
        setLoadError("");
        try {
            const response = await api.get("/admin/document-templates");
            setTemplates(response.data.data.document_types || []);
        } catch (loadError) {
            console.error(loadError);
            setLoadError(
                getErrorMessage(
                    loadError,
                    "Document templates could not be loaded.",
                ),
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        Promise.resolve().then(loadTemplates);
    }, [loadTemplates]);

    useEffect(
        () => () => {
            if (upload?.preview_url) URL.revokeObjectURL(upload.preview_url);
            if (editorUrlRef.current) {
                URL.revokeObjectURL(editorUrlRef.current);
            }
        },
        [upload],
    );

    const chooseFile = (documentType) => {
        if (
            documentType.active_version &&
            !window.confirm(
                "Replace the active PDF template? The current file remains available until the new PDF is validated and saved.",
            )
        ) {
            return;
        }
        targetTypeRef.current = documentType;
        if (inputRef.current) {
            inputRef.current.value = "";
            inputRef.current.click();
        }
    };

    const onChooseFile = (event) => {
        const file = event.target.files?.[0];
        const documentType = targetTypeRef.current;
        if (!file || !documentType) return;

        if (
            file.name.split(".").pop()?.toLowerCase() !== "pdf" ||
            (file.type && file.type !== "application/pdf")
        ) {
            setError("Choose a valid PDF file.");
            return;
        }

        setError("");
        setNotice("");
        if (upload?.preview_url) URL.revokeObjectURL(upload.preview_url);
        setUpload({
            documentType,
            file,
            preview_url: URL.createObjectURL(file),
        });
    };

    const cancelUpload = () => {
        if (upload?.preview_url) URL.revokeObjectURL(upload.preview_url);
        setUpload(null);
        setUploading(false);
        setProgress(0);
    };

    const submitUpload = async () => {
        if (!upload) return;
        const formData = new FormData();
        formData.append("file", upload.file);
        setUploading(true);
        setProgress(0);
        setError("");
        try {
            await api.post(
                `/admin/document-templates/${upload.documentType.document_type_id}/versions`,
                formData,
                {
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            setProgress(
                                Math.round(
                                    (progressEvent.loaded / progressEvent.total) *
                                        100,
                                ),
                            );
                        }
                    },
                },
            );
            const documentType = upload.documentType;
            cancelUpload();
            setNotice(`${documentType.document_name} template uploaded.`);
            await loadTemplates();
            await openEditor(documentType);
        } catch (uploadError) {
            console.error(uploadError);
            setError(
                getErrorMessage(
                    uploadError,
                    "The PDF template could not be uploaded.",
                ),
            );
        } finally {
            setUploading(false);
        }
    };

    const downloadVersion = async (version) => {
        try {
            const response = await api.get(
                `/admin/document-template-versions/${version.template_version_id}/file`,
                { params: { download: 1 }, responseType: "blob" },
            );
            const objectUrl = URL.createObjectURL(response.data);
            const anchor = document.createElement("a");
            anchor.href = objectUrl;
            anchor.download = version.filename || "document-template.pdf";
            anchor.click();
            URL.revokeObjectURL(objectUrl);
        } catch (downloadError) {
            console.error(downloadError);
            setError(
                getErrorMessage(
                    downloadError,
                    "The PDF template could not be downloaded.",
                ),
            );
        }
    };

    const openEditor = async (documentType) => {
        setDetailLoading(true);
        setError("");
        try {
            const response = await api.get(
                `/admin/document-templates/${documentType.document_type_id}`,
            );
            const detail = response.data.data;
            let sourceUrl = null;
            if (detail.active_version) {
                const fileResponse = await api.get(
                    `/admin/document-template-versions/${detail.active_version.template_version_id}/file`,
                    { responseType: "blob" },
                );
                sourceUrl = URL.createObjectURL(fileResponse.data);
            }
            if (editorUrlRef.current) {
                URL.revokeObjectURL(editorUrlRef.current);
            }
            editorUrlRef.current = sourceUrl;
            setEditor({
                ...detail,
                source_url: sourceUrl,
                downloadVersion,
            });
        } catch (detailError) {
            console.error(detailError);
            setError(
                getErrorMessage(
                    detailError,
                    "The PDF template details could not be loaded.",
                ),
            );
        } finally {
            setDetailLoading(false);
        }
    };

    const closeEditor = () => {
        if (editorUrlRef.current) {
            URL.revokeObjectURL(editorUrlRef.current);
            editorUrlRef.current = null;
        }
        setEditor(null);
    };

    const deleteTemplate = async (documentType) => {
        if (
            !window.confirm(
                `Deactivate the active ${documentType.document_name} template? Its history and generated documents will be preserved.`,
            )
        ) {
            return;
        }
        setError("");
        try {
            await api.delete(
                `/admin/document-templates/${documentType.document_type_id}`,
            );
            setNotice(`${documentType.document_name} template deactivated.`);
            await loadTemplates();
        } catch (deleteError) {
            console.error(deleteError);
            setError(
                getErrorMessage(
                    deleteError,
                    "The PDF template could not be deleted.",
                ),
            );
        }
    };

    return (
        <AdminLayout>
            <main className="admin-dashboard document-template-management">
                <header className="document-template-page-header">
                    <div>
                        <p className="section-label">ADMINISTRATION</p>
                        <h1>Document Templates</h1>
                        <p>
                            Upload official PDFs and map their fields to
                            verified resident, request, and barangay data.
                        </p>
                    </div>
                    <button
                        className="app-button app-button-outline-secondary"
                        onClick={loadTemplates}
                        type="button"
                    >
                        Refresh
                    </button>
                </header>

                {notice && (
                    <div className="app-alert app-alert-success" role="status">
                        {notice}
                    </div>
                )}
                {(error || loadError) && (
                    <div className="app-alert app-alert-danger" role="alert">
                        {error || loadError}
                    </div>
                )}
                {detailLoading && (
                    <div className="app-alert app-alert-info" role="status">
                        Loading PDF template details…
                    </div>
                )}
                {loading ? (
                    <p>Loading document types…</p>
                ) : loadError ? null : templates.length === 0 ? (
                    <div className="app-alert app-alert-warning" role="status">
                        No document types are configured in the database.
                    </div>
                ) : (
                    <div className="document-template-card-grid">
                        {templates.map((documentType) => {
                            const version = documentType.active_version;
                            return (
                                <article
                                    className="document-template-card"
                                    key={documentType.document_type_id}
                                >
                                    <div className="document-template-card-heading">
                                        <div>
                                            <span
                                                className={`document-template-status status-${documentType.template_status}`}
                                            >
                                                {documentType.template_status ===
                                                "active"
                                                    ? "Template active"
                                                    : documentType.template_status ===
                                                        "deleted"
                                                      ? "Template deleted"
                                                      : "No template uploaded"}
                                            </span>
                                            <h2>
                                                {documentType.document_name}
                                            </h2>
                                        </div>
                                        <span className="document-template-version">
                                            {version
                                                ? `v${version.version_number}`
                                                : "—"}
                                        </span>
                                    </div>
                                    <dl className="document-template-metadata">
                                        <div>
                                            <dt>Uploaded PDF</dt>
                                            <dd>{version?.filename || "—"}</dd>
                                        </div>
                                        <div>
                                            <dt>Uploaded</dt>
                                            <dd>
                                                {formatDate(version?.uploaded_at)}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>Last updated</dt>
                                            <dd>
                                                {formatDate(version?.updated_at)}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>Version history</dt>
                                            <dd>
                                                {documentType.versions.length}
                                            </dd>
                                        </div>
                                    </dl>
                                    <div className="document-template-card-actions">
                                        {version ? (
                                            <>
                                                <button
                                                    className="app-button app-button-outline-primary"
                                                    onClick={() =>
                                                        openEditor(documentType)
                                                    }
                                                    type="button"
                                                >
                                                    Preview &amp; Configure
                                                </button>
                                                <button
                                                    className="app-button app-button-outline-secondary"
                                                    onClick={() =>
                                                        downloadVersion(version)
                                                    }
                                                    type="button"
                                                >
                                                    Download
                                                </button>
                                                <button
                                                    className="app-button app-button-primary"
                                                    onClick={() =>
                                                        chooseFile(documentType)
                                                    }
                                                    type="button"
                                                >
                                                    Replace File
                                                </button>
                                                <button
                                                    className="app-button app-button-danger"
                                                    onClick={() =>
                                                        deleteTemplate(
                                                            documentType,
                                                        )
                                                    }
                                                    type="button"
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    className="app-button app-button-primary"
                                                    onClick={() =>
                                                        chooseFile(documentType)
                                                    }
                                                    type="button"
                                                >
                                                    Upload File
                                                </button>
                                                {documentType.versions.length >
                                                    0 && (
                                                    <button
                                                        className="app-button app-button-outline-secondary"
                                                        onClick={() =>
                                                            openEditor(
                                                                documentType,
                                                            )
                                                        }
                                                        type="button"
                                                    >
                                                        View History
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                <input
                    accept=".pdf,application/pdf"
                    hidden
                    onChange={onChooseFile}
                    ref={inputRef}
                    type="file"
                />
            </main>

            {upload && (
                <div className="document-template-modal-backdrop">
                    <section
                        aria-labelledby="document-template-upload-title"
                        aria-modal="true"
                        className="document-template-modal document-template-upload-modal"
                        role="dialog"
                    >
                        <header className="document-template-modal-header">
                            <div>
                                <p className="section-label">PDF UPLOAD</p>
                                <h2 id="document-template-upload-title">
                                    {upload.documentType.document_name}
                                </h2>
                                <p>
                                    {upload.file.name} ·{" "}
                                    {formatSize(upload.file.size)}
                                </p>
                            </div>
                            <button
                                aria-label="Close upload preview"
                                className="document-template-close"
                                disabled={uploading}
                                onClick={cancelUpload}
                                type="button"
                            >
                                ×
                            </button>
                        </header>
                        <PdfDocumentCanvas source={upload.preview_url} />
                        {uploading && (
                            <div
                                aria-label="Upload progress"
                                aria-valuemax="100"
                                aria-valuemin="0"
                                aria-valuenow={progress}
                                className="document-template-progress"
                                role="progressbar"
                            >
                                <span style={{ width: `${progress}%` }} />
                                <strong>{progress}%</strong>
                            </div>
                        )}
                        <div className="document-template-modal-actions">
                            <button
                                className="app-button app-button-primary"
                                disabled={uploading}
                                onClick={submitUpload}
                                type="button"
                            >
                                {uploading ? "Uploading…" : "Upload PDF"}
                            </button>
                            <button
                                className="app-button app-button-outline-secondary"
                                disabled={uploading}
                                onClick={cancelUpload}
                                type="button"
                            >
                                Cancel
                            </button>
                        </div>
                    </section>
                </div>
            )}
            {editor && (
                <TemplateEditor
                    key={
                        editor.active_version?.template_version_id ||
                        editor.document_type.document_type_id
                    }
                    editor={editor}
                    onClose={closeEditor}
                    onSaved={() => openEditor(editor.document_type)}
                />
            )}
        </AdminLayout>
    );
}
