import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage, SignupPage, ProtectedRoute } from '@/features/auth'
import { AppLayout } from './AppLayout'
import { StatsPage } from '@/features/body-metrics'
import { WorkoutPage } from '@/features/workout'
import { DashboardPage } from '@/features/dashboard'
import { ProfilePage } from '@/features/profile'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/workout', element: <WorkoutPage /> },
          { path: '/stats', element: <StatsPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])
