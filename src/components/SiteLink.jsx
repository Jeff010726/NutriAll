import { Link } from "react-router-dom";

export function SiteLink({ to, children, ...props }) {
  return <Link to={to} {...props}>{children}</Link>;
}
