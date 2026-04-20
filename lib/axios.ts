import axios from "axios";
import { axiosConfigHadToken, clearClientAuthAndGoLogin } from "./authSession";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

if (typeof window !== "undefined") {
  api.interceptors.response.use(
    (response) => response,
    (error: { response?: { status?: number }; config?: { headers?: unknown } }) => {
      const status = error.response?.status;
      if (status === 401 && axiosConfigHadToken(error.config)) {
        clearClientAuthAndGoLogin();
      }
      return Promise.reject(error);
    }
  );
}

export default api;
