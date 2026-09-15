import { FormEvent, useState, useRef, useEffect } from "react";
import { MessageProps, createMessage } from "../firebase/db";
import { auth } from "../firebase/config";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Regular images
import UploadButton from "../assets/synf1x/upload_btn.png";
import PlusButton from "../assets/synf1x/plusButton.png";
import StickerButton from "../assets/synf1x/stickerButton.png";

// Michael Richards image
import MichaelRichards from "../assets/MichaelRichards/MichaelRichards.png";

// CSS imports
import "./css/ButtonAnimations.css";

// Compponent imports
import { VideoCall } from "../components";

interface Props {
  groupId: string;
  channel: string;
}

const imageSizeProps = {
  width: 22,
  height: 22,
};

// Shared focus/hover treatment for every icon button in the bar
const iconButtonClass =
  "flex items-center justify-center w-10 h-10 rounded-full text-gray-200 " +
  "transition-colors duration-150 hover:bg-gray-700/70 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70";

const Input = ({ groupId, channel }: Props) => {
  const [message, setMessage] = useState("");
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [placeholder, setPlaceholder] = useState("");
  const [isSpeech, setIsSpeech] = useState<boolean>(false);
  const [renderVideo, setRenderVideo] = useState(false);

  const storage = getStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const videoPanelRef = useRef<HTMLDivElement>(null);

  const authUser: any = auth?.currentUser;
  const buttons = [UploadButton, MichaelRichards, StickerButton];

  // Speech recognition setup
  const record = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = navigator.language; // e.g., 'en-US' for English
    recognition.continuous = false;

    recognition.start();

    recognition.onstart = () => {
      console.log("Start recognition...");
    };

    recognition.onresult = (event: any) => {
      const spokenText = event.results[0][0].transcript;
      setMessage(spokenText);
      setIsSpeech(true);
    };

    recognition.onerror = (event: any) => {
      console.error("Error occurred in speech recognition:", event.error);
      alert("Error occurred in speech recognition.");
    };

    recognition.onend = () => {
      console.log("Voice recognition ended.");
      formRef?.current?.requestSubmit();
    };
  };

  const stickerUpload = () => {
    alert("Sticker Upload");
  };

  // Resize handler for placeholder text
  useEffect(() => {
    const handleResize = () => {
      const smallFormFactor = 648;
      setPlaceholder(
        window.innerWidth > smallFormFactor ? "Type a message..." : "Type..."
      );
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const item = (n: number) => n - 1; // indexes for button selection

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    setMessage("");
    if (trimmedMessage === "") return;

    try {
      const messageDoc: MessageProps = {
        content: trimmedMessage.substring(0, 400),
        senderPhotoURL: authUser?.photoURL,
        senderName: authUser?.displayName,
        groupId,
        channel,
        senderId: auth?.currentUser?.uid,
        type: isSpeech ? "audio" : "text",
        languages: navigator.language,
      };

      await createMessage(messageDoc);
      setIsSpeech(false);
    } catch (error) {
      alert("Error sending message. Please try again.");
    }
  };

  // Handle image change and upload
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      try {
        const storageRef = ref(
          storage,
          `images/${auth.currentUser?.uid}/${file.name}`
        );
        await uploadBytes(storageRef, file);

        const imageURL = await getDownloadURL(storageRef);

        const messageDoc: MessageProps = {
          content: imageURL,
          senderPhotoURL: authUser?.photoURL,
          senderName: authUser?.displayName,
          groupId,
          channel,
          senderId: auth?.currentUser?.uid,
          type: "image",
          languages: navigator.language,
        };

        await createMessage(messageDoc);
        setShowImageUpload(false);
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Error uploading image. Please try again.");
      }
    }
  };

  // Handle upload button click (rotating button)
  const handleUploadButtonClick = () => {
    setShowImageUpload((prev) => !prev);
  };

  // Drag handling for the floating video panel — bound to the header only,
  // so clicks on the call controls inside VideoCall no longer start a drag.
  const handleVideoDragStart = (e: React.MouseEvent) => {
    const panel = videoPanelRef.current;
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    const shiftX = e.clientX - rect.left;
    const shiftY = e.clientY - rect.top;

    const moveAt = (pageX: number, pageY: number) => {
      panel.style.left = pageX - shiftX + "px";
      panel.style.top = pageY - shiftY + "px";
    };

    const onMouseMove = (event: MouseEvent) => moveAt(event.pageX, event.pageY);
    document.addEventListener("mousemove", onMouseMove);

    document.onmouseup = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.onmouseup = null;
    };
  };

  const hasContent = message.trim().length > 0;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="absolute bottom-4 left-0 w-full pt-12 flex justify-center items-end px-4"
    >
      <div className="flex items-center gap-2 w-full max-w-xl">
        {/* Attachment menu */}
        <div className="relative">
          <button
            type="button"
            aria-label={
              showImageUpload ? "Close attachment menu" : "Open attachment menu"
            }
            className={
              iconButtonClass +
              " bg-gray-800/90 border border-gray-700/70 shadow-sm"
            }
            onClick={handleUploadButtonClick}
          >
            <img
              src={PlusButton}
              height={imageSizeProps.height}
              width={imageSizeProps.width}
              alt=""
              className={`transition-transform duration-200 ease-out ${
                showImageUpload ? "rotate-45" : "rotate-0"
              }`}
            />
          </button>

          {/* Popup: image / voice / sticker actions */}
          <div
            className={`absolute bottom-full left-0 mb-2 origin-bottom-left transition-all duration-150 ease-out ${
              showImageUpload
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-95 translate-y-1 pointer-events-none"
            }`}
          >
            <div className="flex items-center gap-1 p-1.5 bg-gray-800 border border-gray-700/70 rounded-2xl shadow-xl shadow-black/30">
              <button
                type="button"
                title="Upload an image"
                aria-label="Upload an image"
                className={iconButtonClass}
                onClick={() => fileInputRef.current?.click()}
              >
                <img
                  src={buttons[item(1)]}
                  alt="Image Upload"
                  height={imageSizeProps.height}
                  width={imageSizeProps.width}
                />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                />
              </button>

              <button
                type="button"
                title="Record a voice message"
                aria-label="Record a voice message"
                className={iconButtonClass}
                onClick={record}
              >
                <img
                  src={buttons[item(2)]}
                  alt="Record a Voice Message"
                  height={imageSizeProps.height}
                  width={imageSizeProps.width}
                />
              </button>

              <button
                type="button"
                title="Send a sticker"
                aria-label="Send a sticker"
                className={iconButtonClass}
                onClick={stickerUpload}
              >
                <img
                  src={buttons[item(3)]}
                  alt="Sticker Upload"
                  height={imageSizeProps.height}
                  width={imageSizeProps.width}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Message field + send */}
        <div className="flex-1 flex items-center gap-1 bg-gray-800/90 border border-gray-700/70 rounded-full shadow-sm px-1.5 py-1.5 min-w-0">
          <input
            type="text"
            className="flex-1 min-w-0 bg-transparent px-3 py-1.5 text-center text-white placeholder-gray-400 focus:outline-none"
            placeholder={placeholder}
            onChange={(e) => setMessage(e.target.value)}
            value={isSpeech ? "" : message}
            id="inpt"
          />

          <button
            type="submit"
            disabled={!hasContent}
            aria-label="Send message"
            className="px-4 py-1.5 rounded-full text-sm font-medium text-white bg-blue-600 transition-colors duration-150
              hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed
              focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
          >
            Send
          </button>
        </div>

        {/* Video call toggle */}
        <button
          type="button"
          aria-label={renderVideo ? "Close video call" : "Start video call"}
          className={
            "flex items-center justify-center w-10 h-10 rounded-full text-lg leading-none transition-colors duration-150 " +
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 " +
            (renderVideo
              ? "bg-blue-600 hover:bg-blue-500 text-white"
              : "bg-gray-800/90 border border-gray-700/70 hover:bg-gray-700/70 text-gray-200")
          }
          onClick={() => setRenderVideo((prev) => !prev)}
        >
          📹
        </button>
      </div>

      {renderVideo && (
        <div
          ref={videoPanelRef}
          className="fixed bottom-4 right-4 flex flex-col rounded-2xl overflow-hidden bg-gray-900 shadow-2xl shadow-black/40 ring-1 ring-white/10 z-50"
          style={{ width: 300, height: 200 }}
        >
          <div
            className="flex items-center justify-between px-3 py-2 bg-gray-800/80 border-b border-white/5 cursor-move select-none"
            onMouseDown={handleVideoDragStart}
          >
            <span className="text-xs font-medium text-gray-300">
              Video call
            </span>
            <button
              type="button"
              aria-label="Close video call"
              className="flex items-center justify-center w-6 h-6 rounded-full text-gray-300 bg-white/5
                transition-colors duration-150 hover:bg-red-500/80 hover:text-white
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
              onClick={() => setRenderVideo(false)}
            >
              ✕
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <VideoCall onLeave={() => setRenderVideo(false)} />
          </div>
        </div>
      )}
    </form>
  );
};

export default Input;
