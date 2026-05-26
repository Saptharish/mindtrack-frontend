import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-bcdaf8.up.railway.app'

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => Promise.reject(error)
)

export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (email, password) => api.post('/auth/login',
    new URLSearchParams({ username: email, password }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }}
  ),
  me: () => api.get('/auth/me'),
}

export const journal = {
  create: (text) => api.post('/journal/entries', { raw_text: text }),
  getAll: () => api.get('/journal/entries'),
  delete: (id) => api.delete(`/journal/entries/${id}`),
  analytics: () => api.get('/journal/analytics'),
}

export const maya = {
  chat: (message, history = []) => api.post('/maya/chat', {
    message: message,
    history: history
  }),
  memory: () => api.get('/maya/memory'),
  saveSession: (conversation) => api.post('/maya/save-session', {
    conversation: conversation
  }),
  getSessions: () => api.get('/maya/sessions'),
  deleteSession: (id) => api.delete(`/maya/sessions/${id}`),
}

export default api