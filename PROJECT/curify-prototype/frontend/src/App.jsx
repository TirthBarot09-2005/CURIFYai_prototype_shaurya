import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SplashScreen from './components/SplashScreen';
import Navbar from './components/Navbar';
import CinematicFooter from './components/ui/CinematicFooter';

import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import BlogPage from './pages/BlogPage';
import BlogPostDetail from './pages/BlogPostDetail';
import PatientSearch from './components/PatientSearch';
import LenderForm from './components/LenderForm';
import AuthPage from './pages/AuthPage';
import RoleSelectPage from './pages/RoleSelectPage';
import SignUpPage from './pages/SignUpPage';
import LenderDashboard from './pages/LenderDashboard';
import OnboardingPage from './pages/OnboardingPage';
import ProfilePage from './pages/ProfilePage';

/* Page transition wrapper */
function PageWrapper({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}


function AppRoutes() {
  const location = useLocation();
  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="bg-glow bg-glow-pulse" />
      <div className="bg-grid fixed inset-0 pointer-events-none z-0" />
      <Navbar />
      <main className="flex-1">
        <PageWrapper>
          <Routes location={location} key={location.pathname}>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostDetail />} />
            <Route path="/auth/*" element={<AuthPage />} />
            <Route path="/auth/sign-up/*" element={<SignUpPage />} />
            <Route path="/auth/role" element={<RoleSelectPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />

            {/* Protected Patient routes */}
            <Route path="/patient" element={
              <ProtectedRoute allowedRole="patient">
                <PatientSearch />
              </ProtectedRoute>
            } />

            {/* Protected Lender routes */}
            <Route path="/lender" element={
              <ProtectedRoute allowedRole="lender">
                <LenderForm />
              </ProtectedRoute>
            } />
            <Route path="/lender/dashboard" element={
              <ProtectedRoute allowedRole="lender">
                <LenderDashboard />
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </PageWrapper>
      </main>
      <CinematicFooter />
    </div>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <AuthProvider>
      <AnimatePresence>
        {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
      </AnimatePresence>
      {splashDone && <AppRoutes />}
    </AuthProvider>
  );
}
