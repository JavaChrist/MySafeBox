import React from 'react';
import { Home, Globe, Wifi } from 'lucide-react';
import { isProduction } from '../config/environment';

interface ConnectionStatusProps {
  className?: string;
}

interface ConnectionInfo {
  type: "LOCAL" | "DISTANT";
  displayUrl: string;
  isSecure: boolean;
  icon: string;
  badge: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const getConnectionInfo = (): ConnectionInfo => {
    if (isProduction()) {
      return {
        type: 'DISTANT',
        displayUrl: 'Firebase Cloud',
        isSecure: true,
        icon: 'Globe',
        badge: 'CLOUD'
      };
    }

    return {
      type: 'LOCAL',
      displayUrl: 'Développement',
      isSecure: true,
      icon: 'Home',
      badge: 'DEV'
    };
  };

  const connectionInfo = getConnectionInfo();

  const getIconComponent = () => {
    switch (connectionInfo.icon) {
      case 'Home':
        return <Home className="w-4 h-4" />;
      case 'Globe':
        return <Globe className="w-4 h-4" />;
      default:
        return <Wifi className="w-4 h-4" />;
    }
  };

  const getBadgeColor = () => {
    if (connectionInfo.type === 'LOCAL') {
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    }
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Badge principal - Compact */}
      <div className={`inline-flex items-center gap-1 px-1.5 py-1 rounded-md border text-xs font-medium ${getBadgeColor()}`}>
        {getIconComponent()}
        <span className="hidden sm:inline">{connectionInfo.badge}</span>
      </div>

      {/* Indicateur Firebase - Compact */}
      <div className="inline-flex items-center gap-1 px-1.5 py-1 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs">
        <span>🔥</span>
        <span className="hidden sm:inline">Firebase</span>
      </div>
    </div>
  );
};