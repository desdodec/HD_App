const React = require('react');
const { useState, useEffect, Fragment } = React;
const database = require('../database.cjs');
const eventBus = require('../eventBus');
const PlaylistDialog = require('./PlaylistDialog');
const ConfirmationDialog = require('./ConfirmationDialog');

function PlaylistSidebar() {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState(null);

  useEffect(() => {
    loadPlaylists();

    eventBus.on('playlistCreated', loadPlaylists);
    eventBus.on('playlistDeleted', loadPlaylists);

    return () => {
      eventBus.off('playlistCreated', loadPlaylists);
      eventBus.off('playlistDeleted', loadPlaylists);
    };
  }, []);

  const loadPlaylists = async () => {
    const playlistsData = await database.getPlaylists();
    setPlaylists(playlistsData);
    // Emit playlistsLoaded event
    eventBus.emit('playlistsLoaded', playlistsData);
  };

  const handleCreatePlaylist = async (name) => {
    try {
      const newPlaylist = await database.createPlaylist(name);
      console.log('Playlist created:', newPlaylist);
      // Emit playlistCreated event
      eventBus.emit('playlistCreated', newPlaylist);
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!playlistToDelete) return;
    
    try {
      await database.deletePlaylist(playlistToDelete.id);
      console.log('Playlist deleted:', playlistToDelete);
      // Emit playlistDeleted event
      eventBus.emit('playlistDeleted', playlistToDelete.id);
      setPlaylistToDelete(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  };

  const handlePlaylistClick = (playlist) => {
    setSelectedPlaylist(playlist);
    // Emit playlistSelected event
    eventBus.emit('playlistSelected', playlist.name);
  };

  const openDeleteDialog = (playlist, event) => {
    event.stopPropagation(); // Prevent playlist selection when clicking delete
    event.preventDefault(); // Prevent default button behavior
    
    // Only open the dialog if it's not already open or if it's a different playlist
    if (!isDeleteDialogOpen || (playlistToDelete && playlistToDelete.id !== playlist.id)) {
      setPlaylistToDelete(playlist);
      setIsDeleteDialogOpen(true);
    }
  };

  return (
    React.createElement('div', { className: 'playlist-sidebar' },
      React.createElement('h2', null, 'Playlists'),
      React.createElement('ul', { className: 'playlist-list' },
        playlists.map(playlist => (
          React.createElement('li', {
            key: playlist.id,
            className: `playlist-item ${selectedPlaylist && selectedPlaylist.id === playlist.id ? 'active' : ''}`,
            onClick: () => handlePlaylistClick(playlist)
          },
            React.createElement('span', { className: 'playlist-name' }, playlist.name),
            React.createElement('div', { className: 'playlist-actions' },
              React.createElement('button', {
                onClick: (e) => openDeleteDialog(playlist, e),
                className: 'danger'
              }, 'Delete')
            )
          )
        ))
      ),
      React.createElement('button', {
        className: 'create-playlist-button',
        onClick: () => setIsCreateDialogOpen(true)
      }, 'Create Playlist'),
      
      // Create Playlist Dialog
      React.createElement(PlaylistDialog, {
        isOpen: isCreateDialogOpen,
        onClose: () => {
          setIsCreateDialogOpen(false);
          // Return focus to the main window after dialog closes
          setTimeout(() => {
            document.getElementById('root').focus();
          }, 100);
        },
        onSave: (name) => {
          handleCreatePlaylist(name);
          // Return focus to the main window after saving
          setTimeout(() => {
            document.getElementById('root').focus();
          }, 100);
        },
        title: 'Create Playlist'
      }),
      
      // Delete Confirmation Dialog
      React.createElement(ConfirmationDialog, {
        isOpen: isDeleteDialogOpen,
        onClose: () => {
          setIsDeleteDialogOpen(false);
          setPlaylistToDelete(null);
          // Return focus to the main window after dialog closes
          setTimeout(() => {
            document.getElementById('root').focus();
          }, 100);
        },
        onConfirm: () => {
          handleDeletePlaylist();
          // Return focus to the main window after confirming
          setTimeout(() => {
            document.getElementById('root').focus();
          }, 100);
        },
        message: playlistToDelete ? `Are you sure you want to delete playlist "${playlistToDelete.name}"?` : '',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      })
    )
  );
}

module.exports = PlaylistSidebar;