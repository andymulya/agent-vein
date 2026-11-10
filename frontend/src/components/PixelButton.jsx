/**
 * Pixel-styled button. Variants: default (gold), "mint", "ghost".
 * `small` matches the compact header size.
 */
export default function PixelButton({
  children,
  variant,
  small,
  className = "",
  ...props
}) {
  const variantClass =
    variant === "mint" ? "mint" : variant === "ghost" ? "ghost" : "";
  return (
    <button
      type="button"
      className={`btn ${variantClass} ${small ? "small" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
