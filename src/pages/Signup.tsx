import {
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import Logo from "../assets/synf1x/logo_transparent.png";
import { useEffect } from "react";

interface AuthButtonProps {
  onClick: () => void;
  logo: string;
  text: string;
  bgColor: string;
  textColor: string;
  hoverBgColor: string;
}

const AuthButton: React.FC<AuthButtonProps> = ({
  onClick,
  logo,
  text,
  bgColor,
  textColor,
  hoverBgColor,
}) => (
  <button
    onClick={onClick}
    className={`${bgColor} ${textColor} py-2 px-4 rounded ${hoverBgColor} cursor-pointer`}
  >
    <div className="flex items-center">
      <img src={logo} alt={`${text} Logo`} className="w-6 h-6" />
      <p
        className={`text-sm font-bold break-words ml-2 ${
          textColor === "text-white" ? "text-white" : "text-black"
        }`}
      >
        {text}
      </p>
    </div>
  </button>
);

const Signup: React.FC = () => {
  const googleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const githubLogin = async () => {
    try {
      await signInWithPopup(auth, new GithubAuthProvider());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    document.title = "Signup | Synf1x";
  }, []);

  return (
    <div className="bg-black min-h-screen flex flex-col justify-center items-center">
      <div className="bg-gray-800 text-white p-8 rounded-lg shadow-lg text-center w-1/2 max-sm:w-[96%] max-sm:h-[48%] max-sm:px-4">
        <div className="flex flex-col items-center justify-center max-sm:w-full">
          <img src={Logo} alt="Logo" className="w-1/2 max-sm:w-full" />
          <h2 className="text-3xl font-bold break-words">
            Sign Up to
            <span className="bg-gradient-to-b from-blue-200 to-silver-500 text-transparent bg-clip-text p-2 rounded">
              Synf1x
            </span>
          </h2>
        </div>
        <div className="md:hidden max-sm:visible">
          <br />
          <br />
        </div>
        <br />
        <div className="flex flex-row justify-center space-x-4">
          <AuthButton
            onClick={googleLogin}
            logo={import.meta.env.VITE_GOOGLE_LOGO}
            text="Google"
            bgColor="bg-blue-600"
            textColor="text-white"
            hoverBgColor="hover:bg-blue-700"
          />
          <AuthButton
            onClick={githubLogin}
            logo={import.meta.env.VITE_GITHUB_LOGO}
            text="GitHub"
            bgColor="bg-white"
            textColor="text-black"
            hoverBgColor="hover:bg-[#9c9c9c]"
          />
          {/* Add more AuthButtons as needed */}
        </div>
      </div>
    </div>
  );
};

export default Signup;
