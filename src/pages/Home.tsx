import React, { useState, useEffect } from "react";
import Logo from "../assets/synf1x/logo_transparent.png";
import { Profile, JoinGroup, CreateGroup, GroupsDisplay } from "../components";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { getGroupsSnapshot } from "../firebase/db";
import { useNavigate } from "react-router-dom";


const Home: React.FC<{ user: any }> = ({ user }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [groups, setGroups] = useState([]);
  const [groupsAmount, setGroupsAmount] = useState(0);

  const navigate = useNavigate();

  const openSettings = () => setShowProfile(true);
  const closeSettings = () => setShowProfile(false);
  const openJoin = () => setShowJoin(true);
  const closeJoin = () => setShowJoin(false);

  useEffect(() => {
    const unsubscribe: any = getGroupsSnapshot({ setGroups });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    document.title = "Synf1x"
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-800 text-white">
      <header className="bg-gray-800 p-4 flex justify-between items-center py-4">
        <div className="flex items-center gap-2">
          <img
            src={user.photoURL}
            alt="User"
            className="h-8 w-8 rounded-full"
            onClick={() => setShowProfile(state => !state)}
          />
          <h1 className="text-3xl font-semibold max-sm:hidden pl-2">Welcome, {user.displayName}!</h1>
        </div>
        <div className="flex gap-3">
          <button
            className="bg-transparent text-gray-400 hover:text-white hover:bg-gray-600 py-2 px-4 rounded-full"
            onClick={openSettings}
          >
            Profile
          </button>
          <button
            className="bg-transparent text-gray-400 hover:text-white hover:bg-gray-600 py-2 px-4 rounded-full"
            onClick={() => {
              signOut(auth);
              navigate("/signup");
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main
        className="flex-1 flex flex-col justify-center items-center py-8"
        style={{ maxHeight: "calc(100vh - 150px)" }}
      >
        <div className="rounded-lg w-3/4 mb-4">
          <button
            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg w-full"
            onClick={() => setShowCreate(true)}
          >
            Create a Group
          </button>
        </div>
        <div className="rounded-lg w-3/4 mb-4">
          <button
            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg w-full"
            onClick={openJoin}
          >
            Join a Group
          </button>
        </div>
        <GroupsDisplay user={user} groups={groups} set={setGroupsAmount} />
      </main>

      <footer className="sm:hidden xs:hidden md:hidden lg:block">
        <div className="flex items-center justify-center">
          <img src={Logo} alt="Logo" className="h-36 w-36 fixed -bottom-8" />
        </div>
      </footer>

      {showProfile && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-900 p-4 rounded-lg w-3/4">
            <Profile user={user} close={closeSettings} />
            <button
              className="bg-gray-700 text-white py-2 px-4 rounded-lg mt-4 md:w-1/5 max-sm:w-auto"
              onClick={closeSettings}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {showJoin && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-900 p-4 rounded-lg w-3/4 flex flex-col items-center">
            <JoinGroup canJoin={groupsAmount <= 2} set={setGroupsAmount} />
            <button
              className="bg-gray-700 text-white py-2 px-4 rounded-lg mt-4 md:w-1/5 max-sm:w-auto"
              onClick={closeJoin}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {showCreate && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-900 p-4 rounded-lg w-3/4 flex flex-col items-center">
            <CreateGroup
              close={() => setShowCreate(false)}
              creator={user}
              groups={groups.filter((group: any) => group.members.includes(user.uid))}
              canCreate={groupsAmount <= 2}
            />
            <button
              className="bg-gray-700 text-white py-2 px-4 rounded-lg mt-4 md:w-1/5 max-sm:w-auto"
              onClick={() => setShowCreate(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
