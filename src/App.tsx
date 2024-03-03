import { useEffect, useState } from "react";
import { Signup, Home, Loading, Group, UpgradeBenefits } from "./pages";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Route, Routes, useNavigate, useLocation } from "react-router-dom";

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const routes = {
    home: "/",
    signup: "/signup",
    group: (id: string) => `/${id}`,
    upgrade: "/upgrade",
    checkout: "/checkout",
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (authUser: any) => {
      setUser(authUser);
      setLoading(false);
      // Redirect logic
      if (!authUser) {
        if (location.pathname !== routes.signup) {
          navigate(routes.signup);
        }
      } else if (location.pathname === routes.signup) {
        navigate(routes.home);
      } else if (
        !Object.values(routes).some(route => {
          if (typeof route === 'function') {
            // Handle dynamic routes
            return location.pathname.startsWith(route(""));
          } else {
            return location.pathname === route;
          }
        })
      ) {
        navigate(routes.home);
      }
    });

    return () => unsubscribe(); // Cleanup function
  }, [navigate, location, routes]);

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <Routes>
          <Route path={routes.home} element={<Home user={user} />} />
          <Route path={routes.signup} element={<Signup />} />
          <Route path={routes.group(":id")} element={<Group user={user} />} />
          <Route path={routes.upgrade} element={<UpgradeBenefits />} />
        </Routes>
      )}
    </>
  );
};

export default App;
