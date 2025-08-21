import GlobalSearch from "../components/GlobalSearch";

export default function SearchPage() {
  const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Search</h1>
      <GlobalSearch token={token!} />
    </div>
  );
}