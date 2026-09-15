import { db } from "./config";

import {
  collection,
  arrayUnion,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  arrayRemove,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

export type GroupData = {
  id: string;
  name: string;
  members: string[];
  channels: string[];
  editor: string;
};

// also needed somewhere else so we'll export it
export type MessageProps = {
  senderName: string;
  senderPhotoURL: string;
  content: string;
  languages: string | undefined;
  groupId: string;
  channel: string;
  senderId: string | undefined;  //actually? always defined. Only authorized users can send messages  
  type: "text" | "image" | "audio"
};

export const createGroup = async ({
  channels,
  name,
  members,
}: {
  channels: any;
  name: string;
  members: any[];
}) => {
  try {
    const cleanedMembers = members.map((member) =>
      member.uid.replace(/[^a-zA-Z0-9]/g, "")
    );

    const groupData = {
      name: name,
      members: cleanedMembers,
      channels: channels,
      editor: cleanedMembers[0],
    };

    const group = await addDoc(collection(db, "groups"), groupData);
    
    window.location.replace(`/groups/${group.id}`);
  } catch (e: any) {
    alert("Error creating group: " + e.message);
  }
};

export const createMessage = async (message: MessageProps) => {
  try {
    const docRef: any = await addDoc(collection(db, "messages"), {
      ...message,
      timestamp: serverTimestamp(), // Adding a timestamp for reference
    });

    // Retrieve the created document's data
    const messageDoc = await getDoc(doc(db, "messages", docRef.id));

    if (messageDoc.exists()) {
      const messageData: any = { id: messageDoc.id, ...messageDoc.data() };
      return messageData.content;
    } else {
      alert("Error retrieving message data");
      return null;
    }
  } catch (error) {
    console.error("Error creating message:", error);
    throw error; // Throw the error to handle it appropriately
  }
};

export const getGroup = async ({
  id,
}: {
  id: string;
}): Promise<GroupData | null> => {
  try {
    const groupRef = doc(db, "groups", id);
    const groupSnapshot = await getDoc(groupRef);

    if (!groupSnapshot.exists()) {
      return null;
    }

    const data = groupSnapshot.data();

    return {
      id: groupSnapshot.id,
      name: data.name as string,
      members: (data.members || []) as string[],
      channels: (data.channels || []) as string[],
      editor: data.editor as string,
    };
  } catch (e: any) {
    throw new Error(
      "Error getting group: " + e.message
    );
  }
};

export const getMessageSnaphot = ({ setMessages }: { setMessages: any }) => {
  try {
    const messagesCollection = collection(db, "messages");

    const unsubscribe = onSnapshot(messagesCollection, (snapshot) => {
      const messageData: any = [];
      snapshot.forEach((doc) => {
        messageData.push({ id: doc.id, ...doc.data() });
      });

      setMessages(messageData);
    });

    // Return the unsubscribe function (optional, for cleanup)
    return () => {
      unsubscribe();
    };
  } catch (e: any) {
    console.error("Error getting message snapshot:", e.message);
    throw e;
  }
};

export const getGroupsSnapshot = ({ setGroups }: { setGroups: any }) => {
  try {
    const groupsCollection = collection(db, "groups");

    const unsubscribe = onSnapshot(groupsCollection, (snapshot) => {
      const groupsData: any = [];
      snapshot.forEach((doc) => {
        groupsData.push({ id: doc.id, ...doc.data() });
      });

      setGroups(groupsData);
    });

    // Return the unsubscribe function (optional, for cleanup)
    return () => unsubscribe();
  } catch (e: any) {
    console.error("Error getting groups snapshot:", e.message);
    return null;
  }
};

export const updateGroup = async (groupId: string, data: any) => {
  try {
    const groupRef = doc(db, "groups", groupId);

    // Use the updateDoc function to update specific fields in the document
    await updateDoc(groupRef, data);
  } catch (e: any) {
    alert("Error updating group: " + e.message);
  }
};

export const exitGroup = async (groupId: string, userId: string) => {
  const groupRef = doc(db, "groups", groupId);
  const groupSnapshot = await getDoc(groupRef);
  const groupName = groupSnapshot.data()?.name;

  await updateDoc(groupRef, {
    members: arrayRemove(userId),
  });

  alert(`Successfully exited the group ${groupName}`);
};

export const createChannel = async (groupId: string, channelName: string) => {
  const name = channelName.trim();

  if (!name) {
    throw new Error("Channel name cannot be empty.");
  }

  if (name.length > 32) {
    throw new Error("Channel name cannot exceed 32 characters.");
  }

  if (name.includes("/")) {
    throw new Error("Channel names cannot contain '/'.");
  }

  const groupRef = doc(db, "groups", groupId);
  const groupSnapshot = await getDoc(groupRef);

  if (!groupSnapshot.exists()) {
    throw new Error("Group does not exist.");
  }

  const data = groupSnapshot.data();
  const channels: string[] = data.channels || [];

  if (
    channels.some((channel) => channel.toLowerCase() === name.toLowerCase())
  ) {
    throw new Error("A channel with this name already exists.");
  }

  await updateDoc(groupRef, {
    channels: arrayUnion(name),
  });
};

export const updateMessageSenderInfo = async (
  userId: string,
  senderName: string | null, // always set though because I've denied any null options for this prop way earlier in development
  senderPhotoURL: string | null,
) => {
  try {
    // Query messages sent by the user
    const messagesQuery = query(
      collection(db, "messages"),
      where("senderId", "==", userId)
    );
    const querySnapshot = await getDocs(messagesQuery);

    // Iterate over each message
    querySnapshot.forEach(async (doc) => {
      try {
        // Update sender information for each message
        if (senderPhotoURL != null) {
          await updateDoc(doc.ref, {
            senderName: senderName,
            senderPhotoURL: senderPhotoURL,
          });
        } else {
          await updateDoc(doc.ref, {
            senderName: senderName,
          });
        }
      } catch (error) {
        console.error("Error updating message:", error);
      }
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

export const deleteMessage = () => { 
  // TODO: create the deletion logic for an individual message
}
