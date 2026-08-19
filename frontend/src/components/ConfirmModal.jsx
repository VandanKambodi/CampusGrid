import { AlertTriangle, Trash2, X } from 'lucide-react';

function ConfirmModal({ isOpen, onClose, onConfirm, title = "Confirm Deletion", message = "Are you sure you want to proceed? This action cannot be undone.", confirmText = "Delete", isDanger = true }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#151516] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 relative">
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-xl shrink-0 ${isDanger ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
            {isDanger ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-4 py-2 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer ${
              isDanger 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
