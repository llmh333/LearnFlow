import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/common/AppLayout'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { AiTutorPage } from '@/pages/AiTutorPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { SourcesPage } from '@/pages/SourcesPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/sources', element: <SourcesPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/ai-tutor" replace /> },
      { path: 'ai-tutor', element: <AiTutorPage /> },
    ],
  },
])
