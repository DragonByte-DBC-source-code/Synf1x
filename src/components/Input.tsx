import { FormEvent, useState } from "react";
import { MessageProps, createMessage } from "../firebase/db";
import { auth } from "../firebase/firebaseConfig";

type Props = {
  groupId: string;
  channel: string;
};

const Input = ({ groupId, channel }: Props) => {
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (message.trim() !== '') {
      try {
        const authUser: any = auth?.currentUser;
        const mDoc: MessageProps = {
          content: message.substring(0, 400),
          senderPhotoURL: authUser.photoURL,
          senderName: authUser.displayName,
          groupId: groupId,
          channel: channel,
        };
        setMessage('');
        await createMessage(mDoc);
      } catch (error) {
        console.error("Error submitting message:", error);
        alert("Error submitting message. Please try again.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex justify-center items-center absolute bottom-4 left-0 w-full pt-12">
      <input
        type="text"
        className="text-center px-4 py-2 border border-gray-500 rounded-md focus:outline-none focus:border-blue-500 bg-gray-800 text-white w-1/3 max-sm:w-1/2"
        placeholder="Type a message..."
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
