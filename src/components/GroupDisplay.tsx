import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "./Loading";
import { useSpring, animated } from "react-spring";

import "./css/scrollbar.css";

type Group = {
  id: string;
  name: string;
  members: string[];
};

interface GroupItemProps {
  group: Group;
  onSelect: (id: string) => void;
}

interface GroupsDisplayProps {
  groups: Group[];
  user: { uid: string };
  set: any;
}

const GroupItem: React.FC<GroupItemProps> = ({ group, onSelect }) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(group.id)}
      className="w-full text-left px-4 py-3 flex items-center justify-between gap-2
        border-b border-gray-700/70 last:border-b-0
        text-gray-200 hover:bg-gray-700/60 hover:text-white
        focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/70
        transition-colors duration-150"
    >
      <span className="text-base truncate">{group.name}</span>
      <span className="text-xs text-gray-500 shrink-0">
        {group.members.length}{" "}
        {group.members.length === 1 ? "member" : "members"}
      </span>
    </button>
  );
};

const GroupsDisplay: React.FC<GroupsDisplayProps> = ({ groups, user, set }) => {
  const navigate = useNavigate();
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [showLoading, setShowLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(true);

  const arrowAnimation = useSpring({
    transform: `rotate(${showMenu ? 0 : -90}deg)`,
    config: { tension: 400, friction: 20 },
  });

  const panelAnimation = useSpring({
    opacity: showMenu ? 1 : 0,
    transform: showMenu ? "translateY(0px)" : "translateY(-6px)",
    config: { tension: 400, friction: 30 },
  });

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const filteredGroups = groups.filter((group) =>
          group.members.includes(user.uid)
        );

        const sortedGroups = filteredGroups.sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        set(sortedGroups.length);
        setUserGroups(sortedGroups);
      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setShowLoading(false);
      }
    };

    fetchGroups();
  }, [groups, user, navigate]);

  return (
    <div className="mb-4 w-full flex flex-col items-center rounded-2xl bg-transparent">
      <button
        type="button"
        onClick={() => setShowMenu((show) => !show)}
        aria-expanded={showMenu}
        className="mt-12 flex items-center gap-1.5 text-2xl italic text-gray-100
          hover:text-gray-300 transition-colors duration-150
          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 rounded-md px-1"
      >
        Your Groups
        <animated.svg
          style={arrowAnimation}
          className="w-5 h-5 mt-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="M19 9l-7 7-7-7"
          />
        </animated.svg>
      </button>

      <animated.div
        style={panelAnimation}
        className="w-full flex flex-col items-center"
      >
        {showMenu && (
          <>
            <p className="text-sm text-gray-400 mb-2">Explore below:</p>

            <div className="overflow-auto h-40 w-full max-w-sm bg-gray-800 text-white rounded-xl border border-gray-700/70 shadow-sm scrollbar">
              {showLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loading />
                </div>
              ) : userGroups.length > 0 ? (
                userGroups.map((group) => (
                  <GroupItem
                    key={group.id}
                    group={group}
                    onSelect={(id) => navigate(`/groups/${id}`)}
                  />
                ))
              ) : (
                <div className="h-full flex items-center justify-center px-4">
                  <p className="text-center text-gray-300">
                    <span className="hidden sm:inline">
                      No groups! Join or create some so they'll be shown here.
                    </span>
                    <span className="sm:hidden">No groups to show!</span>
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </animated.div>
    </div>
  );
};

export default GroupsDisplay;
