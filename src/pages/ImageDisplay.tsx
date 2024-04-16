import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowIcon } from "../components";

const ImageDisplay = () => {
  const navigate = useNavigate();

  const goBack = () => navigate(-1); // Go back one step in the history stack

  const src = localStorage.getItem("image") || "";

  useEffect(() => {
    if (src.length <= 0) {
      alert("No image to view!");
      goBack();
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen justify-center items-center bg-gray-800 p-4">
      <button
        onClick={goBack}
        className="absolute top-0 left-0 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 p-4"
      >
        <ArrowIcon />
      </button>
      <div className="flex justify-center items-center h-screen">
        <img
          src={src}
          alt="Image"
          className="rounded-lg shadow-xl shadow-black"
          style={{ width: "auto", height: "50%" }}
        />
      </div>
    </div>
  );
};

export default ImageDisplay;
