const React = require('react');
const { useState, useEffect } = React;

function AddToPlaylistDialog({ isOpen, onClose, onSave, playlists, title = 'Add to Playlist', createNewOption = true }) {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPlaylistId(playlists.length > 0 ? playlists[0].id : '');
      setNewPlaylistName('');
      setIsCreatingNew(false);
    }
  }, [isOpen, playlists]);

  const handleSave = () => {
    if (isCreatingNew) {
      if (newPlaylistName.trim()) {
        onSave({ createNew: true, name: newPlaylistName.trim() });
        setNewPlaylistName('');
        setIsCreatingNew(false);
        onClose();
        
        // Return focus to the main window
        setTimeout(() => {
          document.getElementById('root').focus();
        }, 100);
      }
    } else {
      if (selectedPlaylistId) {
        const selectedPlaylist = playlists.find(p => p.id === parseInt(selectedPlaylistId));
        onSave({ createNew: false, playlistId: parseInt(selectedPlaylistId), name: selectedPlaylist.name });
        onClose();
        
        // Return focus to the main window
        setTimeout(() => {
          document.getElementById('root').focus();
        }, 100);
      }
    }
  };

  const handleCancel = () => {
    setNewPlaylistName('');
    setIsCreatingNew(false);
    onClose();
    
    // Return focus to the main window
    setTimeout(() => {
      document.getElementById('root').focus();
    }, 100);
  };

  if (!isOpen) return null;

  return React.createElement('div', { className: 'modal-overlay' },
    React.createElement('div', { className: 'modal-content' },
      React.createElement('h2', null, title),
      
      // Radio buttons for selection
      React.createElement('div', { className: 'radio-group' },
        // Existing playlist option
        React.createElement('label', null,
          React.createElement('input', {
            type: 'radio',
            name: 'playlistOption',
            checked: !isCreatingNew,
            onChange: () => setIsCreatingNew(false)
          }),
          ' Select existing playlist'
        ),
        
        // Dropdown for existing playlists
        !isCreatingNew && playlists.length > 0 && React.createElement('select', {
          value: selectedPlaylistId,
          onChange: (e) => setSelectedPlaylistId(e.target.value),
          className: 'playlist-select'
        },
          playlists.map(playlist => 
            React.createElement('option', { key: playlist.id, value: playlist.id }, playlist.name)
          )
        ),
        
        // Message if no playlists exist
        !isCreatingNew && playlists.length === 0 && React.createElement('p', { className: 'no-playlists-message' }, 
          'No playlists available. Create a new one.'
        ),
        
        // Create new playlist option
        createNewOption && React.createElement('label', null,
          React.createElement('input', {
            type: 'radio',
            name: 'playlistOption',
            checked: isCreatingNew,
            onChange: () => setIsCreatingNew(true)
          }),
          ' Create new playlist'
        ),
        
        // Input for new playlist name
        isCreatingNew && React.createElement('input', {
          type: 'text',
          value: newPlaylistName,
          onChange: (e) => setNewPlaylistName(e.target.value),
          placeholder: 'Enter new playlist name',
          className: 'new-playlist-input',
          autoFocus: true
        })
      ),
      
      // Buttons
      React.createElement('div', { className: 'modal-buttons' },
        React.createElement('button', { onClick: handleCancel }, 'Cancel'),
        React.createElement('button', { 
          onClick: handleSave, 
          disabled: (isCreatingNew && !newPlaylistName.trim()) || (!isCreatingNew && !selectedPlaylistId)
        }, 'Save')
      )
    )
  );
}

module.exports = AddToPlaylistDialog;