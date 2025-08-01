import React, { useEffect, useState } from 'react';
import { Shield, Clock } from 'lucide-react';
import Modal from './Modal';

interface InactivityWarningProps {
  isOpen: boolean;
  onStayConnected: () => void;
  onLogout: () => void;
  warningDuration: number; // Durée du warning en secondes
}

const InactivityWarning: React.FC<InactivityWarningProps> = ({
  isOpen,
  onStayConnected,
  onLogout,
  warningDuration
}) => {
  const [countdown, setCountdown] = useState(warningDuration);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(warningDuration);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, warningDuration, onLogout]);

  const handleStayConnected = () => {
    setCountdown(warningDuration);
    onStayConnected();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleStayConnected}
      title="Session expirée"
      message=""
    >
      <div className="text-center space-y-4">
        <Shield className="mx-auto h-12 w-12 text-orange-500" />

        <div className="space-y-2">
          <p className="text-gray-300">
            Votre session va expirer dans <strong className="text-white">{countdown} secondes</strong> en raison d'une inactivité prolongée.
          </p>
          <p className="text-sm text-gray-400">
            Cliquez sur "Rester connecté" pour prolonger votre session.
          </p>
        </div>

        <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
          <Clock className="h-4 w-4" />
          <span>Sécurité MySafeBox</span>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            onClick={handleStayConnected}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Rester connecté
          </button>
          <button
            onClick={onLogout}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InactivityWarning;