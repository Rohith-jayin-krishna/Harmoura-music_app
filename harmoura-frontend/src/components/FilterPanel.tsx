import { FaTimes } from "react-icons/fa";

type FilterPanelProps = {
  panelRef: React.RefObject<HTMLDivElement>;
  languages: string[];
  emotions: string[];
  artists: string[];
  selectedLanguage: string;
  selectedEmotion: string;
  selectedArtist: string;
  onSelectLanguage: (lang: string) => void;
  onSelectEmotion: (emo: string) => void;
  onSelectArtist: (art: string) => void;
  onClear: () => void;
  onClose: () => void;
};

export default function FilterPanel({
  panelRef,
  languages,
  emotions,
  artists,
  selectedLanguage,
  selectedEmotion,
  selectedArtist,
  onSelectLanguage,
  onSelectEmotion,
  onSelectArtist,
  onClear,
  onClose,
}: FilterPanelProps) {
  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 z-20 w-full sm:w-auto sm:min-w-[22rem] bg-white border rounded-xl shadow-lg p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Filters</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="text-xs px-2 py-1 rounded-full border hover:bg-gray-50"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Language Filter */}
      {languages.length > 1 && (
        <div className="mb-3">
          <span className="block text-sm font-medium text-gray-600 mb-1">Language</span>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => onSelectLanguage(lang)}
                className={`px-3 py-1 rounded-full border text-sm transition ${
                  selectedLanguage === lang
                    ? "bg-[#f9243d] text-white border-[#f9243d]"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Emotion Filter */}
      {emotions.length > 1 && (
        <div className="mb-3">
          <span className="block text-sm font-medium text-gray-600 mb-1">Emotion</span>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {emotions.map((emo) => (
              <button
                key={emo}
                onClick={() => onSelectEmotion(emo)}
                className={`px-3 py-1 rounded-full border text-sm transition ${
                  selectedEmotion === emo
                    ? "bg-[#f9243d] text-white border-[#f9243d]"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                {emo}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Artist Filter */}
      {artists.length > 1 && (
        <div>
          <span className="block text-sm font-medium text-gray-600 mb-1">Artist</span>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {artists.map((art) => (
              <button
                key={art}
                onClick={() => onSelectArtist(art)}
                className={`px-3 py-1 rounded-full border text-sm transition ${
                  selectedArtist === art
                    ? "bg-[#f9243d] text-white border-[#f9243d]"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                {art}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
