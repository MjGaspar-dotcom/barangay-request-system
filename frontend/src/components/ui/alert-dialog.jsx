import { DialogClose, DialogContent } from "./dialog";
import { Dialog } from "./dialog";
import Button from "./Button";
import { cn } from "../../lib/utils";
import "./alert-dialog.css";

export const AlertDialog = Dialog;

export function AlertDialogContent({ className, ...props }) {
    const preventDismiss = (event) => event.preventDefault();

    return (
        <DialogContent
            aria-modal="true"
            className={cn("alert-dialog-content", className)}
            onEscapeKeyDown={preventDismiss}
            onPointerDownOutside={preventDismiss}
            role="alertdialog"
            showCloseButton={false}
            {...props}
        />
    );
}

export function AlertDialogHeader({ className, ...props }) {
    return (
        <div
            className={cn("alert-dialog-header", className)}
            data-slot="alert-dialog-header"
            {...props}
        />
    );
}

export function AlertDialogMedia({ className, ...props }) {
    return (
        <div
            className={cn("alert-dialog-media", className)}
            data-slot="alert-dialog-media"
            {...props}
        />
    );
}

export function AlertDialogTitle({ className, ...props }) {
    return (
        <div
            className={cn("alert-dialog-title", className)}
            data-slot="alert-dialog-title"
            {...props}
        />
    );
}

export function AlertDialogDescription({ className, ...props }) {
    return (
        <div
            className={cn("alert-dialog-description", className)}
            data-slot="alert-dialog-description"
            {...props}
        />
    );
}

export function AlertDialogFooter({ className, ...props }) {
    return (
        <div
            className={cn("alert-dialog-footer", className)}
            data-slot="alert-dialog-footer"
            {...props}
        />
    );
}

export function AlertDialogCancel({ className, ...props }) {
    return (
        <DialogClose asChild>
            <Button
                className={cn("app-button app-button-outline-secondary", className)}
                type="button"
                {...props}
            />
        </DialogClose>
    );
}

export function AlertDialogAction({ className, ...props }) {
    const variantClass =
        props.variant === "danger" ? "app-button-danger" : "app-button-primary";

    return (
        <Button
            className={cn("app-button", variantClass, className)}
            type="button"
            {...props}
        />
    );
}
