const React = require('react');
const { useState, useEffect, Fragment } = React;
const database = require('../database.cjs');
const eventBus = require('../eventBus');

function PlaylistSidebar() {
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    loadPlaylists();

    eventBus.on('playlistCreated', loadPlaylists);

    return () => {
      eventBus.off('playlistCreated', loadPlaylists);
    };
  }, []);

  const loadPlaylists = async () => {
    const playlistsData = await database.getPlaylists();
    setPlaylists(playlistsData);
  };

  return (
    React.createElement(Fragment, null,
      React.createElement('h2', null, 'Playlists'),
      React.createElement('ul', null,
        playlists.map(playlist => (
          React.createElement('li', { key: playlist.id }, playlist.name)
        ))
      )
    )
  );
}

module.exports = PlaylistSidebar;