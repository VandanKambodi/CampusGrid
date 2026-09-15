import { AlertTriangle } from 'lucide-react';
import EventManagement from '../components/EventManagement';

function AdminEvents() {
  const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');

  if (currentUser.role !== 'admin' && !currentUser.isAdmin) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
        <p className="text-xs text-gray-500">You must be a system administrator to manage campus events.</p>
      </div>
    );
  }

  return <EventManagement />;
}

export default AdminEvents;
