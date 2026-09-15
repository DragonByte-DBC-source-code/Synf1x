import React from "react";
import { updateProfile } from "firebase/auth";
import { auth } from "../firebase/config";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { updateMessageSenderInfo } from "../firebase/db";
import "./css/gradient.css";

const Profile = ({
  user,
  close,
}: {
  user: any;
  close: () => void;
}) => {
  const [newName, setNewName] = React.useState(user.displayName || "");
  const [newImageFile, setNewImageFile] = React.useState<File | null>(null);
  const [newImageUrl, setNewImageUrl] = React.useState<string | null>(
    user.photoURL || null
  );
  const [updateError, setUpdateError] = React.useState<string | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const storage = getStorage();
  const navigate = useNavigate();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const hasChanges =
    newName.trim() !== (user.displayName || "") || newImageFile !== null;

  const handleNameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNewName(e.target.value);
    setUpdateError(null);
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUpdateError("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUpdateError("Image must be smaller than 5 MB.");
      return;
    }

    setNewImageFile(file);
    setUpdateError(null);

    const reader = new FileReader();

    reader.onloadend = () => {
      setNewImageUrl(reader.result as string);
    };

    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!auth.currentUser || !hasChanges || isUpdating) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      let imageURL = auth.currentUser.photoURL;
      let displayName = auth.currentUser.displayName;

      if (newImageFile) {
        const storageRef = ref(
          storage,
          `profile_images/${auth.currentUser.uid}/${Date.now()}_${newImageFile.name}`
        );

        await uploadBytes(storageRef, newImageFile);
        imageURL = await getDownloadURL(storageRef);

        await updateProfile(auth.currentUser, {
          photoURL: imageURL,
        });
      }

      if (newName.trim() !== (user.displayName || "")) {
        displayName = newName.trim();

        await updateProfile(auth.currentUser, {
          displayName,
        });
      }

      await updateMessageSenderInfo(
        auth.currentUser.uid,
        displayName,
        imageURL
      );

      close();
    } catch (error) {
      setUpdateError(
        "Something went wrong while updating your profile."
      );
      console.error("Error updating profile:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpgrade = () => {
    localStorage.setItem("showPayPal", "false");
    navigate("/upgrade");
  };

  return (
    <form
      onSubmit={handleUpdateProfile}
      className="w-full"
    >
      <div className="w-full max-w-md mx-auto rounded-2xl border border-white/10 bg-gray-900/95 p-6 text-white shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Profile
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Customize your profile information
            </p>
          </div>

          <button
            type="button"
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-gray-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="mb-6 flex flex-col items-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative h-28 w-28 overflow-hidden rounded-full border-2 border-white/10 bg-gray-800 transition hover:border-indigo-500"
          >
            {newImageUrl ? (
              <img
                src={newImageUrl}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-gray-500">
                {(newName || "?").charAt(0).toUpperCase()}
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-medium opacity-0 transition group-hover:opacity-100">
              Change photo
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />

          <p className="mt-3 text-xs text-gray-500">
            JPG, PNG or GIF · Max 5 MB
          </p>

          {newImageFile && (
            <p className="mt-1 max-w-full truncate text-xs text-indigo-400">
              {newImageFile.name}
            </p>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Display name
            </label>

            <input
              type="text"
              value={newName}
              onChange={handleNameChange}
              maxLength={40}
              placeholder="Enter your display name"
              className="w-full rounded-xl border border-gray-700 bg-gray-800/80 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />

            <div className="mt-1 flex justify-end text-xs text-gray-500">
              {newName.length}/40
            </div>
          </div>

          {localStorage.getItem("isPro") !== "true" && (
            <button
              type="button"
              onClick={handleUpgrade}
              className="group w-full rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-left transition hover:border-indigo-500/60 hover:bg-indigo-500/15"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">
                    Upgrade to Pro
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Unlock the full experience
                  </p>
                </div>

                <span className="text-indigo-400 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>
            </button>
          )}

          {updateError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {updateError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={close}
              disabled={isUpdating}
              className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 font-medium text-gray-300 transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!hasChanges || isUpdating}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isUpdating ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default Profile;
