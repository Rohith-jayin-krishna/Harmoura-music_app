import { toast } from "react-toastify";
import React from "react";

export const confirmToast = (message: string, onConfirm: () => void) => {
  toast(
    ({ closeToast }) => (
      <div className="flex flex-col gap-2">
        <p>{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={closeToast}
            className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              closeToast?.();
            }}
            className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      </div>
    ),
    {
      position: "top-center",
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      closeButton: false,
    }
  );
};