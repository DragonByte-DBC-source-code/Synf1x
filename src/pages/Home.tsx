import {
  Profile,
  JoinGroup,
  CreateGroup,
  GroupsDisplay,
  Loading,
} from "../components";

import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { getGroupsSnapshot } from "../firebase/db";

import { useState, useEffect } from "react";
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

  // the function that retrieves all the groups from the database, JIT based
  useEffect(() => {
    const unsubscribe: any = getGroupsSnapshot({ setGroups });
    return () => unsubscribe();
  }, [setGroups]); // Add any other dependencies here if needed

  // title changer
  useEffect(() => {
    document.title = "Synf1x | Home";
  }, []);

  return (
    <>
      {groups.length >= 0 ? (
        <div className="flex flex-col min-h-screen bg-gray-800 text-white">
          <header className="bg-gray-800 p-4 flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <img
                src={user.photoURL}
                alt="User"
                className="rounded-full cursor-pointer w-9 h-9 mt-1"
                onClick={() => setShowProfile((state) => !state)}
              />
              <h1 className="text-3xl font-semibold max-sm:hidden pl-2">
                Welcome, {user.displayName}!
              </h1>
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
            <div className="flex justify-center items-center w-3/4">
              <GroupsDisplay
                user={user}
                groups={groups}
                set={setGroupsAmount}
              />
            </div>
          </main>

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
                <JoinGroup
                  canJoin={
                    groupsAmount < 2 || localStorage.getItem("isPro") == "true"
                  }
                  set={setGroupsAmount}
                />
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
                  groups={groups.filter((group: any) =>
                    group.members.includes(user.uid)
                  )}
                  canCreate={
                    groupsAmount < 2 || localStorage.getItem("isPro") == "true"
                  }
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
      ) : (
        <Loading />
      )}
    </>
  );
};

export default Home;
