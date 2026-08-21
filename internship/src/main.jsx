import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './app/store'
import './index.css'
import Login from './pages/login'
import Signup from './pages/signup'
import ProfileSetupForm from './pages/profileSetupForm'
import Dashboard from './pages/dashboard'
import ProtectedRoute from './protectedRoutes/ProtectedRoute'
import { BrowserRouter, Routes, Route } from "react-router"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profileSetupForm" element={<ProfileSetupForm />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)

