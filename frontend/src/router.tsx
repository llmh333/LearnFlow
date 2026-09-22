import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/common/AppLayout'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { AiTutorPage } from '@/pages/AiTutorPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { ProgressPage } from '@/pages/ProgressPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ReviewPage } from '@/pages/ReviewPage'
import { VocabularyPage } from '@/pages/VocabularyPage'

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
      { index: true, element: <DashboardPage /> },
      { path: 'vocabulary', element: <VocabularyPage /> },
      { path: 'review', element: <ReviewPage /> },
      { path: 'ai-tutor', element: <AiTutorPage /> },
      { path: 'progress', element: <ProgressPage /> },
    ],
  },
])
