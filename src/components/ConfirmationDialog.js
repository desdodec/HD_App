const React = require('react');

function ConfirmationDialog({ isOpen, onClose, onConfirm, message = 'Are you sure?', confirmText = 'Confirm', cancelText = 'Cancel' }) {
  if (!isOpen) return null;

  return React.createElement('div', { className: 'modal-overlay' },
    React.createElement('div', { className: 'modal-content confirmation-dialog' },
      React.createElement('p', null, message),
      React.createElement('div', { className: 'modal-buttons' },
        React.createElement('button', { onClick: onClose }, cancelText),
        React.createElement('button', { onClick: onConfirm, className: 'danger' }, confirmText)
      )
    )
  );
}

module.exports = ConfirmationDialog;