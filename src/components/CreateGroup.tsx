import { useState, FormEvent } from "react";
import { createGroup, } from "../firebase/db";

const CreateGroup = ({ close, creator, groups, canCreate }: { close: () => void, creator: any, groups: any, canCreate: boolean }) => {
  const [groupName, setGroupName] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validator = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\s]*[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?][a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\s]*$/;

    if (canCreate){
      if (validator.test(groupName) && groupName.length <= 30) {
        // Check if the groupName already exists in the groups array
        const exists = groups.some((group: any) => group.name === groupName.trim());
  
        if (exists) {
          close();
          alert('Group Name already exists!');
        } else {
          try {
            await createGroup({
              name: groupName.trim(),
              members: [creator],
              channels: ['Main'],
            });
          } catch (error) {
            alert(error);
          } finally {
            close();
          }
        }
      } else {
        close();
        alert('Unallowed Group Name!');
      }
    }else return alert("Max group amount reached!");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className='flex flex-col justify-center'>
        <h1 className="text-center text-2xl mb-4">Create a Group</h1>
        <input
          type="text"
          className='my-4 text-center text-white/80 bg-transparent rounded-md'
          placeholder='Enter a Group Name:'
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded-lg">
          Create
        </button>
      </div>
    </form>
  );
};

export default CreateGroup;
