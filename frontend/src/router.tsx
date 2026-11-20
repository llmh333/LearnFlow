import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/common/AppLayout'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { AiTutorPage } from '@/pages/AiTutorPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { LoginPage } from '@/pages/LoginPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { SourcesPage } from '@/pages/SourcesPage'
import { VocabularyPage } from '@/pages/VocabularyPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/sources', element: <SourcesPage /> },
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute>
        <OnboardingPage />
      </ProtectedRoute>
    ),
  },
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
      { path: 'vocabulary', element: <VocabularyPage /> },
    ],
  },
])
