import { createContext, useState, type ReactNode, useContext, useEffect } from 'react'
import type { AxiosInstance } from 'axios';
import axios from 'axios';

interface User {
    id: string,
    name: string,
    email: string,
    plan: string,
    analysisCount?: number,
}

interface AppContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    api: AxiosInstance;
    login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
    register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
    loaduser: () => Promise<void>;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"
const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
    const [user, setuser] = useState<User | null>(null)
    const [token, settoken] = useState<string | null>(localStorage.getItem("token"));
    const [loading, setloading] = useState(true)
    const api = axios.create({
        baseURL: BACKEND_URL
    })
    api.interceptors.request.use((config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config;
    })
    const loaduser = async () => {
        if (!token) {
            setloading(false)
            return;
        }
        try {
            const { data } = await api.get('/api/auth/user')
            if (data.success) {
                setuser(data.user)
            }
        }
        catch (error) {
            localStorage.removeItem("token")
            settoken(null)
            setuser(null)
        }
        setloading(false)
    }
    const login = async (email: string, password: string) => {
        try {
            const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password })
            if (res.data.success) {
                settoken(res.data.token)
                setuser(res.data.user)
                localStorage.setItem("token", res.data.token)
                return { success: true }
            }
            return { success: true, message: res.data.message }
        }
        catch(error:any){
            return {success:false,message:error.response?.data?.message||'Login Failed'}
        }
    }
    const register = async (name:string,email:string,password:string) => {
        try {
            const res = await axios.post(`${BACKEND_URL}/api/auth/register`, { name,email, password })
            if (res.data.success) {
                settoken(res.data.token)
                setuser(res.data.user)
                localStorage.setItem("token", res.data.token)
                return { success: true }
            }
            return { success: false, message: res.data.message }
        }
        catch(error:any){
            return {success:false,message:error.response?.data?.message||'Registration Failed'}
        }
    }
    const logout = async () => {
        settoken(null)
        setuser(null)
        localStorage.removeItem("token")
    }
    useEffect(() => { loaduser() }, [])
    const value = { user, login, register, logout, api, loading, token, loaduser }
    return <AppContext.Provider value={value}>
        {children}
    </AppContext.Provider>
}

export function useApp() {
    const context = useContext(AppContext)
    if (!context) throw new Error("useApp must be used within App Provider")
    return context;
}