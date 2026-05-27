import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'           // ← ADD
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { PendingCountProvider } from './context/PendingCountContext'
import App from './App.jsx'
import './styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>                          {/* ← ADD */}
        <AuthProvider>
          <PendingCountProvider>
            <App />
          </PendingCountProvider>
        </AuthProvider>
      </BrowserRouter>                         {/* ← ADD */}
    </QueryClientProvider>
  </React.StrictMode>,
)