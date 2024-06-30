import {
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase/config";
import Logo from "../assets/synf1x/jahelPro.png";
import Jahel from "../assets/synf1x/Jahel.jpg";
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
    document.title = "Synf1x | Sign Up";
  }, []);

  return (
    <div
      className="bg-black min-h-screen flex flex-col justify-center items-center"
      style={{
        backgroundImage: `url(${Jahel})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="md:p-4 text-white md:rounded-lg md:text-right md:absolute md:left-[6rem] md:bottom-[14rem] max-sm:p-2 max-sm:bg-gradient-to-r from-black to-white max-sm:bg-opacity-50 max-sm:rounded-lg
      ">
        <div className="flex flex-col items-right justify-right max-sm:w-full">
          <h2 className="text-4xl font-bold break-words">
            <div className="flex flex-row justify-center items-center gap-4 max-sm:text-2xl ">
              Sign Up to {' '} <img src={Logo} className="md: w-48 h-22 max-sm:w-28 max-sm:h-7" />
            </div>
          </h2>
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
