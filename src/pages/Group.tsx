import {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowIcon,
  Input,
  Loading,
  Message,
  ChannelsMenu,
} from "../components";

import {
  exitGroup,
  getGroup,
  getMessageSnaphot,
  GroupData,
} from "../firebase/db";

import { auth } from "../firebase/config";

type GroupComponentProps = {
  user: any;
};

type MessageData = {
  id: string;
  content: string;
  senderPhotoURL: string;
  senderName: string;
  groupId: string;
  channel: string | { label: string; value: string };
  senderId: string | undefined;
  type: "text" | "image" | "audio";
  languages?: string;
  timestamp?: any;
};

const Group: FC<GroupComponentProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const cleanedId = id
    ? id.replace(/[^a-zA-Z0-9]/g, "")
    : "";

  const [groupData, setGroupData] =
    useState<GroupData | null>(null);

  const [messages, setMessages] =
    useState<MessageData[]>([]);

  const [channel, setChannel] =
    useState("Main");

  const [copied, setCopied] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchGroupData = async () => {
      if (!cleanedId) {
        setError("Invalid group ID.");
        setLoading(false);
        return;
      }

      try {
        const data = await getGroup({
          id: cleanedId,
        });

        if (!data) {
          if (!cancelled) {
            setError("Group could not be found.");
          }

          return;
        }

        if (!data.members.includes(user.uid)) {
          navigate("/", {
            replace: true,
          });

          return;
        }

        if (cancelled) {
          return;
        }

        setGroupData(data);

        document.title = `Group - ${data.name}`;

        const savedChannel =
          localStorage.getItem(
            `lastChannel_${cleanedId}`
          );

        const availableChannels =
          data.channels || [];

        const selectedChannel =
          savedChannel &&
          availableChannels.some(
            (item: any) =>
              item.toLowerCase() ===
              savedChannel.toLowerCase()
          )
            ? savedChannel
            : availableChannels.includes("Main")
              ? "Main"
              : availableChannels[0] || "Main";

        setChannel(selectedChannel);
      } catch {
        if (!cancelled) {
          setError(
            "Failed to load this group."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchGroupData();

    return () => {
      cancelled = true;
    };
  }, [cleanedId, navigate, user.uid]);

  useEffect(() => {
    if (!cleanedId) {
      return;
    }

    const unsubscribe = getMessageSnaphot({
      setMessages: (
        newMessages: MessageData[]
      ) => {
        const filteredMessages =
          newMessages
            .filter((message) => {
              if (
                message.groupId !==
                cleanedId
              ) {
                return false;
              }

              const messageChannel =
                typeof message.channel ===
                "string"
                  ? message.channel
                  : message.channel?.label;

              return (
                messageChannel ===
                channel
              );
            })
            .sort((a, b) => {
              const aTime =
                a.timestamp?.toMillis?.() ??
                0;

              const bTime =
                b.timestamp?.toMillis?.() ??
                0;

              return aTime - bTime;
            });

        setMessages(filteredMessages);
      },
    });

    return () => {
      unsubscribe?.();
    };
  }, [cleanedId, channel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  useEffect(() => {
    const image =
      localStorage.getItem("image");

    if (image) {
      localStorage.removeItem("image");
    }
  }, []);

  const copyGroupIdToClipboard =
    useCallback(async () => {
      if (!groupData?.id) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          groupData.id
        );

        setCopied(true);

        window.setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch {
        setError(
          "Unable to copy the group ID."
        );
      }
    }, [groupData?.id]);

  const handleChannelChange =
    useCallback(
      (newChannel: string) => {
        setChannel(newChannel);

        if (cleanedId) {
          localStorage.setItem(
            `lastChannel_${cleanedId}`,
            newChannel
          );
        }
      },
      [cleanedId]
    );

  const handleExit =
    useCallback(async () => {
      if (
        !cleanedId ||
        !user?.uid
      ) {
        return;
      }

      try {
        await exitGroup(
          cleanedId,
          user.uid
        );

        navigate("/", {
          replace: true,
        });
      } catch {
        setError(
          "Failed to leave the group."
        );
      }
    }, [
      cleanedId,
      navigate,
      user?.uid,
    ]);

  const currentUserId =
    auth.currentUser?.uid;

  const MessageItem = useMemo(
    () =>
      memo(
        ({
          message,
        }: {
          message: MessageData;
        }) => {
          const isCurrentUser =
            message.senderId ===
            currentUserId;

          const messageChannel =
            typeof message.channel ===
            "string"
              ? message.channel
              : message.channel?.label;

          return (
            <div
              className={`flex w-full ${
                isCurrentUser
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] md:max-w-[70%] ${
                  isCurrentUser
                    ? "items-end"
                    : "items-start"
                }`}
              >
                <Message
                  content={
                    message.content
                  }
                  senderPhotoURL={
                    message.senderPhotoURL
                  }
                  senderName={
                    message.senderName
                  }
                  channel={
                    messageChannel
                  }
                  languages={
                    navigator.language
                  }
                  groupId={
                    message.groupId
                  }
                  senderId={
                    message.senderId
                  }
                  type={
                    message.type
                  }
                />
              </div>
            </div>
          );
        }
      ),
    [currentUserId]
  );

  const channels = useMemo(
    () => groupData?.channels || [],
    [groupData?.channels]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <Loading />
      </div>
    );
  }

  if (!groupData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-950 px-6 text-center text-white">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-5 text-red-300">
          {error ||
            "Group could not be loaded."}
        </div>

        <button
          type="button"
          onClick={() =>
            navigate("/", {
              replace: true,
            })
          }
          className="rounded-xl bg-white/10 px-5 py-3 font-semibold transition hover:bg-white/15"
        >
          Return home
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-950 text-white">
      <div className="flex h-full flex-col">
        <header className="flex h-16 shrink-0 items-center border-b border-white/10 bg-gray-950/90 px-4 backdrop-blur md:px-6">
          <button
            type="button"
            onClick={() =>
              navigate("/", {
                replace: true,
              })
            }
            aria-label="Back"
            className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl text-white/60 transition hover:bg-white/5 hover:text-white"
          >
            <ArrowIcon />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold">{groupData.name}</h1>

            <p className="text-xs text-white/35">#{channel}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyGroupIdToClipboard}
              className="hidden rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white sm:block"
            >
              {copied ? "Copied!" : "Invite"}
            </button>

            <button
              type="button"
              onClick={handleExit}
              className="rounded-xl bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 hover:text-red-300 sm:px-4"
            >
              Leave
            </button>
          </div>
        </header>

        {error && (
          <div className="absolute left-1/2 top-20 z-40 -translate-x-1/2 rounded-xl border border-red-500/20 bg-gray-900 px-4 py-3 text-sm text-red-300 shadow-xl">
            {error}
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          <div className="hidden h-full md:block">
            <ChannelsMenu
              channels={channels}
              id={cleanedId}
              setChannel={handleChannelChange}
              selectedChannel={channel}
              isEditor={groupData.editor === user.uid}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 md:hidden">
              <span className="text-lg text-indigo-400">#</span>

              <span className="font-semibold">{channel}</span>

              <div className="ml-auto">
                <ChannelsMenu
                  channels={channels}
                  id={cleanedId}
                  setChannel={handleChannelChange}
                  selectedChannel={channel}
                  isEditor={groupData.editor === user.uid}
                />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5 md:px-8">
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center py-32">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-2xl text-indigo-400">
                        #
                      </div>

                      <h2 className="text-lg font-bold text-white">
                        {channel}
                      </h2>

                      <p className="mt-1 text-sm text-white/35">
                        This channel is empty. Start the conversation.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <MessageItem key={message.id} message={message} />
                  ))
                )}

                <div ref={messagesEndRef} className="pb-20" />
                <br/>
              </div>
            </div>
            <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-gray-950/95 px-5 py-3 backdrop-blur md:px-6 md:py-4">
              <div className="mx-auto flex w-full max-w-4xl justify-center">
                <div className="w-full">
                  <Input groupId={cleanedId} channel={channel} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Group;