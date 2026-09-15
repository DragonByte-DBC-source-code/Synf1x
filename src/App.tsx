import { useEffect, useState } from "react";
import {
  Signup,
  Home,
  Loading,
  Group,
  UpgradeBenefits,
  ImageDisplay,
} from "./pages";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Route, Routes, useNavigate, useLocation } from "react-router-dom";

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [proAlertShown, setProAlertShown] = useState(false);

  const routes = {
    home: "/",
    signup: "/signup",
    group: (id: string) => `/groups/${id}`,
    image: "/image",
    upgrade: "/upgrade",
    checkout: "/checkout",
  };

  const checkProStatus = () => {
    if (localStorage.getItem("isPro") === "true" && !proAlertShown) {
      setProAlertShown(true);
      if (location.pathname === routes.upgrade) {
        navigate(routes.home);
        alert("Already on pro plan!");
      }
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (authUser: any) => {
      setProAlertShown(false);

      if (!authUser) {
        localStorage.removeItem("isPro");
        setUser(null);
        setLoading(false);
        if (location.pathname !== routes.signup) navigate(routes.signup);
        return;
      }

      try {
        const res = await fetch(
          `http://localhost:8081/check?id=${authUser.uid}`
        );
        const isPro = await res.text();
        localStorage.setItem("isPro", isPro);
      } catch (e) {
        console.error("Pro check failed:", e);
      }

      setUser(authUser);
      setLoading(false);
      checkProStatus();

      if (location.pathname === routes.signup) {
        navigate(routes.home);
      } else if (
        !Object.values(routes).some((route) =>
          typeof route === "function"
            ? location.pathname.startsWith(route(""))
            : location.pathname === route
        )
      ) {
        navigate(routes.home);
      }
    });

    return () => unsubscribe();
  }, [navigate, location]);

  return loading ? (
    <Loading />
  ) : (
    <Routes>
      <Route path={routes.home} element={<Home user={user} />} />
      <Route path={routes.signup} element={<Signup />} />
      <Route path={routes.group(":id")} element={<Group user={user} />} />
      <Route path={routes.image} element={<ImageDisplay />} />
      <Route path={routes.upgrade} element={<UpgradeBenefits />} />
    </Routes>
  );
};

export default App;
