import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowIcon } from "../components";

import './css/ImageDisplay.css'

const ImageDisplay = () => {
  const navigate = useNavigate();

  // Function to navigate back in history
  const goBack = () => navigate(-1);

  // Retrieve the image source from local storage or use an empty string as fallback
  const src = localStorage.getItem("image") || "";

  useEffect(() => {
    // Check if the image source is empty and alert the user if so
    if (src.length <= 0) {
      alert("No image to view!");
      goBack();
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen justify-center items-center bg-gray-800 p-4">
      <button
        onClick={goBack}
        className="absolute top-0 left-0 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 m-4 z-[40000]"
      >
        <ArrowIcon />
      </button>
      <div className="relative flex justify-center items-center w-full h-screen">
        <div className="image-container backdrop">
          <img src={src} alt="Displayed image" className="image" />
        </div>
      </div>
    </div>
  );
};

export default ImageDisplay;
