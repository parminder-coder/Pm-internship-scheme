import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Login from './pages/login'
import Signup from './pages/signup'
import ProfileSetupForm from './pages/profileSetupForm'
import { BrowserRouter, Routes, Route } from "react-router"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profileSetupForm" element={<ProfileSetupForm />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
