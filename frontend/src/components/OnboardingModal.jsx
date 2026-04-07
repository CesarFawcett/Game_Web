import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X, Zap } from 'lucide-react';

const OnboardingModal = ({ isOpen, message, onClose, title = "COMUNICADO DEL SISTEMA" }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="onboarding-overlay">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="onboarding-card glass-panel"
          >
            <div className="onboarding-header">
              <div className="onboarding-title-wrap">
                <Zap size={20} className="text-gold pulse" />
                <h3 className="gradient-text">{title}</h3>
              </div>
              <button className="close-btn" onClick={onClose}>
                <X size={18} />
              </button>
            </div>
            
            <div className="onboarding-body">
              <div className="info-icon-wrap">
                <Info size={40} className="text-primary" />
              </div>
              <p className="onboarding-message">
                {message}
              </p>
            </div>

            <div className="onboarding-footer">
              <div className="scanline-mini"></div>
              <button className="btn-entendido" onClick={onClose}>
                <Zap size={18} /> ENTENDIDO
              </button>
            </div>
          </motion.div>

          <style>{`
            .onboarding-overlay {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.85);
              backdrop-filter: blur(8px);
              z-index: 9999;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 2rem;
            }

            .onboarding-card {
              max-width: 500px;
              width: 100%;
              padding: 2rem;
              border: 1px solid rgba(212, 175, 55, 0.3);
              box-shadow: 0 0 30px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(212, 175, 55, 0.05);
              position: relative;
              overflow: hidden;
            }

            .onboarding-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 2rem;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1);
              padding-bottom: 1rem;
            }

            .onboarding-title-wrap {
              display: flex;
              align-items: center;
              gap: 0.8rem;
            }

            .onboarding-title-wrap h3 {
              margin: 0;
              font-size: 1rem;
              letter-spacing: 2px;
              font-weight: 800;
            }

            .onboarding-body {
              display: flex;
              gap: 1.5rem;
              align-items: flex-start;
              margin-bottom: 2rem;
            }

            .info-icon-wrap {
              background: rgba(59, 130, 246, 0.1);
              padding: 1rem;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .onboarding-message {
              margin: 0;
              font-size: 1.1rem;
              line-height: 1.6;
              color: var(--text-main);
              font-weight: 500;
            }

            .onboarding-footer {
              display: flex;
              justify-content: flex-end;
              position: relative;
            }

            .close-btn {
              background: none;
              border: none;
              color: var(--text-muted);
              cursor: pointer;
              transition: color 0.3s;
            }

            .close-btn:hover {
              color: #ef4444;
            }

            .pulse {
              animation: pulse 2s infinite;
            }

            @keyframes pulse {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.2); opacity: 0.7; }
              100% { transform: scale(1); opacity: 1; }
            }

            .scanline-mini {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 2px;
              background: rgba(212, 175, 55, 0.1);
              animation: scan 4s linear infinite;
            }

            @keyframes scan {
              0% { top: -100%; }
              100% { top: 200%; }
            }
          `}</style>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingModal;
