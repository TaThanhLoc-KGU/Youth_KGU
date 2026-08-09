import { useEffect, useState } from "react";
import { isLoggedIn, getStoredUser, AppUser } from "../services/auth";

/** Reactive auth state — cập nhật lại khi user_info trong localStorage thay đổi (login/logout/update profile). */
export function useAuth() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [user, setUser] = useState<AppUser | null>(getStoredUser());

  useEffect(() => {
    const sync = () => {
      setLoggedIn(isLoggedIn());
      setUser(getStoredUser());
    };
    window.addEventListener("storage", sync);
    window.addEventListener("auth-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("auth-changed", sync);
    };
  }, []);

  const refresh = () => {
    setLoggedIn(isLoggedIn());
    setUser(getStoredUser());
  };

  return { loggedIn, user, refresh };
}

/** Gọi sau khi thay đổi localStorage user_info/jwt_token ngoài luồng React (login/logout/update) để các hook useAuth khác đồng bộ lại. */
export function notifyAuthChanged() {
  window.dispatchEvent(new Event("auth-changed"));
}
