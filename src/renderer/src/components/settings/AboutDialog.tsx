import { APP_NAME, APP_VERSION, APP_COPYRIGHT } from '../../config/constants'

interface AboutDialogProps {
  onClose: () => void
}

// Popup read-only info aplikasi. Konten dari config/constants.ts (APP_*).
export default function AboutDialog({ onClose }: AboutDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-[360px] flex flex-col items-center gap-3 shadow-xl">
        <div className="w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          </svg>
        </div>
        <h2 className="text-white font-semibold text-lg">{APP_NAME}</h2>
        <p className="text-gray-400 text-sm">Version {APP_VERSION}</p>
        <p className="text-gray-500 text-xs text-center">{APP_COPYRIGHT}</p>
        <button
          onClick={onClose}
          className="mt-2 px-5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded"
        >
          Close
        </button>
      </div>
    </div>
  )
}
