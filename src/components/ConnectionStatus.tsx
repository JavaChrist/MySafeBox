import React from 'react';
import { Home, Globe, Wifi, WifiOff } from 'lucide-react';
import type { ConnectionInfo } from '../types';
import { isLocalNetwork, isOnNAS, getAPIUrl } from '../config/environment';

interface ConnectionStatusProps {
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const getConnectionInfo = (): ConnectionInfo => {
    const url = getAPIUrl();

    if (isOnNAS()) {
      return {
        type: 'LOCAL',
        url,
        displayUrl: 'Sur NAS',
        isSecure: true,
        icon: 'Home',
        badge: 'NAS'
      };
    }

    if (isLocalNetwork()) {
      return {
        type: 'LOCAL',
        url,
        displayUrl: 'Réseau local',
        isSecure: url.startsWith('https'),
        icon: 'Home',
        badge: 'LAN'
      };
    }

    return {
      type: 'DISTANT',
      url,
      displayUrl: 'Réseau distant',
      isSecure: url.startsWith('https'),
      icon: 'Globe',
      badge: 'WAN'
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
        return connectionInfo.isSecure ?
          <Wifi className="w-4 h-4" /> :
          <WifiOff className="w-4 h-4" />;
    }
  };

  const getBadgeColor = () => {
    if (connectionInfo.type === 'LOCAL') {
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    }
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Badge principal */}
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${getBadgeColor()}`}>
        {getIconComponent()}
        <span>{connectionInfo.badge}</span>
      </div>

      {/* Indicateur de sécurité */}
      {!connectionInfo.isSecure && connectionInfo.type === 'DISTANT' && (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs">
          <WifiOff className="w-3 h-3" />
          <span>Non sécurisé</span>
        </div>
      )}
    </div>
  );
};