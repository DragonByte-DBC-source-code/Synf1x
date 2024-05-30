import {
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase/config";
import Logo from "../assets/un1speak/jahelPro.png";
import Jahel from "../assets/un1speak/Jahel.jpg";
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
    document.title = "Un1Speak | Sign Up";
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
      <div className="absolute left-[11rem] bottom-[22rem]">
        <img src={Logo} />
      </div>
      <div className=" p-4 text-white rounded-lg text-right absolute left-[6rem] bottom-[14rem]">
        <div className="flex flex-col items-right justify-right max-sm:w-full">
          <h2 className="text-4xl font-bold break-words">
            Sign Up to
            <span className="bg-gradient-to-b from-blue-200 to-silver-500 text-transparent bg-clip-text p-2 rounded">
              un1speak
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
