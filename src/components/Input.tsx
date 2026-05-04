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
  listRef: any;
}

const imageSizeProps = {
  width: 25,
  height: 25,
};

const Input = ({ groupId, channel }: Props) => {
  const [message, setMessage] = useState("");
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [placeholder, setPlaceholder] = useState("");
  const [isSpeech, setIsSpeech] = useState<boolean>(false);
  const [renderVideo, setRenderVideo] = useState(false);

  const storage = getStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const plusButtonRef = useRef(null);
  const formRef = useRef<HTMLFormElement>(null);

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
      setMessage("");
      setIsSpeech(false);
    } catch (error) {
      console.error("Error sending message:", error);
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
    setShowImageUpload(!showImageUpload);
    if (plusButtonRef.current) {
      const pb = plusButtonRef.current as HTMLElement;
      pb.classList.toggle("rotate-90", !showImageUpload);
      pb.classList.toggle("-rotate-90", showImageUpload);
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex justify-center items-center absolute bottom-4 left-0 w-full pt-12"
    >
      <div className="flex flex-col relative">
        <button
          type="button"
          className="mr-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 focus:outline-none flex items-center"
          onClick={handleUploadButtonClick}
        >
          <img
            ref={plusButtonRef}
            src={PlusButton}
            height={imageSizeProps.height}
            width={imageSizeProps.width}
          />
        </button>

        <div
          className={`absolute top-0 -mt-8 flex justify-center items-center w-screen ${
            showImageUpload ? "visible" : "hidden"
          }`}
        >
          <div className="bg-gray-600 min-w-screen flex flex-row justify-center items-center absolute -left-[50px] gap-4 rounded-md">
            <div
              className="px-2 py-2 bg-transparent text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring"
              onClick={() => fileInputRef.current?.click()}
            >
              <img
                src={buttons[item(1)]}
                alt="Image Upload"
                height={imageSizeProps.height}
                width={imageSizeProps.width}
                className="cursor-pointer"
              />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
              />
            </div>
            <div
              className="px-2 py-2 bg-transparent text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring flex flex-row"
              onClick={record}
            >
              <img
                src={buttons[item(2)]}
                alt="Record a Voice Message"
                height={imageSizeProps.height}
                width={imageSizeProps.width}
                className="cursor-pointer"
              />
            </div>
            <div
              className="px-2 py-2 bg-transparent text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring flex flex-row"
              onClick={stickerUpload}
            >
              <img
                src={buttons[item(3)]}
                alt="Sticker Upload"
                height={imageSizeProps.height}
                width={imageSizeProps.width}
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      <input
        type="text"
        className="text-center px-4 py-2 border border-gray-500 rounded-md focus:outline-none focus:border-blue-500 bg-gray-800 text-white md:w-1/3 max-sm:w-1/4"
        placeholder={placeholder}
        onChange={(e) => setMessage(e.target.value)}
        value={isSpeech ? "" : message}
        id="inpt"
      />

      <button
        type="submit"
        className="ml-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring focus:border-blue-300"
      >
        Send
      </button>
      <button
        type="button"
        className="ml-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 focus:outline-none"
        onClick={() => setRenderVideo((prev) => !prev)}
      >
        📹
      </button>
      {renderVideo && (
        <div
          className="fixed bottom-4 right-4 bg-gray-900 rounded-lg shadow-lg z-50 cursor-move"
          style={{ width: 300, height: 200 }}
          onMouseDown={(e) => {
            const element = e.currentTarget;
            let shiftX = e.clientX - element.getBoundingClientRect().left;
            let shiftY = e.clientY - element.getBoundingClientRect().top;

            const moveAt = (pageX: number, pageY: number) => {
              element.style.left = pageX - shiftX + "px";
              element.style.top = pageY - shiftY + "px";
            };

            const onMouseMove = (event: MouseEvent) =>
              moveAt(event.pageX, event.pageY);

            document.addEventListener("mousemove", onMouseMove);

            document.onmouseup = () => {
              document.removeEventListener("mousemove", onMouseMove);
              document.onmouseup = null;
            };
          }}
        >
          <div className="flex justify-end p-1">
            <button
              className="text-white bg-red-600 px-2 py-1 rounded-md hover:bg-red-700"
              onClick={() => setRenderVideo(false)}
            >
              ✖
            </button>
          </div>
          <VideoCall />
        </div>
      )}
    </form>
  );
};

export default Input;
