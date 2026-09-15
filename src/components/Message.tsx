import { FC, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MessageProps } from "../firebase/db";
 
import { auth } from "../firebase/config";

const translationCache = new Map<string, string>();
const translationRequests = new Map<string, Promise<string>>();

const MiniLoader = () => (
  <div className="animate-spin rounded-full border-t-4 border-blue-500 border-solid h-4 w-4 ml-2" />
);

const Message: FC<MessageProps> = ({
  content,
  senderPhotoURL,
  senderName,
  languages,
  channel,
  type,
  senderId,
}) => {
  const [translated, setTranslated] = useState("");
  const [isImage, setIsImage] = useState(false);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const navigate = useNavigate();
  const translateAPI = import.meta.env.VITE_TRANSLATE_API;

  const language = useMemo(() => String(languages).split("-")[0], [languages]);

  const cacheKey = useMemo(() => `${language}:${content}`, [language, content]);

  useEffect(() => {
    if (type === "image") {
      setIsImage(true);
      return;
    }

    const cached = translationCache.get(cacheKey);

    if (cached !== undefined) {
      setTranslated(cached);
      return;
    }

    let cancelled = false;

    const translate = async () => {
      if (auth?.currentUser?.uid === senderId) return setTranslated(content);
      let request = translationRequests.get(cacheKey);

      if (!request) {
        request = fetch(translateAPI, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            language,
          }),
        })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error("Translation failed");
            }

            const data = await response.json();
            return data.data;
          })
          .then((result) => {
            translationCache.set(cacheKey, result);
            translationRequests.delete(cacheKey);
            return result;
          })
          .catch((error) => {
            translationRequests.delete(cacheKey);
            throw error;
          });

        translationRequests.set(cacheKey, request);
      }

      try {
        const result = await request;

        if (!cancelled) {
        
          setTranslated(result);
        }
      } catch {}
    };

    translate();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, content, language, translateAPI, type]);

  const handleReadAloud = () => {
    if (typeof window === "undefined") return;

    if (!("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported by this browser.");
      return;
    }

    if (!translated.trim()) {
      alert("There is no translated text to read.");
      return;
    }

    window.speechSynthesis.cancel();

    const speak = () => {
      const voices = window.speechSynthesis.getVoices();

      console.log("Speech synthesis available:", true);
      console.log("Voices:", voices);
      console.log("Text:", translated);
      console.log("Language:", language);

      const utterance = new SpeechSynthesisUtterance(translated);

      const fullLanguage =
        language === "en"
          ? "en-US"
          : language === "he"
          ? "he-IL"
          : language === "ja"
          ? "ja-JP"
          : language === "es"
          ? "es-ES"
          : language === "fr"
          ? "fr-FR"
          : language === "de"
          ? "de-DE"
          : language === "it"
          ? "it-IT"
          : language;

      utterance.lang = fullLanguage;
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      const matchingVoice =
        voices.find(
          (voice) => voice.lang.toLowerCase() === fullLanguage.toLowerCase()
        ) ||
        voices.find((voice) =>
          voice.lang.toLowerCase().startsWith(language.toLowerCase())
        );

      if (matchingVoice) {
        utterance.voice = matchingVoice;
        console.log("Selected voice:", matchingVoice.name);
      } else {
        console.warn("No matching voice found.");
      }

      utterance.onstart = () => {
        console.log("Speech started");
      };

      utterance.onend = () => {
        console.log("Speech ended");
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        alert(`Speech synthesis error: ${event.error}`);
      };

      window.speechSynthesis.speak(utterance);
    };

    const voices = window.speechSynthesis.getVoices();

    if (voices.length > 0) {
      speak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        speak();
      };
    }
  };

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
                    navigate("/image");
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
                          setIsFullscreen(false);
                        }}
                      >
                        Close
                      </button>

                      <style>{`
                        #input {
                          visibility: hidden;
                        }
                      `}</style>
                    </div>

                    <style>{`body { overflow: hidden }`}</style>
                  </div>
                )}
              </>
            ) : (
              <div>
                {type !== "audio" ? (
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
                ) : (
                  <button
                    onClick={handleReadAloud}
                    className="mt-2 text-blue-500 hover:text-blue-700"
                  >
                    Play Audio
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Message;
