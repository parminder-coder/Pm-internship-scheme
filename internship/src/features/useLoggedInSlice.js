import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loginUser, verifyUserToken, logoutApiUser } from "../api/auth";

// Login user
export const authenticateAndLogin = createAsyncThunk(
    "loggedIn/authenticateAndLogin",
    async (credentials, { rejectWithValue }) => {
        try {
            const data = await loginUser(credentials);

            if (data.user) {
                localStorage.setItem("user", JSON.stringify(data.user));
            }

            return data;
        } catch (err) {
            return rejectWithValue(
                err.message || "Authentication failed"
            );
        }
    }
);

// Perform Logout
export const performLogout = createAsyncThunk(
    "loggedIn/performLogout",
    async (_, { dispatch }) => {
        try {
            await logoutApiUser();
        } catch (err) {
            console.warn("Logout API warning:", err);
        } finally {
            dispatch(logout());
        }
    }
);

// Check whether the user is still authenticated
export const checkBackendAuth = createAsyncThunk(
    "loggedIn/checkBackendAuth",
    async (_, { rejectWithValue }) => {
        try {
            const data = await verifyUserToken();
            return data;
        } catch (err) {
            localStorage.removeItem("user");

            return rejectWithValue(
                err.message || "Not authenticated"
            );
        }
    }
);

const savedUser = (() => {
    try {
        return localStorage.getItem("user")
            ? JSON.parse(localStorage.getItem("user"))
            : null;
    } catch {
        return null;
    }
})();

const initialState = {
    isLoggedIn: !!savedUser,
    user: savedUser,
    loading: false,
    error: null
};

const userLoggedInSlice = createSlice({
    name: "loggedIn",

    initialState,

    reducers: {
        setSession: (state, action) => {
            state.isLoggedIn = true;
            state.user = action.payload.user || null;
            state.error = null;
            if (action.payload.user) {
                localStorage.setItem("user", JSON.stringify(action.payload.user));
            }
        },
        logout: (state) => {
            state.isLoggedIn = false;
            state.user = null;
            state.error = null;

            localStorage.removeItem("user");
            localStorage.removeItem("candidateProfile");
            localStorage.removeItem("parsedResume");
        },
        updateUserFormFilled: (state) => {
            if (state.user) {
                state.user.isFormFilled = true;
                localStorage.setItem("user", JSON.stringify(state.user));
            }
        }
    },

    extraReducers: (builder) => {
        builder

            // LOGIN - pending
            .addCase(authenticateAndLogin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            // LOGIN - successful
            .addCase(authenticateAndLogin.fulfilled, (state, action) => {
                state.loading = false;
                state.isLoggedIn = true;
                state.user = action.payload.user || null;
                state.error = null;
            })

            // LOGIN - failed
            .addCase(authenticateAndLogin.rejected, (state, action) => {
                state.loading = false;
                state.isLoggedIn = false;
                state.user = null;
                state.error =
                    action.payload || "Authentication failed";
            })

            // CHECK AUTH - pending
            .addCase(checkBackendAuth.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            // CHECK AUTH - successful
            .addCase(checkBackendAuth.fulfilled, (state, action) => {
                state.loading = false;
                state.isLoggedIn = true;

                if (action.payload.user) {
                    state.user = action.payload.user;
                }

                state.error = null;
            })

            // CHECK AUTH - failed
            .addCase(checkBackendAuth.rejected, (state) => {
                state.loading = false;
                state.isLoggedIn = false;
                state.user = null;
                state.error = null;
            });
    }
});

export const { setSession, logout, updateUserFormFilled } = userLoggedInSlice.actions;

export default userLoggedInSlice.reducer;