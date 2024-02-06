import { FC, useState, useEffect } from "react";

type MessageProps = {
  senderName: string;
  senderPhotoURL: string;
  content: string;
  channel: string;
  languages: string;
};

const Message: FC<MessageProps> = ({ content, senderPhotoURL, senderName, channel }) => {
  const [translated, setTranslated] = useState<any>([]);

  const translateAPI = import.meta.env.VITE_TRANSLATE_API;
  useEffect(() => {
    const fetchTranslate = async () => {
      try {
        const response = await fetch(translateAPI, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: content,
            language: String(navigator.language).split('-')[0],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setTranslated(data.data);
        }
      } catch (error) {
        console.error('Error during translation:', error);
      }
    };

    fetchTranslate();
  }, []);

  return (
    <div className="flex items-start space-x-4 p-4 justify-start max-sm:rounded-md">
      {channel && (
        <>
          <img src={senderPhotoURL} alt={senderName} className="w-12 h-12 rounded-full" />
          <div className="flex flex-col pb-4">
            <p className="font-bold text-lg">{senderName}</p>
            {translated.length > 0 ? (
              <p className="text-lg">{translated}</p>
            ) : (
              <p className="text-sm">Translating...</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Message;
