export function Button({
  variant = "ghost",
  size,
  icon: Icon,
  children,
  className = "",
  type = "button",
  ...props
}) {
  const variantClass = {
    primary: "btn-primary",
    dark: "btn-dark",
    jade: "btn-jade",
    ghost: "btn-ghost",
    quiet: "btn-quiet",
    danger: "btn-danger"
  }[variant];
  const sizeClass = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "";
  return (
    <button type={type} className={`btn ${variantClass} ${sizeClass} ${className}`} {...props}>
      {Icon ? <Icon size={size === "sm" ? 16 : 18} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, label, className = "", ...props }) {
  return (
    <button type="button" className={`icon-btn ${className}`} aria-label={label} title={label} {...props}>
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}
