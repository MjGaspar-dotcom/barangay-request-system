import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const alertVariants = cva(
    "relative w-full rounded-lg border px-4 py-3 text-sm",
    {
        variants: {
            variant: {
                default: "bg-background text-foreground",
                destructive:
                    "border-destructive/50 text-destructive [&>svg]:text-current",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
);

export function Alert({ className, variant, ...props }) {
    return (
        <div
            className={cn(alertVariants({ variant }), className)}
            data-slot="alert"
            {...props}
        />
    );
}

export function AlertTitle({ className, ...props }) {
    return (
        <div
            className={cn("font-semibold leading-none tracking-tight", className)}
            data-slot="alert-title"
            {...props}
        />
    );
}

export function AlertDescription({ className, ...props }) {
    return (
        <div
            className={cn("text-sm leading-relaxed", className)}
            data-slot="alert-description"
            {...props}
        />
    );
}

export function AlertAction({ className, ...props }) {
    return (
        <div
            className={cn("col-start-2 row-start-3", className)}
            data-slot="alert-action"
            {...props}
        />
    );
}
