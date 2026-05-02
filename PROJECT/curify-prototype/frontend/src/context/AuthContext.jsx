import { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/clerk-react';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const clerk = useClerk();
  const { getToken } = useClerkAuth();

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync Clerk user → internal user state
  useEffect(() => {
    if (!clerkLoaded) {
      setLoading(true);
      return;
    }

    const syncUser = async () => {
      setLoading(true);
      console.log("[AuthContext] Syncing user...", { isSignedIn, clerkLoaded });
      if (isSignedIn && clerkUser) {
        setLoading(true);
        const clerkUid = clerkUser.id;
        
        // 1. Check for cached role immediately to prevent "No Role" redirect loops
        const cachedRole = localStorage.getItem(`curify_role_${clerkUid}`);
        if (cachedRole) {
          console.log("[AuthContext] Found cached role:", cachedRole);
          setRole(cachedRole);
        }
        
        const baseUser = {
          uid: clerkUid,
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          displayName: clerkUser.fullName || clerkUser.firstName || '',
          photoURL: clerkUser.imageUrl || null,
        };
        setUser(baseUser);

        try {
          const token = await getToken();
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (res.ok) {
            const data = await res.json();
            const fetchedRole = data.role || null;
            const completed = data.profile_completed || false;
            console.log("[AuthContext] Backend Sync Success:", { fetchedRole, completed });
            setRole(fetchedRole);
            setProfileCompleted(completed);
          } else {
            console.warn("[AuthContext] Backend Sync Failed (not ok)");
            setRole(null);
          }
        } catch (e) {
          console.error("[AuthContext] Backend Sync Error:", e);
          setRole(null);
        }
      } else {
        console.log("[AuthContext] No session found.");
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    };

    syncUser();
  }, [clerkUser, clerkLoaded, isSignedIn, getToken]);

  const setUserRole = async (newRole) => {
    setRole(newRole);
    if (user) {
      localStorage.setItem(`curify_role_${user.uid}`, newRole);
      try {
        const token = await getToken();
        await fetch(`${import.meta.env.VITE_API_URL}/api/auth/role`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ role: newRole })
        });
      } catch (e) {
        console.error("Failed to save role to backend:", e);
      }
    }
  };

  const logout = async () => {
    setUser(null);
    setRole(null);
    setLoading(false);
    try { 
      await clerk.signOut({ redirectUrl: '/' }); 
    } catch (e) { 
      console.error('Clerk sign-out error:', e); 
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, profileCompleted, loading, isSignedIn, isLoaded: clerkLoaded, setUserRole, setProfileCompleted, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}
