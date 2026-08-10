import { Link } from "react-router-dom";
import { trackEvent } from "../analytics";

export function SiteLink({ to, children, onClick, ...props }) {
  const handleClick = (event) => {
    if (typeof to === "string" && to.startsWith("/book")) trackEvent("booking_click", "book_link", { destination: to.split("?")[0] });
    onClick?.(event);
  };
  return <Link to={to} onClick={handleClick} {...props}>{children}</Link>;
}
