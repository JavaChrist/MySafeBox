import React from 'react';
import { Shield, Wifi, Globe } from 'lucide-react';
import { getConnectionInfo } from '../config/environment';

interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  className = '',
  showDetails = true
}) => {
  const connectionInfo = getConnectionInfo();

  const getStatusColor = () => {
    if (connectionInfo.type === 'LOCAL') {
      return 'text-green-400 bg-green-900/20 border-green-700';
    }
    return 'text-blue-400 bg-blue-900/20 border-blue-700';
  };

  const getIcon = () => {
    if (connectionInfo.type === 'LOCAL') {
      return <Wifi className="h-3 w-3" />;
    }
    return <Globe className="h-3 w-3" />;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Badge de statut */}
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor()}`}>
        {getIcon()}
        <span>{connectionInfo.badge}</span>
      </div>

      {/* Détails si demandés */}
      {showDetails && (
        <div className="flex items-center space-x-1 text-xs text-gray-400">
          {connectionInfo.isSecure && (
            <Shield className="h-3 w-3 text-green-400" />
          )}
          <span>{connectionInfo.displayUrl}</span>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;