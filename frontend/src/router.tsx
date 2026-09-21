import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/common/AppLayout'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { RegisterPage } from '@/pages/RegisterPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <PlaceholderPage title="Dashboard" /> },
      { path: 'vocabulary', element: <PlaceholderPage title="Vocabulary" /> },
      { path: 'review', element: <PlaceholderPage title="Review" /> },
      { path: 'ai-tutor', element: <PlaceholderPage title="AI Tutor" /> },
      { path: 'progress', element: <PlaceholderPage title="Progress" /> },
    ],
  },
])
