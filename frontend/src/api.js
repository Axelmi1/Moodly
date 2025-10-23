import axios from 'axios'

// Configuration pour le développement mobile
const getBaseURL = () => {
  // Force l'IP locale pour le développement mobile
  return 'http://10.68.251.163:1337'
}

export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
})
export const setAuth = (jwt) => {
  if (jwt) {
    api.defaults.headers.common.Authorization = `Bearer ${jwt}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}
export const clearAuth = () => {
  delete api.defaults.headers.common.Authorization
}
