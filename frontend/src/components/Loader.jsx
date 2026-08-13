import { Loader2 } from 'lucide-react';

function Loader({ text = "Loading...", className = "py-12" }) {
  return (
    <div className={`flex flex-col items-center justify-center w-full gap-3 text-gray-500 dark:text-gray-400 ${className}`}>
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      <span className="text-xs font-bold uppercase tracking-wider">{text}</span>
    </div>
  );
}

export default Loader;