import { createContext, useContext, useEffect, useReducer } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

const initialState = { user: null, loading: true };

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER':    return { ...state, user: action.payload, loading: false };
    case 'CLEAR_USER':  return { ...state, user: null, loading: false };
    case 'SET_LOADING': return { ...state, loading: action.payload };
    default:            return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    authService.getStoredUser().then((user) => {
      dispatch({ type: 'SET_USER', payload: user });
    });
  }, []);

  const login = async (credentials) => {
    const user = await authService.login(credentials);
    dispatch({ type: 'SET_USER', payload: user });
    return user;
  };

  const logout = async () => {
    await authService.logout();
    dispatch({ type: 'CLEAR_USER' });
  };

  const isStudent = state.user?.vaiTro === 'SINH_VIEN';
  const isManager = state.user?.vaiTro === 'QUAN_LY';

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isStudent, isManager }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
