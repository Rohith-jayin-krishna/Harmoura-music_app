export default function Profile() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1
        className="text-3xl font-bold mb-4"
        style={{ color: "#f9243d" }}
      >
        Your Profile
      </h1>
      <p className="text-gray-600 mb-8">
        Manage your account and settings.
      </p>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-lg font-bold">
            P
          </div>
          <div className="ml-4">
            <h2 className="text-lg font-semibold">Rohith</h2>
            <p className="text-gray-500">rohith@example.com</p>
          </div>
        </div>
        <button
          className="px-4 py-2 rounded"
          style={{ backgroundColor: "#f9243d", color: "#fff" }}
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
}