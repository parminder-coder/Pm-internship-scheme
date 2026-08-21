import { configureStore } from '@reduxjs/toolkit'
import userLoggedInReducer from '../features/useLoggedInSlice'

export const store = configureStore({
  reducer: {
    loggedIn: userLoggedInReducer,
  },
})

