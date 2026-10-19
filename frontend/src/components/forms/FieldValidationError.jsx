import {
    FieldValidationErrorIcon,
    FieldValidationErrorRoot,
} from "./FieldValidationError.styles";

export default function FieldValidationError({ id, error }) {
    const message = typeof error === "string" ? error : error?.message;

    if (!message) {
        return null;
    }

    return (
        <FieldValidationErrorRoot
            id={id}
            role="status"
            aria-live="polite"
            aria-atomic="true"
        >
            <FieldValidationErrorIcon aria-hidden="true" />

            <span>{message}</span>
        </FieldValidationErrorRoot>
    );
}
