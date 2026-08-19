import { FileText, ThumbsUp, ExternalLink } from 'lucide-react';

function ResourceCard({ resource, currentUserId, onUpvote }) {
  const hasUpvoted = resource.upvotes?.includes(currentUserId);

  return (
    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md p-5 shadow-sm hover:border-gray-300 dark:hover:border-white/20 transition-all flex flex-col justify-between h-full group">
      <div>
        <div className="flex justify-between items-start gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-md flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-black text-sm md:text-base leading-tight text-gray-900 dark:text-white line-clamp-1 group-hover:text-indigo-500 transition-colors">
                {resource.title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-0.5">
                {resource.subject}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold px-2.5 py-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-sm text-gray-700 dark:text-gray-300 whitespace-nowrap shrink-0 uppercase tracking-wider">
            Sem {resource.semester} • {resource.branch}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
        <button 
          onClick={() => onUpvote(resource._id)} 
          className={`flex items-center gap-1.5 text-xs font-extrabold transition-colors px-3 py-1.5 rounded-sm border ${
            hasUpvoted 
              ? 'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20' 
              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-white/5 dark:text-gray-400 dark:border-white/5 dark:hover:bg-white/10'
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-current' : ''}`} /> 
          <span>{resource.upvotes?.length || 0}</span>
        </button>

        <a 
          href={resource.fileUrl} 
          target="_blank" 
          rel="noreferrer" 
          className="flex items-center gap-1.5 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-sm transition-all shadow-sm hover:-translate-y-0.5"
        >
          <span>Read Document</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

export default ResourceCard;