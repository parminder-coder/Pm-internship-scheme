import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router";

export default function ProtectedRoute() {
    const { isLoggedIn, user } = useSelector((state) => state.loggedIn);
    const location = useLocation();

    if (!isLoggedIn) {
        return <Navigate to="/" replace />;
    }

    const isFormFilled = Boolean(user?.isFormFilled);

    if (!isFormFilled && location.pathname !== "/profileSetupForm") {
        return <Navigate to="/profileSetupForm" replace />;
    }

    return <Outlet />;
}
