import { useState } from 'react'
import Login from './pages/login'
import Signup from './pages/signup'
import Dashboard from './pages/dashboaard'

function App() {
  const [currentPage, setCurrentPage] = useState('signup')

  return (
    // currentPage === 'signup' ? (
    //   <Signup onNavigateToLogin={() => setCurrentPage('login')} />
    // ) : (
    //   <Login onNavigateToSignup={() => setCurrentPage('signup')} />
    // )
    <Dashboard></Dashboard>

  )
}

export default App
