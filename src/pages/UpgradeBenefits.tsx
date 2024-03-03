import { ArrowIcon } from "../components";

import { useNavigate, Link } from "react-router-dom";

import "./css/Upgrade.css"

export default function UpgradeBenefits() {
  const benefits: Array<string> = [
    "Unlimited groups to join/create",
    "Access to our best translating model: Synf1x Ultra",
    "Faster translation times"
  ];

  const defaults: Array<string> = [
    "4 groups to join/create",
    "Access to the regular translating model: Synf1xation",
    "Standard translation times"
  ]

  const navigate = useNavigate();

  return (
    <div
      className="flex justify-center items-center h-screen w-screen absolute top-0 left-0 bg-gray-800 gap-5"
    >
      <button
        onClick={() => navigate("/", { replace: true })}
        className="md:left-11 top-0 absolute bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded flex items-center max-sm:left-2 mt-6"
      >
        <ArrowIcon />
      </button>
      <div
        className="flex flex-col justify-center items-center size-[95%] max-w-[500px] rounded-lg border-2 border-blue-200 p-6 text-white bg-gradient-to-r from-gray-900 to-gray-800"
      >
        <div className="text-5xl mb-12 italic">
          <label>Current Plan: Basic
          </label>
        </div>
        <div className="grid grid-cols-1 gap-4 text-lg">
          {defaults.map((dflt, index) => (
            <p key={index} className="text-blue-500">- {dflt}</p>
          ))}
        </div>
        <input className="mt-16 justify-center invisible py-2"/>
      </div>
      <div
        className="flex flex-col justify-center items-center size-[95%] max-w-[500px] rounded-lg border-2 border-gradient p-6 text-white bg-gradient-to-r from-gray-900 to-gray-800"
      >
        <div className="text-5xl mb-12 italic">
          <label>Upgrade to {" "}
            <span className="gradient-text">Pro</span>
          </label>
        </div>
        <div className="grid grid-cols-1 gap-4 text-lg">
          {benefits.map((benefit, index) => (
            <p key={index} className="gradient-text">- {benefit}!</p>
          ))}
        </div>
        <footer className="mt-16 flex justify-center">
          <Link className="text-lg bg-gradient-to-r from-transparent to-transparent hover:from-gray-800 hover:to-gray-700 px-4 py-2 rounded-md text-white"
          to="https://buy.stripe.com/test_dR69DR8gx1nEeR2288"
          >
            {'Upgrade Now ->'} 
          </Link>
        </footer>
      </div>
    </div>
    
  );
}
