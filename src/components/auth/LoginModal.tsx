import React from 'react';
import { ModernLoginPage } from './ModernLoginPage';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  return <ModernLoginPage isOpen={isOpen} onClose={onClose} isFullPage={false} />;
};
