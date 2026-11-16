const EVENT_NAME = "barangay-document-template-updated";
const STORAGE_KEY = "barangay-document-template-update";

export function publishDocumentTemplateUpdate(documentTypeId) {
    const update = { documentTypeId };
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: update }));

    try {
        window.localStorage.setItem(
            STORAGE_KEY,
            `${documentTypeId}:${Date.now()}`,
        );
    } catch (error) {
        console.error("Could not notify other tabs about a template update.", error);
    }
}

export function subscribeToDocumentTemplateUpdates(onUpdate) {
    const handleUpdate = (update) => {
        const documentTypeId = Number(update?.documentTypeId);
        if (!Number.isInteger(documentTypeId) || documentTypeId < 1) return;
        onUpdate({ documentTypeId });
    };
    const handleWindowUpdate = (event) => handleUpdate(event.detail);
    window.addEventListener(EVENT_NAME, handleWindowUpdate);

    const handleStorageUpdate = (event) => {
        if (event.key !== STORAGE_KEY || !event.newValue) return;
        const [documentTypeId] = event.newValue.split(":");
        handleUpdate({ documentTypeId });
    };
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
        window.removeEventListener(EVENT_NAME, handleWindowUpdate);
        window.removeEventListener("storage", handleStorageUpdate);
    };
}
