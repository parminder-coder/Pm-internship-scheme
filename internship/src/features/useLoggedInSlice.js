import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loginUser, verifyUserToken } from "../api/auth";

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

const savedUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

const initialState = {
    isLoggedIn: false,
    user: savedUser,
    loading: false,
    error: null
};

const userLoggedInSlice = createSlice({
    name: "loggedIn",

    initialState,

    reducers: {
        setAuthenticated: (state, action) => {
            state.isLoggedIn = true;
            state.user = action.payload;
            state.error = null;
        },
        logout: (state) => {
            state.isLoggedIn = false;
            state.user = null;
            state.error = null;

            localStorage.removeItem("user");
            localStorage.removeItem("token");
            localStorage.removeItem("candidateProfile");
            localStorage.removeItem("parsedResume");
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

export const { setAuthenticated, logout } = userLoggedInSlice.actions;

export default userLoggedInSlice.reducer;