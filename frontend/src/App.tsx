import { ConfigProvider, theme as antdTheme } from 'antd'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useUiStore } from './stores/uiStore'

function App() {
  const currentTheme = useUiStore((state) => state.theme)
  const isDark = currentTheme === 'dark'

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#58CC02',
          colorSuccess: '#58CC02',
          colorInfo: '#1CB0F6',
          colorWarning: '#FFC800',
          colorError: '#FF4B4B',
          borderRadius: 16,
          fontFamily: 'inherit',
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}

export default App
