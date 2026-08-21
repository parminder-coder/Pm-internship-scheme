import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";

export default function ProtectedRoute() {
    const { isLoggedIn } = useSelector((state) => state.loggedIn);

    if (!isLoggedIn) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
