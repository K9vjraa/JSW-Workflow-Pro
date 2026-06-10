import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminReports from "./pages/AdminReports";
import SupervisorReports from "./pages/SupervisorReports";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import WorkerDashboard from "./pages/WorkerDashboard";
import LoginPage from "./pages/LoginPage";
import Layout from "./components/Layout";
import TasksPage from "./pages/TasksPage";
import TaskDetail from "./pages/TaskDetail";
import DepartmentChat from "./pages/DepartmentChat";
import AdminAnalytics from "./pages/AdminAnalytics";
import React from "react";

import ForgotPassword from "./pages/ForgotPassword";

import RegisterPage from "./pages/RegisterPage";
import ResetPassword from "./pages/ResetPassword";

// Fallback component for unimplemented routes
const Placeholder = ({ title }: { title: string }) => (
  <div className="p-8 flex items-center justify-center h-full text-slate-500 font-medium">
    {title} - Coming Soon
  </div>
);

const IndexRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'EMPLOYEE') return <Navigate to="/employee/dashboard" replace />;
  return <Navigate to="/worker/dashboard" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Main Application Layout */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            {/* Catch-all redirect based on role */}
            <Route index element={<IndexRedirect />} />
            
            {/* 
              In Layout.tsx, we could redirect based on role instead of doing it here, 
              but doing a wrapper helps. For simplicity let's map /dashboard to Admin for now,
              and let the dynamic redirect happen.
              Actually, ProtectedRoute handles route guards based on URLs.
            */}
            
            {/* --- ADMIN ROUTES --- */}
            <Route path="admin/dashboard" element={
              <ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="admin/users" element={
              <ProtectedRoute allowedRoles={['ADMIN']}><Placeholder title="User Management" /></ProtectedRoute>
            } />
            <Route path="admin/departments" element={
              <ProtectedRoute allowedRoles={['ADMIN']}><Placeholder title="Department Management" /></ProtectedRoute>
            } />
            <Route path="admin/reports" element={
              <ProtectedRoute allowedRoles={['ADMIN']}><AdminReports /></ProtectedRoute>
            } />
            <Route path="admin/analytics" element={
              <ProtectedRoute allowedRoles={['ADMIN']}><AdminAnalytics /></ProtectedRoute>
            } />

            {/* --- EMPLOYEE ROUTES --- */}
            <Route path="employee/dashboard" element={
              <ProtectedRoute allowedRoles={['EMPLOYEE']}><EmployeeDashboard /></ProtectedRoute> 
            } />
            <Route path="employee/tasks" element={
              <ProtectedRoute allowedRoles={['EMPLOYEE']}><TasksPage /></ProtectedRoute>
            } />
            <Route path="employee/reports" element={
              <ProtectedRoute allowedRoles={['EMPLOYEE']}><SupervisorReports /></ProtectedRoute>
            } />
            <Route path="employee/team" element={
              <ProtectedRoute allowedRoles={['EMPLOYEE']}><Placeholder title="My Team" /></ProtectedRoute>
            } />

            {/* --- WORKER ROUTES --- */}
            <Route path="worker/dashboard" element={
              <ProtectedRoute allowedRoles={['WORKER']}><WorkerDashboard category="MY_DAY" /></ProtectedRoute>
            } />
            <Route path="worker/tasks" element={
              <ProtectedRoute allowedRoles={['WORKER']}><TasksPage category="ASSIGNED" /></ProtectedRoute>
            } />
            <Route path="worker/reports" element={
              <ProtectedRoute allowedRoles={['WORKER']}><Placeholder title="My Reports" /></ProtectedRoute>
            } />

            {/* --- SHARED / COMMON --- */}
            {/* We map generic links to roles, but for now we keep the dynamic task detail shared */}
            <Route path="task/:id" element={<TaskDetail />} />
            <Route path="chat" element={<DepartmentChat />} />
            <Route path="settings" element={<Placeholder title="Settings" />} />
            
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
