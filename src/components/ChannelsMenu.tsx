import { FormEvent, useState } from "react";
import Select from "react-select";
import { updateGroup } from "../firebase/db";

const ChannelsMenu = ({ channels, id, setChannel, isEditor }: { channels: any, id: string, setChannel: any, isEditor: boolean }) => {
  const mapChannels = (channels: any) => channels.map((ch: string) => ({ label: ch, value: ch }));

  const [options, setOptions] = useState<any>(mapChannels(channels));
  const [showModal, setShowModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");

  const darkModeStyles: any = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: "#2d3748",
      color: "white",
      border: "1px solid #4a5568",
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: "#2d3748",
      color: "white",
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#718096" : "#2d3748",
      color: "white",
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: "#a0aec0",
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: "white",
    }),
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (channels.indexOf(newChannelName) === -1) { // no such channel yet?
      await updateGroup(id, { channels: [...channels, newChannelName] });

      // Update options using the functional form of setOptions
      setOptions((prevOptions: any) => [...prevOptions, { label: newChannelName, value: newChannelName }]);

      // Reset the input and close the modal
      setNewChannelName("");
      setShowModal(false);
    } else {
      setShowModal(false);
      setNewChannelName("");
      alert("Can't create 2 cahnnels with the same name!")
    }
  };

  return (
    <div className="flex">
      {isEditor && 
        <button
          className="bg-gray-700 text-white py-2 px-1 rounded-xl border border-r-0 border-gray-700 sm:px-3"
          onClick={() => setShowModal(true)}
        >
          +
        </button>
      }
      <Select
        options={options}
        isSearchable={true}
        placeholder="Channels"
        styles={darkModeStyles}
        className="rounded-r"
        onChange={(selected: any) => setChannel(selected)}
      />

      {showModal && (
        <form onSubmit={handleSubmit} className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="bg-gray-800 p-8 rounded shadow-lg z-10">
            <h2 className="text-white text-xl mb-4">Create a new channel</h2>
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              className="w-full border p-2 mb-4 bg-gray-700 text-white"
              placeholder="Channel Name"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Create
            </button>
            <button
              className="ml-2 text-gray-400 hover:text-gray-100"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ChannelsMenu;
