const React = require('react');
const { useState, useEffect } = React;

function PlaylistDialog({ isOpen, onClose, onSave, initialName = '', title = 'Create Playlist' }) {
  const [playlistName, setPlaylistName] = useState(initialName);

  // Reset the playlist name when the dialog opens with a new initialName
  useEffect(() => {
    setPlaylistName(initialName);
  }, [initialName, isOpen]);

  const handleSave = () => {
    if (playlistName.trim()) {
      onSave(playlistName);
      setPlaylistName('');
      onClose();
    }
  };

  const handleCancel = () => {
    setPlaylistName('');
    onClose();
  };

  if (!isOpen) return null;

  return React.createElement('div', { className: 'modal-overlay' },
    React.createElement('div', { className: 'modal-content' },
      React.createElement('h2', null, title),
      React.createElement('input', {
        type: 'text',
        value: playlistName,
        onChange: (e) => setPlaylistName(e.target.value),
        placeholder: 'Enter playlist name',
        autoFocus: true
      }),
      React.createElement('div', { className: 'modal-buttons' },
        React.createElement('button', { onClick: handleCancel }, 'Cancel'),
        React.createElement('button', { onClick: handleSave, disabled: !playlistName.trim() }, 'Save')
      )
    )
  );
}

module.exports = PlaylistDialog;