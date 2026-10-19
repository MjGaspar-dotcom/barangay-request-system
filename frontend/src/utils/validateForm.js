/**
 * Accessible, inline form validation.
 * Prevents native browser validation popups and renders field-level feedback.
 */
export function validateForm(form) {
    if (!form) return false;

    const fields = Array.from(form.querySelectorAll(
        "input, select, textarea"
    )).filter((field) => !field.disabled && field.type !== "button" &&
        field.type !== "submit" && field.type !== "reset");

    let firstInvalid = null;

    fields.forEach((field) => {
        const wrapper = field.closest(".mb-3, .mb-4, .form-group, .portal-form-group, .col-md-6, .col-md-12") || field.parentElement;
        let message = "";

        if (field.required && !String(field.value || "").trim() &&
            field.type !== "file") {
            const label = field.labels?.[0]?.textContent?.trim();
            message = `${label || "This field"} is required.`;
        } else if (field.required && field.type === "file" && !field.files?.length) {
            message = "Please select a file.";
        } else if (field.type === "email" && field.value.trim() && !field.validity.valid) {
            message = "Enter a valid email address.";
        } else if (field.validity?.valid === false && field.value) {
            if (field.type === "tel") message = "Enter a valid phone number.";
            else if (field.type === "date") message = "Enter a valid date.";
            else if (field.minLength > 0 && field.value.length < field.minLength) {
                message = `Enter at least ${field.minLength} characters.`;
            } else if (field.maxLength > 0 && field.value.length > field.maxLength) {
                message = `Enter no more than ${field.maxLength} characters.`;
            } else {
                message = "Please check this value.";
            }
        }

        let feedback = wrapper?.querySelector(`[data-validation-for="${field.id}"]`);
        if (message) {
            field.classList.add("is-invalid");
            field.setAttribute("aria-invalid", "true");
            if (!firstInvalid) firstInvalid = field;
            if (wrapper && field.id) {
                if (!feedback) {
                    feedback = document.createElement("div");
                    feedback.className = "invalid-feedback d-block portal-validation-message";
                    feedback.dataset.validationFor = field.id;
                    feedback.id = `${field.id}-validation-message`;
                    feedback.setAttribute("role", "status");
                    const icon = document.createElement("i");
                    icon.className = "bi bi-exclamation-circle-fill";
                    icon.setAttribute("aria-hidden", "true");
                    const text = document.createElement("span");
                    feedback.append(icon, text);
                    (field.closest(".portal-form-password") || field)
                        .insertAdjacentElement("afterend", feedback);
                }
                feedback.querySelector("span").textContent = message;
                field.setAttribute("aria-describedby", feedback.id);
            }
        } else {
            field.classList.remove("is-invalid");
            field.removeAttribute("aria-invalid");
            if (feedback) feedback.remove();
            if (field.getAttribute("aria-describedby")?.endsWith("-validation-message")) {
                field.removeAttribute("aria-describedby");
            }
        }

        if (!field.dataset.validationBound) {
            const clearFieldError = () => {
                if (field.checkValidity()) {
                    field.classList.remove("is-invalid");
                    field.removeAttribute("aria-invalid");
                    const currentFeedback = field.id
                        ? form.querySelector(`[data-validation-for="${field.id}"]`)
                        : null;
                    if (currentFeedback) currentFeedback.remove();
                    if (field.getAttribute("aria-describedby")?.endsWith("-validation-message")) {
                        field.removeAttribute("aria-describedby");
                    }
                }
            };
            field.addEventListener("input", clearFieldError);
            field.addEventListener("change", clearFieldError);
            field.dataset.validationBound = "true";
        }
    });

    if (firstInvalid) {
        firstInvalid.focus({ preventScroll: false });
        return false;
    }
    return true;
}
