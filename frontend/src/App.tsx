import { StyleProvider } from '@ant-design/cssinjs'
import { ConfigProvider, theme as antdTheme } from 'antd'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useUiStore } from './stores/uiStore'

function App() {
  const currentTheme = useUiStore((state) => state.theme)
  const isDark = currentTheme === 'dark'

  return (
    // antd styles go in @layer antd, below Tailwind utilities (order set in index.css).
    <StyleProvider layer>
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
    </StyleProvider>
  )
}

export default App
