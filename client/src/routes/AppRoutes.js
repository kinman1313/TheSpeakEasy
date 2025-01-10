import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Login from '../components/Login';
import Register from '../components/Register';
import Chat from '../components/Chat';
import ResetPassword from '../components/ResetPassword';
import NewPassword from '../components/NewPassword';
import AnimatedRoute from '../components/AnimatedRoute';

// Protected Route Component
const PrivateRoute = ({ children }) => {
    const { user } = useAuth();
    return user ? (
        <AnimatedRoute>{children}</AnimatedRoute>
    ) : (
        <Navigate to="/login" />
    );
};

// Public Route Component
const PublicRoute = ({ children }) => {
    const { user } = useAuth();
    return !user ? (
        <AnimatedRoute>{children}</AnimatedRoute>
    ) : (
        <Navigate to="/chat" />
    );
};

const AppRoutes = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <PublicRoute>
                            <Register />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/reset-password"
                    element={
                        <PublicRoute>
                            <ResetPassword />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/reset-password/:token"
                    element={
                        <AnimatedRoute>
                            <NewPassword />
                        </AnimatedRoute>
                    }
                />
                <Route
                    path="/chat"
                    element={
                        <PrivateRoute>
                            <Chat />
                        </PrivateRoute>
                    }
                />
                <Route path="/" element={<Navigate to="/chat" />} />
            </Routes>
        </AnimatePresence>
    );
};

export default AppRoutes; 