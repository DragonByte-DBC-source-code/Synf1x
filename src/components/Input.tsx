import { FormEvent, useState, useRef } from "react";
import { MessageProps, createMessage } from "../firebase/db";
import { auth } from "../firebase/firebaseConfig";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import UploadButton from "../assets/synf1x/upload_btn.png";

interface Props {
  groupId: string;
  channel: string;
}

const imageSizeProps = {
  width: 25.5,
  height: 25.5,
};

const Input = ({ groupId, channel }: Props) => {
  const [message, setMessage] = useState("");
  const storage = getStorage();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const authUser: any = auth?.currentUser;

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
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Error uploading image. Please try again.");
      }
    }
  };

  const handleUploadButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex justify-center items-center absolute bottom-4 left-0 w-full pt-12"
    >
      <input
        type="text"
        className="text-center px-4 py-2 border border-gray-500 rounded-md focus:outline-none focus:border-blue-500 bg-gray-800 text-white w-1/3 max-sm:w-1/2"
        placeholder="Type a message..."
        onChange={(e) => setMessage(e.target.value)}
        value={message}
      />
      <div>
        <div
          className="ml-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 cursor-pointer"
          onClick={handleUploadButtonClick}
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
      </div>
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
