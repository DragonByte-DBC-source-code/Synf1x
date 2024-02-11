import React, { useState, useEffect, useRef } from "react";
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
  delay: number;
}

const GroupItem: React.FC<GroupItemProps> = ({ group, delay }) => {
  const [isVisible, setIsVisible] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  const props = useSpring({
    opacity: isVisible ? 1 : 0,
    from: { opacity: 0 },
    reset: true,
    config: { duration: 120, easing: (n) => n * 0.2 },
    delay,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        entry.isIntersecting ? setIsVisible(true) : setIsVisible(false);
      },
      {
        threshold: 0.5,
      }
    );

    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    return () => {
      if (targetRef.current) {
        observer.unobserve(targetRef.current);
      }
    };
  }, []);

  return (
    <animated.div
      ref={targetRef}
      style={props}
      className="ease-in-out flex justify-center items-center border-b border-gray-700 hover:bg-gray-800 hover:text-gray-300 cursor-pointer transition-all duration-300 h-full"
      key={group.id}
    >
      <p className="text-lg py-2 text-center w-full hover:text-gray-300 ease-in-out">
        {group.name}
      </p>
    </animated.div>
  );
};

type GroupsDisplayProps = {
  groups: Group[];
  user: { uid: string };
  set: any;
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
      <h2
        className="text-2xl italic mt-12 cursor-pointer flex items-center"
        onClick={() => setShowMenu((show) => !show)}
      >
        Your Groups
        <animated.svg
          style={arrowAnimation}
          className="ml-1 w-5 h-5 mt-1 transform"
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
      </h2>
      {showMenu && <p className="text-sm mb-2">Explore Below:</p>}
      {showMenu && (
        <div className="overflow-auto h-40 w-1/2 bg-gray-800 text-white rounded-md scrollbar">
          {userGroups.length > 0 ? (
            <>
              {userGroups.map((group) => (
                <div
                  onClick={() => navigate(group.id)}
                  className="w-full h-full"
                >
                  <GroupItem key={group.id} group={group} delay={100} />
                </div>
              ))}
            </>
          ) : (
            <>
              {showLoading ? (
                <Loading />
              ) : (
                <>
                  <p className="text-center py-2 text-lg max-sm:hidden">
                    No groups! Join or create some so they'll be shown here.
                  </p>
                  <div className="md:hidden max-sm:visible">
                    <p className="text-center py-2 text-lg">
                      No groups to show!
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupsDisplay;
