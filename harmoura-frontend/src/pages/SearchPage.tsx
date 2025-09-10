import GlobalSearch from "../components/GlobalSearch";

export default function SearchPage() {
  const token =
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 px-4 sm:px-6 py-12">
      <div className="max-w-4xl mx-auto animate-fadeSlide">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-500 bg-clip-text text-transparent tracking-tight">
            Search
          </h1>
          <p className="mt-3 text-gray-700 text-sm sm:text-lg">
  Discover <span className="font-semibold text-red-600">songs</span>,{" "}
  <span className="font-semibold text-red-600">artists</span>, and{" "}
  <span className="font-semibold text-red-600">albums</span> instantly
</p>

        </div>

        {/* Search Box Card */}
        <div className="relative group">
          <div className="bg-white/90 backdrop-blur-lg border border-pink-100 rounded-3xl shadow-xl transition-all duration-500 group-hover:shadow-2xl group-hover:scale-[1.02] p-8 relative z-10">
            <GlobalSearch token={token!} />
          </div>

          {/* Glow Effect */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400 opacity-0 blur-2xl group-hover:opacity-30 transition duration-500 -z-10"></div>
        </div>

        {/* Decorative Animated Gradient Line */}
        <div className="mt-16 flex justify-center">
          <div className="w-2/3 h-1 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shimmer_2s_infinite]" />
          </div>
        </div>
      </div>

      {/* Keyframes for shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
