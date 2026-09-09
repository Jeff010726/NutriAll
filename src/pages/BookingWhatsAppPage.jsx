import { Navigate, useLocation } from "react-router-dom";

export function BookingWhatsAppPage() {
  const { search } = useLocation();
  return <Navigate replace to={`/book${search}`} />;
}
