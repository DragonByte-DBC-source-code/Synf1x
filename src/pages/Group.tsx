import React, { useEffect, FC, useState, useRef } from "react";
import { getGroup, exitGroup } from "../firebase/db";
import { useParams, useNavigate } from "react-router-dom";

import { Loading, Input, ChannelsMenu, Message, ArrowIcon } from "../components";
import { getMessageSnaphot } from "../firebase/db";
import { FixedSizeList } from "react-window";

import { auth } from "../firebase/firebaseConfig";

type GroupProps = {
  user: any;
};


const Group: FC<GroupProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const cleanedId = id ? id.replace(/[^a-zA-Z0-9]/g, "") : "";

  const [groupData, setGroupData] = useState<any | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [channel, setChannel] = useState<any>({ value: "Main", label: "Main" });
  const listRef = useRef<FixedSizeList | null>(null);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        if (cleanedId) {
          const data: any = await getGroup({ id: cleanedId });
          if (!data.members.includes(user.uid)) {
            navigate("/");
            return;
          }
          setGroupData(data);
          document.title = `Group - ${data.name}`;
        } else {
          alert("ID is undefined or contains invalid characters");
        }
      } catch (error) {
        console.error("Error fetching group data:", error);
      }
    };

    fetchGroupData();
  }, [cleanedId]);

  useEffect(() => {
    const unsubscribe: any = getMessageSnaphot({
      setMessages: (newMessages: any) => {
        // Filter messages for the selected channel and groupId
        const filteredMessages = newMessages.filter(
          (message: any) =>
            message.channel.label === channel.label && message.groupId === id
        );
        // Sort the filtered messages by timestamp
        const sortedMessages = filteredMessages
          .slice()
          .sort((a: any, b: any) => {
            if (a.timestamp && b.timestamp) {
              return a.timestamp.toMillis() - b.timestamp.toMillis();
            }
            return 0;
          });
        setMessages(sortedMessages);
      },
    });

    return () => unsubscribe();
  }, [channel.label, id]);

  useEffect(() => {
    listRef?.current?.scrollToItem(messages.length - 1, "smart");
  }, [messages]);

  const copyGroupIdToClipboard = () => {
    if (groupData) {
      const groupId = groupData.id;
      navigator.clipboard
        .writeText(groupId)
        .then(() => {
          alert("Code coppied. Share it with friends/coworkers, and enjoy!");
        })
        .catch((error) => console.error("Error copying to clipboard:", error));
    }
  };

  //destreoy the image in local storage
  useEffect(() => { 
    const image = localStorage.getItem('image');
    if (image) {
      localStorage.removeItem('image');
    }
  }, [])

  // Function to render each individual message
  const MessageItem: FC<{ index: number; style: React.CSSProperties }> = ({
    index,
    style,
  }) => {
    const message: any = messages[index];
    const isCurrentUser = message.senderName === auth.currentUser?.displayName; // Check if the message was sent by the current user

    // Define a CSS class to align messages to the right if sent by the current user
    const messageContainerClass = isCurrentUser ? "self-end" : "self-start";

    return (
      <div style={style} className={`pt-8 flex ${messageContainerClass}`}>
        {!isCurrentUser && <div className="flex-grow" />}
        <Message
          key={message.id}
          content={message.content}
          senderPhotoURL={message.senderPhotoURL}
          senderName={message.senderName}
          channel={channel.label}
          languages={navigator.language}
        />
        <div className="absolute max-sm:py-8 md:p-0" />
      </div>
    );
  };

  const exit = async () => {
    try {
      navigate("/");
      await exitGroup(cleanedId, user.uid);
    } catch (error) {
      console.error("Error exiting group:", error);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center bg-gray-700 text-white p-8 h-screen">
      {groupData ? (
        <div className="w-full max-w-screen-xl">
          <div className="flex justify-center items-center mb-6 top-3">
            <button
              onClick={() => navigate("/", { replace: true })}
              className="md:left-11 top-3 absolute bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded flex items-center max-sm:left-2"
            >
              <ArrowIcon />
            </button>
            <div className="flex justify-center items-center">
              <h1 className="text-5xl top-3 absolute self-center">
                {groupData.name}
              </h1>
            </div>
            <div className="flex items-end justify-end absolute right-11 top-3 max-sm:top-16 max-sm:justify-center max-sm:items-center max-sm:right-auto max-sm:pt-1">
              <button
                className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded top-3"
                onClick={copyGroupIdToClipboard}
              >
                Invite others {">"}
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded top-3 ml-4"
                onClick={() => exit()}
              >
                Exit Group
              </button>
            </div>
          </div>
          <div className="py-8" />{" "}
          {/* A space between the button and the menu */}
          <div className="flex flex-col absolute mt-32">
            <ChannelsMenu
              channels={groupData.channels}
              id={groupData.id}
              setChannel={setChannel}
              isEditor={groupData.editor == user.uid}
            />
          </div>
          <div className="mx-auto flex flex-col items-center md:pl-2">
            {messages && (
              <>
                <div
                  style={{
                    paddingTop: "7.5rem",
                  }}
                />
                <FixedSizeList
                  className="flex justify-center"
                  height={500}
                  width={"80%"}
                  itemCount={messages.length}
                  itemSize={240}
                  ref={listRef}
                >
                  {MessageItem}
                </FixedSizeList>
              </>
            )}
            <div className="flex flex-col items-center mt-[10.7rem]" id="input">
              {JSON.stringify(channel) != "{}" && (
                <Input groupId={id ?? ""} channel={channel} listRef={listRef}/>
              )}
            </div>
          </div>
        </div>
      ) : (
        <Loading />
      )}
    </div>
  );
};

export default Group;
