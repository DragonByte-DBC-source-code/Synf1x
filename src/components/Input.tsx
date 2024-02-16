import { FormEvent, useState, useRef, useEffect } from "react";
import { MessageProps, createMessage } from "../firebase/db";
import { auth } from "../firebase/firebaseConfig";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import UploadButton from "../assets/synf1x/upload_btn.png";
import PlusButton from "../assets/synf1x/plusButton.png";

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

const Input = ({ groupId, channel, listRef }: Props) => {
  const [message, setMessage] = useState("");
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [placeholder, setPlaceholder] = useState("");
  const storage = getStorage();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const plusButtonRef = useRef(null);

  const authUser: any = auth?.currentUser;

  // have control over the screen size so the placeholder is set accordingly
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (message.trim() !== "") {
      try {
        // Create a message with the text content
        const messageDoc: MessageProps = {
          content: message.substring(0, 400),
          senderPhotoURL: authUser?.photoURL,
          senderName: authUser?.displayName,
          groupId: groupId,
          channel: channel,
        };
        await createMessage(messageDoc);
        // Clear the message input
        setMessage("");
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Error sending message. Please try again.");
      }
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
        };
        await createMessage(messageDoc);
        listRef?.current?.scrollToItem(0, "smart");
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
      (plusButtonRef.current as HTMLElement).classList.add("rotate-90"); // Add this line
    }
    setTimeout(() => {
      if (plusButtonRef.current) {
        (plusButtonRef.current as HTMLElement).classList.remove("rotate-90"); // Add this line
      }
    }, 333);
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
            {[1, 2, 3].map((i) => (
              <div
                className="px-2 py-2 bg-transparent text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
                key={i}
              >
                <img
                  src={UploadButton}
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
              </div>
            ))}
          </div>
        </div>
      </div>

      <input
        type="text"
        className="text-center px-4 py-2 border border-gray-500 rounded-md focus:outline-none focus:border-blue-500 bg-gray-800 text-white md:w-1/3 max-sm:w-1/4"
        placeholder={placeholder}
        onChange={(e) => setMessage(e.target.value)}
        value={message}
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
