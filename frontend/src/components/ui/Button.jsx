import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90",
                destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline: "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
                "outline-destructive": "border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground",
                "outline-success": "border border-primary text-primary hover:bg-primary hover:text-primary-foreground",
                "outline-warning": "border border-warning text-warning hover:bg-warning/10",
                secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-8 rounded-md px-3 text-xs",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

const variantMap = {
    primary: "default",
    success: "default",
    danger: "destructive",
    "outline-primary": "outline",
    "outline-success": "outline-success",
    "outline-danger": "outline-destructive",
    "outline-secondary": "outline",
    "outline-warning": "outline-warning",
    info: "secondary",
    warning: "secondary",
};

export default function Button({
    variant = "default",
    size,
    loading = false,
    loadingLabel = "Loading",
    disabled = false,
    type = "button",
    className,
    ...props
}) {
    const classVariant = className
        ?.split(/\s+/)
        .map((classNamePart) => classNamePart.replace(/^app-button-/, ""))
        .find((classNamePart) => variantMap[classNamePart]);
    const classSize = className?.split(/\s+/).includes("app-button-sm")
        ? "sm"
        : size;
    const resolvedVariant =
        variant === "default" && classVariant
            ? variantMap[classVariant]
            : variantMap[variant] || variant;
    return (
        <button
            type={type}
            className={cn(buttonVariants({ variant: resolvedVariant, size: classSize }), "app-button", className)}
            {...props}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            aria-label={loading ? loadingLabel : props["aria-label"]}
        />
    );
}
