export default function Loading(){
  return (
    <div className="absolute top-0 left-0 flex items-center justify-center w-full h-screen bg-gray-800">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full border-t-4 border-blue-500 border-solid h-12 w-12"/>
        <p className="mt-4 text-white">Loading...</p>
      </div>
    </div>
  );
};

