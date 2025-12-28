import React, { useState, useEffect } from 'react';
import { Role } from './types';
import { ROLES } from './constants';
import CustomerView from './views/Customer';
import StaffView from './views/Staff';
import AdminView from './views/Admin';
import { User, ChefHat, BarChart } from 'lucide-react';

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<Role>(Role.CUSTOMER);
  const [isAppMode, setIsAppMode] = useState(false);

  useEffect(() => {
    // Check URL params to determine default view (for converting to APK/Desktop App)
    // Usage: your-site.com?mode=staff or ?mode=admin
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    
    if (mode === 'staff') {
      setCurrentRole(Role.STAFF);
      setIsAppMode(true);
    } else if (mode === 'admin') {
      setCurrentRole(Role.ADMIN);
      setIsAppMode(true);
    }
  }, []);

  // Simple Role Switcher for Demo (Hidden if in specific App Mode)
  const renderRoleSwitcher = () => {
    if (isAppMode) return null; // Hide switcher if we are locked in a specific mode via URL
    
    return (
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 no-print group">
        <div className="bg-black/80 text-white text-xs p-2 rounded mb-2 hidden group-hover:block absolute bottom-full right-0 w-32">
          Switch Roles (Demo)
        </div>
        {ROLES.map(role => {
          const Icon = role.id === Role.CUSTOMER ? User : role.id === Role.STAFF ? ChefHat : BarChart;
          return (
            <button
              key={role.id}
              onClick={() => setCurrentRole(role.id)}
              className={`p-3 rounded-full shadow-lg transition-all ${
                currentRole === role.id 
                  ? 'bg-blue-600 text-white scale-110' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
              title={role.label}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>
    );
  };

  const renderView = () => {
    switch (currentRole) {
      case Role.CUSTOMER:
        return <CustomerView />;
      case Role.STAFF:
        return <StaffView />;
      case Role.ADMIN:
        return <AdminView />;
      default:
        return <CustomerView />;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
        {renderView()}
      </div>
      {renderRoleSwitcher()}
    </>
  );
};

export default App;