import { FC, useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

interface MessageProps {
  senderName: string;
  senderPhotoURL: string;
  content: string;
  channel: string;
  languages: string;
}

const MiniLoader = () => (
  <div className="animate-spin rounded-full border-t-4 border-blue-500 border-solid h-4 w-4 ml-2" />
);

const Message: FC<MessageProps> = ({
  content,
  senderPhotoURL,
  senderName,
  channel,
}) => {
  const [translated, setTranslated] = useState<string>("");
  const [isImage, setIsImage] = useState<boolean>(false);
  const [showImagePopup, setShowImagePopup] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isTranslated, setIsTranslated] = useState<boolean>(false);

  const navigate = useNavigate();

  const translateAPI = import.meta.env.VITE_TRANSLATE_API;

  useEffect(() => {
    if (content.startsWith(import.meta.env.VITE_IMAGE_PREFIX)) {
      setIsImage(true);
    } else {
      const fetchTranslate = async () => {
        try {
          const response = await fetch(translateAPI, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: content,
              language: String(navigator.language).split("-")[0],
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const translatedContent = data.data;
            setTranslated(translatedContent);
          }
        } catch (error) {
          console.error("Error during translation:", error);
        }
      };
      if (!isTranslated) {
        fetchTranslate();
        setIsTranslated(true);
      }
    }
  }, [content]);

  return (
    <>
      {channel && (
        <div className="flex items-start space-x-4 p-4 justify-start max-sm:rounded-md">
          <img
            src={senderPhotoURL}
            alt={senderName}
            className="w-12 h-12 rounded-full"
          />
          <div className="flex flex-col pb-4">
            <p className="font-bold text-lg">{senderName}</p>
            {isImage ? (
              <>
                <div
                  className={`w-48 h-24 overflow-hidden cursor-pointer ${
                    isFullscreen ? "absolute bg-black bg-opacity-80" : ""
                  }`}
                  onDoubleClick={() => {
                    localStorage.setItem("image", content);
                    navigate(`/image`);
                  }}
                >
                  {content.length > 0 ? (
                    <img
                      src={content}
                      alt="Image"
                      className="w-full h-auto rounded-lg"
                    />
                  ) : (
                    <MiniLoader />
                  )}
                </div>
                {showImagePopup && (
                  <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-80 flex justify-center items-center">
                    <div className="max-w-screen-lg w-full mx-4">
                      <img
                        src={content}
                        alt="Image"
                        className="w-auto h-full rounded-lg"
                      />
                      <button
                        className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-md p-2"
                        onClick={() => {
                          setShowImagePopup(false);
                          setIsFullscreen(false); // Reset fullscreen state when closing
                        }}
                      >
                        Close
                      </button>
                      <style>{`
                        #input{
                          visibility:hidden
                        }
                      `}</style>
                    </div>
                    <style>{`body{overflow:hidden}`}</style>
                  </div>
                )}
              </>
            ) : (
              <>
                {translated.length > 0 ? (
                  <p className="text-lg">{translated}</p>
                ) : (
                  <div className="text-sm flex items-center">
                    <span>Translating</span>
                    <MiniLoader />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Message;
