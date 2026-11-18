import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import DocxDocumentPreview from "../../components/documents/DocxDocumentPreview";
import PdfDocumentCanvas from "../../components/documents/PdfDocumentCanvas";
import api from "../../services/api";
import { publishDocumentTemplateUpdate } from "../../utils/documentTemplateUpdates";
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

function DocumentTemplateSkeleton() {
    return (
        <div
            className="document-template-skeleton-grid"
            role="status"
            aria-label="Loading document templates"
        >
            {Array.from({ length: 4 }, (_, index) => (
                <article
                    className="document-template-skeleton-card"
                    key={index}
                    aria-hidden="true"
                >
                    <div className="document-template-skeleton-heading">
                        <div>
                            <span className="skeleton-status" />
                            <span className="skeleton-title" />
                        </div>
                        <span className="skeleton-version" />
                    </div>
                    <div className="document-template-skeleton-metadata">
                        {Array.from({ length: 4 }, (_, row) => (
                            <div key={row}>
                                <span />
                                <span />
                            </div>
                        ))}
                    </div>
                    <div className="document-template-skeleton-actions">
                        <span />
                        <span />
                        <span />
                    </div>
                </article>
            ))}
        </div>
    );
}

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
    const [showFieldEditor, setShowFieldEditor] = useState(false);
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
    const docxPlaceholders = useMemo(
        () =>
            (editor.form_fields || []).filter(
                (field) => field.type === "/DocxPlaceholder",
            ),
        [editor.form_fields],
    );
    const isDocxTemplate = activeVersion?.filename
        ?.toLowerCase()
        .endsWith(".docx");
    const hasUnmappedDocxPlaceholders =
        isDocxTemplate &&
        docxPlaceholders.some(
            (field) =>
                !mappings.some(
                    (mapping) =>
                        mapping.field_name === field.name &&
                        mapping.system_field,
                ),
        );
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
                    field_type: docxPlaceholders.some(
                        (field) => field.name === fieldName,
                    )
                        ? "docx_placeholder"
                        : "acroform",
                    system_field: systemField,
                    is_required: false,
                },
            ];
        });
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
            setMessage("Document template mappings saved.");
            await onSaved();
        } catch (saveError) {
            console.error(saveError);
            setError(
                getErrorMessage(
                    saveError,
                    "The document template mappings could not be saved.",
                ),
            );
        } finally {
            setSaving(false);
        }
    };

    if (isDocxTemplate && !showFieldEditor) {
        return (
            <div className="document-template-modal-backdrop">
                <section
                    aria-label={`${editor.document_type.document_name} template preview`}
                    aria-modal="true"
                    className="document-template-modal document-template-preview-only-modal"
                    role="dialog"
                >
                    <div className="document-template-preview-only-toolbar">
                        <button
                            className="app-button app-button-outline-secondary"
                            onClick={() => setShowFieldEditor(true)}
                            type="button"
                        >
                            Configure fields
                        </button>
                        <button
                            aria-label="Close document preview"
                            className="document-template-close"
                            onClick={onClose}
                            type="button"
                        >
                            ×
                        </button>
                    </div>
                    <DocxDocumentPreview source={editor.source_url} />
                </section>
            </div>
        );
    }

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
                        <p className="section-label">DOCUMENT TEMPLATE EDITOR</p>
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
                    <div className="document-template-modal-header-actions">
                        {isDocxTemplate && (
                            <button
                                className="app-button app-button-outline-secondary"
                                onClick={() => setShowFieldEditor(false)}
                                type="button"
                            >
                                Back to preview
                            </button>
                        )}
                        <button
                            aria-label="Close template editor"
                            className="document-template-close"
                            onClick={onClose}
                            type="button"
                        >
                            ×
                        </button>
                    </div>
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
                            {isDocxTemplate ? (
                                <>
                                    <div className="app-alert app-alert-info">
                                        DOCX layout is previewed here. Use
                                        {" "}
                                        {`{{PLACEHOLDER_NAME}}`} tags in the
                                        Word document; the system replaces them
                                        and converts the result to PDF for pickup.
                                    </div>
                                    <DocxDocumentPreview
                                        source={editor.source_url}
                                    />
                                    <button
                                        className="app-button app-button-outline-secondary"
                                        onClick={() =>
                                            editor.downloadVersion(activeVersion)
                                        }
                                        type="button"
                                    >
                                        Download DOCX
                                    </button>
                                </>
                            ) : activeVersion.page_count > 1 ? (
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
                            ) : null}
                            {!isDocxTemplate && (
                                <PdfDocumentCanvas
                                    editable={false}
                                    fields={mappings}
                                    onChangeField={(field) =>
                                        updateField(field.field_name, field)
                                    }
                                    onSelectField={setSelectedFieldName}
                                    selectedFieldName={selectedFieldName}
                                    source={editor.source_url}
                                />
                            )}
                        </section>

                        <aside className="document-template-fields-panel">
                            {isDocxTemplate && (
                                <section>
                                    <h3>DOCX placeholder mapping</h3>
                                    <p className="document-template-muted">
                                        Map every detected tag to a system field.
                                        Tags can appear in paragraphs, tables,
                                        headers, and footers.
                                    </p>
                                    {docxPlaceholders.length === 0 ? (
                                        <p className="document-template-muted">
                                            No tags were detected. Add tags such
                                            as {"{{FULL_NAME}}"} to the DOCX
                                            template and upload it again.
                                        </p>
                                    ) : (
                                        <ul className="document-template-mapping-summary">
                                            {docxPlaceholders.map((field) => (
                                                <li key={field.name}>
                                                    <strong>{field.name}</strong>
                                                    <MappingSelect
                                                        disabled={saving}
                                                        onChange={(systemField) =>
                                                            updateFormMapping(
                                                                field.name,
                                                                systemField,
                                                            )
                                                        }
                                                        options={fieldOptions}
                                                        value={
                                                            mappings.find(
                                                                (mapping) =>
                                                                    mapping.field_name ===
                                                                    field.name,
                                                            )?.system_field
                                                        }
                                                    />
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            )}
                            <section>
                                <h3>Automatic field mapping</h3>
                                <p className="document-template-muted">
                                    The system maps recognized resident, request,
                                    and barangay fields automatically.
                                </p>
                                {mappings.length === 0 ? (
                                    <p className="document-template-muted">
                                        No standard template fields were detected.
                                    </p>
                                ) : (
                                    <ul className="document-template-mapping-summary">
                                        {mappings.map((field) => (
                                            <li key={field.field_name}>
                                                <strong>{field.field_name}</strong>
                                                <span>→ {field.system_field}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        </aside>
                    </div>
                ) : (
                    <p className="document-template-muted">
                        Upload a PDF or DOCX template for the system to process.
                    </p>
                )}

                {activeVersion && (
                    <div className="document-template-modal-actions">
                        <button
                            className="app-button app-button-primary"
                            disabled={
                                saving ||
                                mappings.length === 0 ||
                                hasUnmappedDocxPlaceholders
                            }
                            onClick={saveMappings}
                            type="button"
                        >
                            {saving ? "Saving…" : "Save Mappings"}
                        </button>
                    </div>
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
    const [confirmDialog, setConfirmDialog] = useState(null);

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

    const openFilePicker = (documentType) => {
        targetTypeRef.current = documentType;
        if (inputRef.current) {
            inputRef.current.value = "";
            inputRef.current.click();
        }
    };

    const chooseFile = (documentType) => {
        if (documentType.active_version) {
            setConfirmDialog({
                title: "Replace active template?",
                message:
                    "The current file remains available until the new file is validated and saved.",
                confirmLabel: "Choose replacement",
                variant: "primary",
                onConfirm: () => openFilePicker(documentType),
            });
            return;
        }
        openFilePicker(documentType);
    };

    const onChooseFile = (event) => {
        const file = event.target.files?.[0];
        const documentType = targetTypeRef.current;
        if (!file || !documentType) return;

        const extension = file.name.split(".").pop()?.toLowerCase();
        if (!["pdf", "docx"].includes(extension)) {
            setError("Choose a PDF or DOCX file.");
            return;
        }

        setError("");
        setNotice("");
        if (upload?.preview_url) URL.revokeObjectURL(upload.preview_url);
        setUpload({
            documentType,
            file,
            preview_url:
                extension === "pdf" ? URL.createObjectURL(file) : null,
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
            publishDocumentTemplateUpdate(documentType.document_type_id);
            cancelUpload();
            setNotice(`${documentType.document_name} template uploaded.`);
            await loadTemplates();
        } catch (uploadError) {
            console.error(uploadError);
            setError(
                getErrorMessage(
                    uploadError,
                    "The document template could not be uploaded.",
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
                    "The document template could not be downloaded.",
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
                    "The document template details could not be loaded.",
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

    const deleteTemplate = (documentType) => {
        setConfirmDialog({
            title: "Delete active template?",
            message: `Delete the active ${documentType.document_name} template? Its history and generated documents will be preserved.`,
            confirmLabel: "Delete template",
            variant: "danger",
            onConfirm: () => void performDeleteTemplate(documentType),
        });
    };

    const performDeleteTemplate = async (documentType) => {
        setError("");
        try {
            await api.delete(
                `/admin/document-templates/${documentType.document_type_id}`,
            );
            publishDocumentTemplateUpdate(documentType.document_type_id);
            setNotice(`${documentType.document_name} template deactivated.`);
            await loadTemplates();
        } catch (deleteError) {
            console.error(deleteError);
            setError(
                getErrorMessage(
                    deleteError,
                    "The document template could not be deleted.",
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
                            Upload an official PDF or DOCX file for each
                            document type. DOCX templates can use
                            {" "}
                            {`{{PLACEHOLDER_NAME}}`} tags that are filled from
                            request and resident data; generated documents are
                            PDFs. Requests need an active uploaded template
                            before they can be approved for pickup.
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
                        Loading document template details…
                    </div>
                )}
                {loading ? (
                    <DocumentTemplateSkeleton />
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
                                            <dt>Uploaded file</dt>
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
                                                    Preview
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
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
                                <p className="section-label">DOCUMENT TEMPLATE UPLOAD</p>
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
                        {upload.preview_url ? (
                            <PdfDocumentCanvas source={upload.preview_url} />
                        ) : upload.file.name.toLowerCase().endsWith(".docx") ? (
                            <>
                                <DocxDocumentPreview source={upload.file} />
                                <div className="app-alert app-alert-info">
                                    Check the Word layout and add tags such as
                                    {" "}
                                    {`{{FULL_NAME}}`} and {`{{PURPOSE}}`}. The
                                    system fills the tags and creates a PDF
                                    when generating a resident document.
                                </div>
                            </>
                        ) : (
                            <div className="app-alert app-alert-info">
                                Upload a DOCX template with tags such as
                                {" "}
                                {`{{FULL_NAME}}`} and {`{{PURPOSE}}`}. The
                                system fills the tags and converts it to PDF
                                when generating a resident document.
                            </div>
                        )}
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
                                {uploading ? "Uploading…" : "Upload Template"}
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
            <ConfirmDialog
                confirmLabel={confirmDialog?.confirmLabel}
                isOpen={Boolean(confirmDialog)}
                onClose={() => setConfirmDialog(null)}
                onConfirm={() => {
                    const action = confirmDialog?.onConfirm;
                    setConfirmDialog(null);
                    action?.();
                }}
                title={confirmDialog?.title}
                variant={confirmDialog?.variant}
            >
                {confirmDialog?.message}
            </ConfirmDialog>
        </AdminLayout>
    );
}
