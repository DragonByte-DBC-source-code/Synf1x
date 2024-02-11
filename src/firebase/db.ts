import { db } from "./firebaseConfig";
import {
  collection,
  addDoc,
  getDoc,
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  arrayRemove,
} from "firebase/firestore";

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
    window.location.replace(group.id);
  } catch (e: any) {
    alert("Error creating group: " + e.message);
  }
};

export type MessageProps = {
  senderName: string;
  senderPhotoURL: string;
  content: string;
  groupId: string;
  channel: string;
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

export const getGroup = async ({ id }: { id: string }) => {
  try {
    const groupRef = doc(db, "groups", id);
    const groupSnapshot = await getDoc(groupRef);

    if (groupSnapshot.exists()) {
      const data = { id: groupSnapshot.id, ...groupSnapshot.data() };
      return data;
    } else {
      window.location.replace("/");
      return null;
    }
  } catch (e: any) {
    alert("Error getting group: " + e.message);
    return null;
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
