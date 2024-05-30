import React from "react";
import { updateProfile } from "firebase/auth";
import { auth } from "../firebase/config";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";

import "./css/gradient.css";

const Profile = ({ user, close }: { user: any; close: () => void }) => {
  const [newName, setNewName] = React.useState(user.displayName || "");
  const [previousName, setPreviousName] = React.useState<string | null>(
    user.displayName || ""
  );
  const [newImageFile, setNewImageFile] = React.useState<File | null>(null);
  const [newImageUrl, setNewImageUrl] = React.useState<string | null>(
    user.photoURL
  );
  const [updateError, setUpdateError] = React.useState<string | null>(null);

  const storage = getStorage();
  const navigate = useNavigate();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value: string = e.target.value;
    setPreviousName(user.displayName);
    setNewName(value);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setNewImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImageUrl(reader.result as string);
      };

      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (auth.currentUser) {
      try {
        if (newImageFile) {
          // Upload the image to Firebase Storage
          const storageRef = ref(
            storage,
            `profile_images/${auth.currentUser.uid}/${newImageFile.name}`
          );
          await uploadBytes(storageRef, newImageFile);

          // Get the download URL of the uploaded image
          const imageURL = await getDownloadURL(storageRef);

          // Update the user's profile with the new image URL
          await updateProfile(auth.currentUser, { photoURL: imageURL });
        }

        if (newName.trim() !== "" && newName !== previousName) {
          // Update the user's profile with the new display name
          await updateProfile(auth.currentUser, { displayName: newName });
        }

        // Close the form and reset state
        close();
        setUpdateError(null);
        setNewName("");
        setNewImageFile(null);
        setNewImageUrl(null);
      } catch (error) {
        console.error("Error updating profile: ", error);
        setUpdateError("An error occurred while updating the profile.");
      }
    }
  };

  return (
    <form onSubmit={handleUpdateProfile}>
      <div className="h-full w-full bg-gray-900 text-white p-4 flex flex-col justify-center items-center gap-4">
        <input
          type="text"
          className="p-2 w-full rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring focus:ring-indigo-200 focus:border-indigo-300"
          placeholder="Change your username:"
          value={newName}
          onChange={handleNameChange}
        />
        <label className="block text-sm font-medium text-gray-400 mt-4">
          Change Image:
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />
          <div className="mt-4 w-full">
            <label className="bg-indigo-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-indigo-700">
              Browse
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          </div>
        </label>
        <div className="flex justify-center align-center w-full h-full">
          {newImageFile && newImageUrl && (
            <img
              src={newImageUrl}
              alt="New Profile"
              className="my-4"
              style={{ maxWidth: "100px", maxHeight: "100px" }}
            />
          )}
        </div>
        {localStorage.getItem("isPro") !== "true" && (
          <div
            onClick={() => {
              navigate("/upgrade");
              localStorage.setItem("showPayPal", "false");
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 cursor-pointer"
          >
            <p className="gradient-text-btn">Upgrade Plan</p>
          </div>
        )}
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Update Profile
        </button>
        {updateError && <div className="text-red-500 mt-4">{updateError}</div>}
      </div>
    </form>
  );
};

export default Profile;
