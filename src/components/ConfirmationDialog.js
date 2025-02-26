const React = require('react');

function ConfirmationDialog({ isOpen, onClose, onConfirm, message = 'Are you sure?', confirmText = 'Confirm', cancelText = 'Cancel' }) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    
    // Return focus to the main window
    setTimeout(() => {
      document.getElementById('root').focus();
    }, 100);
  };

  const handleCancel = () => {
    onClose();
    
    // Return focus to the main window
    setTimeout(() => {
      document.getElementById('root').focus();
    }, 100);
  };

  return React.createElement('div', { className: 'modal-overlay' },
    React.createElement('div', { className: 'modal-content confirmation-dialog' },
      React.createElement('p', null, message),
      React.createElement('div', { className: 'modal-buttons' },
        React.createElement('button', { onClick: handleCancel }, cancelText),
        React.createElement('button', { onClick: handleConfirm, className: 'danger' }, confirmText)
      )
    )
  );
}

module.exports = ConfirmationDialog;