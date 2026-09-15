import { FormEvent, useEffect, useState } from "react";
import { createChannel } from "../firebase/db";

interface ChannelsMenuProps {
  channels: string[];
  id: string;
  setChannel: (channel: string) => void;
  selectedChannel: string;
  isEditor: boolean;
}

const ChannelsMenu = ({
  channels,
  id,
  setChannel,
  selectedChannel,
  isEditor,
}: ChannelsMenuProps) => {
  const [showModal, setShowModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const lastChannel = localStorage.getItem(`lastChannel_${id}`);

    if (
      lastChannel &&
      channels.some(
        (channel) => channel.toLowerCase() === lastChannel.toLowerCase()
      )
    ) {
      setChannel(lastChannel);
    } else if (channels.length > 0) {
      setChannel(
        channels.some((channel) => channel === "Main") ? "Main" : channels[0]
      );
    }
  }, [id, channels, setChannel]);

  const selectChannel = (channel: string) => {
    setChannel(channel);
    localStorage.setItem(`lastChannel_${id}`, channel);
  };

  const closeModal = () => {
    if (creating) {
      return;
    }

    setShowModal(false);
    setNewChannelName("");
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = newChannelName.trim();

    if (!name) {
      setError("Channel name cannot be empty.");
      return;
    }

    if (name.length > 32) {
      setError("Channel name cannot exceed 32 characters.");
      return;
    }

    if (name.includes("/")) {
      setError("Channel names cannot contain '/'.");
      return;
    }

    if (
      channels.some((channel) => channel.toLowerCase() === name.toLowerCase())
    ) {
      setError("A channel with this name already exists.");
      return;
    }

    setCreating(true);
    setError("");

    try {
      await createChannel(id, name);

      selectChannel(name);
      closeModal();
    } catch (error: any) {
      setError(error?.message || "Failed to create channel.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <aside className="flex h-full w-64 shrink-0 flex-col border-r border-white/10 bg-gray-950/70">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="text-xs font-semibold uppercase tracking-widest text-white/40">
            Channels
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-1">
            {channels.map((channel) => {
              const selected = channel === selectedChannel;

              return (
                <button
                  key={channel}
                  type="button"
                  onClick={() => selectChannel(channel)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                    selected
                      ? "bg-indigo-500/15 text-white shadow-sm"
                      : "text-white/50 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span
                    className={`text-lg leading-none ${
                      selected
                        ? "text-indigo-400"
                        : "text-white/30 group-hover:text-white/60"
                    }`}
                  >
                    #
                  </span>

                  <span className="min-w-0 flex-1 truncate font-medium">
                    {channel}
                  </span>

                  {selected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {isEditor && (
          <div className="border-t border-white/10 p-3">
            <button
              type="button"
              onClick={() => {
                setError("");
                setShowModal(true);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-white/50 transition hover:bg-white/5 hover:text-white"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-lg">
                +
              </span>

              <span>Create channel</span>
            </button>
          </div>
        )}
      </aside>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={closeModal}
            className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
          />

          <form
            onSubmit={handleSubmit}
            className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl"
          >
            <div className="mb-6">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-xl text-indigo-400">
                #
              </div>

              <h2 className="text-xl font-bold text-white">Create a channel</h2>

              <p className="mt-1 text-sm text-white/40">
                Add a new place for conversations in this group.
              </p>
            </div>

            <div>
              <label
                htmlFor="channel-name"
                className="mb-2 block text-sm font-medium text-white/70"
              >
                Channel name
              </label>

              <input
                id="channel-name"
                type="text"
                value={newChannelName}
                onChange={(event) => {
                  setNewChannelName(event.target.value);
                  setError("");
                }}
                placeholder="e.g. gaming"
                maxLength={32}
                autoFocus
                disabled={creating}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 disabled:opacity-50"
              />

              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-red-400">{error}</span>

                <span className="text-xs text-white/25">
                  {newChannelName.length}/32
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={creating}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 font-semibold text-white/60 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!newChannelName.trim() || creating}
                className="flex-1 rounded-xl bg-indigo-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {creating ? "Creating..." : "Create channel"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChannelsMenu;
