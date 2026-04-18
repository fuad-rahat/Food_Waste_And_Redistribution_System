import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, getUserFromToken, saveToken, logout as clearAuth } from '../utils/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = getToken();
        if (storedToken) {
            setToken(storedToken);
            setUser(getUserFromToken());
        }
        setLoading(false);
    }, []);

    const login = (newToken) => {
        saveToken(newToken);
        setToken(newToken);
        const userData = getUserFromToken();
        setUser(userData);
        return userData;
    };

    const logout = () => {
        clearAuth();
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
