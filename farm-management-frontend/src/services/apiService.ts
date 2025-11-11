import axios, { AxiosError } from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : 'http://localhost:5001';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

let isOffline = false;

api.interceptors.response.use(
  (response) => {
    if (isOffline) {
      isOffline = false;
      window.dispatchEvent(new CustomEvent('api-online'));
    }
    return response;
  },
  (error: AxiosError) => {
    if (!error.response && (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK')) {
      if (!isOffline) {
        isOffline = true;
        window.dispatchEvent(new CustomEvent('api-offline'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_URL, isOffline };
