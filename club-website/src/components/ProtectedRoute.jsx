import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getMe, checkUserAccess } from '../services/api';

const ProtectedRoute = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setIsAuthorized(false);
        return;
      }

      try {
        const userData = await getMe();
        if (checkUserAccess(userData)) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error("Auth check failed", error);
        setIsAuthorized(false);
      }
    };

    checkAuth();
  }, [token]);

  if (isAuthorized === null) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: '60vh' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border-color)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return isAuthorized ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
