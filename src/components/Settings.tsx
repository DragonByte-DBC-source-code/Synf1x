import React, { useState, FormEvent } from "react";
import { updateProfile } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

const Settings = ({ user, close }: { user: any; close: () => void }) => {
    const [newName, setNewName] = useState(user.displayName || "");
    const [previousName, setPreviousName] = useState<string | null>(user.displayName || "");
    const [newImageFile, setNewImageFile] = useState<File | null>(null);
    const [newImageUrl, setNewImageUrl] = useState<string | null>(user.photoURL);
    const [updateError, setUpdateError] = useState<string | null>(null);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value: string = e.target.value;
        setPreviousName(user.displayName);
        setNewName(value);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            setNewImageFile(file);
            const imageUrl = URL.createObjectURL(file);
            setNewImageUrl(imageUrl);
        }
    };

    const handleUpdateProfile = (e: FormEvent) => {
        e.preventDefault();

        if (auth.currentUser) {
            updateProfile(auth.currentUser, {
                displayName: newName.trim() !== "" ? newName : previousName,
                photoURL: newImageUrl ?? auth.currentUser.photoURL,
            })
                .then(() => {
                    close();
                    setUpdateError(null);
                    setNewName("");
                })
                .catch((error) => {
                    console.error("Error updating profile: ", error);
                    setUpdateError("An error occurred while updating the profile.");
                });
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
                        <label className="bg-indigo-600 text-white px-4 py-2 rounded cursor-pointer hover-bg-indigo-700">
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
                        <img src={newImageUrl} alt="New Profile" className="my-4" style={{ maxWidth: "100px", maxHeight: '100px' }} />
                    )}
                </div>
                <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover-bg-indigo-700"
                >
                    Update Profile
                </button>
                {updateError && <div className="text-red-500 mt-4">{updateError}</div>}
            </div>
        </form>
    );
};

export default Settings;
