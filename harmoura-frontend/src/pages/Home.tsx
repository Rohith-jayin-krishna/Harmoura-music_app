export default function Home() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1
        className="text-3xl font-bold mb-4"
        style={{ color: "#f9243d" }}
      >
        Welcome to Harmoura
      </h1>
      <p className="text-gray-600 mb-8">
        Your personal music streaming experience — inspired by the elegance of Apple Music.
      </p>

      {/* Featured section */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Featured Playlists</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array(8)
            .fill(0)
            .map((_, idx) => (
              <div
                key={idx}
                className="bg-gray-200 rounded-lg h-40 flex items-center justify-center text-gray-500 hover:opacity-80 transition"
              >
                Playlist {idx + 1}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}