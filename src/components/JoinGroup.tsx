import React, { useState } from 'react';
import { getGroup, updateGroup } from '../firebase/db';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebaseConfig';

type Props = {
    canJoin: boolean;
    set: any
}

const JoinGroup: React.FC<Props> = ({ canJoin, set }) => {
    const [groupId, setGroupId] = useState<string>("");
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        const groupData: any = await getGroup({ id: groupId });

        if (canJoin) {
            if (groupData) {
                groupData.members.push(auth.currentUser?.uid);
                // Update the group data in Firebase
                await updateGroup(groupData.id, { members: groupData.members });
                set((c: number) => c + 1)
                // Navigate to the correct route (you may need to adjust this based on your app's routing)
                navigate(groupData.id);
            }else return alert('No such group found!')
        } else return alert("Max group amount reached!");
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className='flex flex-col justify-center'>
                <h1 className="text-center text-2xl mb-4">Join a Group</h1>
                <input
                    type="text"
                    className='my-4 text-center text-white/80 bg-transparent rounded-md'
                    placeholder='Enter a Group Code:'
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                />
                <button type="submit" className="bg-blue-500 text-white p-2 rounded-lg">
                    Join Group
                </button>
            </div>
        </form>
    );
}

export default JoinGroup;
