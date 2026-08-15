import { Link } from 'react-router-dom';
import { MapPin, Code, ChevronRight } from 'lucide-react';

function StudentCard({ student }) {
  return (
    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-md p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full group">
      <div>
        <div className="flex items-start gap-4 mb-4">
          <img 
            src={student.profilePicture || "https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3485.jpg"} 
            alt={student.name} 
            className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border border-gray-100 dark:border-white/10 shrink-0" 
          />
          <div>
            <h3 className="font-black text-base md:text-lg leading-tight text-gray-900 dark:text-white group-hover:text-indigo-500 transition-colors">
              {student.name}
            </h3>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-semibold flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0 text-indigo-500" /> 
              <span>{student.course || "B.Tech"} • {student.branch || "CSE"}</span>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
            <Code className="w-3.5 h-3.5" /> Technical Stack
          </div>
          <div className="flex flex-wrap gap-1.5">
            {student.techStack?.length > 0 ? (
              student.techStack.slice(0, 4).map((tech, i) => (
                <span key={i} className="px-2.5 py-1 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-sm text-[11px] font-bold text-gray-700 dark:text-gray-300">
                  {tech}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400 italic">No stack listed</span>
            )}
            {student.techStack?.length > 4 && (
              <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-sm text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                +{student.techStack.length - 4}
              </span>
            )}
          </div>
        </div>
      </div>

      <Link 
        to={`/hub/student/${student._id}`} 
        className="w-full py-2.5 bg-gray-50 dark:bg-white/5 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-gray-700 dark:text-gray-300 hover:text-white dark:hover:text-white rounded-sm text-xs font-extrabold flex justify-center items-center gap-1 transition-all border border-transparent hover:shadow-md"
      >
        <span>View Full Profile</span>
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export default StudentCard;