import { FormEvent, useState, useRef, useEffect } from "react";
import { MessageProps, createMessage } from "../firebase/db";
import { auth } from "../firebase/config";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Regular images
import UploadButton from "../assets/synf1x/upload_btn.png";
import PlusButton from "../assets/synf1x/plusButton.png";
import StickerButton from "../assets/synf1x/stickerButton.png";

/* Michael Fucking Richards */
import MichaelRichards from "../assets/MichaelRichards/MichaelRichards.png";

// css imports
import "./css/ButtonAnimations.css";

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
  const storage = getStorage();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const plusButtonRef = useRef(null);

  const authUser: any = auth?.currentUser;

  const buttons = [UploadButton, MichaelRichards, StickerButton];

  const record = () => {
    alert("Record");
  };

  const stickerUpload = () => {
    alert("Sticker Upload");
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 648) {
        setPlaceholder("Type a message...");
      } else {
        setPlaceholder("Type...");
      }
    };

    // Initial check
    handleResize();

    // Listen for window resize events
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []); // Only run this effect once, on component mount

  const item = (n: number) => n - 1; // indexes and stuff smh

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Trim message to avoid sending empty messages
    const trimmedMessage = message.trim();

    if (trimmedMessage === "") {
      // If the message is empty, simply return
      return;
    }

    try {
      // Create a message with the text content
      const messageDoc: MessageProps = {
        content: trimmedMessage.substring(0, 400), // Limit content length to 400 characters
        senderPhotoURL: authUser?.photoURL,
        senderName: authUser?.displayName,
        groupId: groupId,
        channel: channel,
        senderId: auth?.currentUser?.uid,
      };

      await createMessage(messageDoc); // Send the message
      setMessage(""); // Clear the message input
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error sending message. Please try again.");
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      try {
        // Upload the image to Firebase Storage
        const storageRef = ref(
          storage,
          `images/${auth.currentUser?.uid}/${file.name}`
        );
        await uploadBytes(storageRef, file);

        // Get the download URL of the uploaded image
        const imageURL = await getDownloadURL(storageRef);

        // Create a message with the image URL
        const messageDoc: MessageProps = {
          content: imageURL,
          senderPhotoURL: authUser?.photoURL,
          senderName: authUser?.displayName,
          groupId: groupId,
          channel: channel,
          senderId: auth?.currentUser?.uid,
        };
        await createMessage(messageDoc);
        setShowImageUpload(false);
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Error uploading image. Please try again.");
      }
    }
  };

  // the ugliest code I've ever written in the past 3 years
  // it's responsible for rotating the `+` button
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

        <div className="absolute top-0 -mt-8 flex justify-center items-center w-screen">
          <div
            className={`${
              showImageUpload ? "visible" : "hidden"
            } bg-gray-600 min-w-screen flex flex-row justify-center items-center absolute -left-[50px] gap-4 rounded-md`}
          >
            <div
              className="px-2 py-2 bg-transparent text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
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
        onChange={(e) => {
          setMessage(e.target.value);
          if (e.target.value.endsWith("@")) {
            const user = localStorage.getItem("pingedUser");
            localStorage.removeItem("pingedUser");
            setMessage((m) => m + (user ? user : ""));
          }
        }}
        value={message}
        id="inpt"
      />

      <button
        type="submit"
        className="ml-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring focus:border-blue-300"
      >
        Send
      </button>
    </form>
  );
};

export default Input;
