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
  const [proAlertShown, setProAlertShown] = useState(false); // Flag to track if the alert has been shown

  const routes = {
    home: "/",
    signup: "/signup",
    group: (id: string) => `/groups/${id}`,
    image: "/image",
    upgrade: "/upgrade",
    checkout: "/checkout",
  };

  const month = 2629746000; // Number of milliseconds in a month

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
        !Object.values(routes).some((route) => {
          if (typeof route === "function") {
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

    // Check "pro" status on app mount
    checkProStatus();

    // Set interval to check "pro" status and reset it after a month
    const intervalId = setInterval(checkProStatus, month);

    // Cleanup function
    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, [navigate, location, routes]);

  // Function to check "pro" status and perform redirection if necessary
  const checkProStatus = () => {
    const proUsers: any = [];
    if (
      localStorage.getItem("isPro") === "true" &&
      !proAlertShown &&
      proUsers.includes(user)
    ) {
      setProAlertShown(true); // Set the flag to true after showing the alert
      if (location.pathname === routes.upgrade) {
        navigate(routes.home);
        alert("Already on pro plan!");
      }
    }
  };

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <Routes>
          <Route path={routes.home} element={<Home user={user} />} />
          <Route path={routes.signup} element={<Signup />} />
          <Route path={routes.group(":id")} element={<Group user={user} />} />
          <Route path={routes.image} element={<ImageDisplay />} />
          <Route path={routes.upgrade} element={<UpgradeBenefits />} />
        </Routes>
      )}
    </>
  );
};

export default App;
