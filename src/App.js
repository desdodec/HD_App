const React = require('react');
const { Fragment, useEffect, useState } = React;
const PlaylistSidebar = require('./components/PlaylistSidebar');
const SearchArea = require('./components/SearchArea');
const ResultsTable = require('./components/ResultsTable');
const database = require('./database.cjs');
const eventBus = require('./eventBus');

function App() {
  const [resultsTableKey, setResultsTableKey] = useState(1); // Added resultsTableKey state

  useEffect(() => {
    database.createDefaultPlaylist();
    eventBus.on('clearResults', handleClearResults); // Listen for clearResults event

    return () => {
      eventBus.off('clearResults', handleClearResults); // Remove clearResults listener on unmount
    };
  }, []);

  const handleClearResults = () => { // Handler for clearResults event
    console.log('App received clearResults event'); // Added log
    setResultsTableKey(prevKey => prevKey + 1); // Increment resultsTableKey to force remount
  };

  return (
    React.createElement(Fragment, null,
      React.createElement('h1', null, 'Desktop Music App'),
      React.createElement('p', null, 'Welcome to the Desktop Music App!'),
      React.createElement(PlaylistSidebar, null),
      React.createElement(SearchArea, null),
      React.createElement(ResultsTable, { key: resultsTableKey }) // Pass resultsTableKey as key prop
    )
  );
}

module.exports = App;