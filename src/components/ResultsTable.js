const React = require('react');
const { useState, useEffect, Fragment } = React;
const eventBus = require('../eventBus');
const database = require('../database.cjs');

function ResultsTable() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    eventBus.on('search', handleSearch);

    return () => {
      eventBus.off('search', handleSearch);
      eventBus.off('clearResults', handleClearResults); // Remove clearResults listener on unmount
    };
  }, []);

  const handleClearResults = () => { // New handler for clearResults event
    console.log('ResultsTable received clearResults event'); // Added log
    console.log('ResultsTable before setResults([])', results); // Log before setResults
    setResults([]); // Clear the results state
    console.log('ResultsTable after setResults([])', results); // Log after setResults
    setTimeout(() => { // Use setTimeout to set to empty array in next render cycle
      setResults([]); // Then set results to empty array
    }, 0);
  };





  const handleSearch = async (data) => {
    console.log('Search Term:', data.searchTerm);
    console.log('Filter:', data.filter);
    console.log('ResultsTable received filter:', data.filter); // Added log
    console.log('Dropdown Column:', data.dropdownFilterColumn); // Added log
    console.log('Dropdown Search Term:', data.dropdownSearchTerm); // Added log
    const searchResults = await database.getTracks(data.searchTerm, data.filter, data.dropdownFilterColumn, data.dropdownSearchTerm); // Pass dropdown filter params
    setResults(searchResults);
  };

  return (
    React.createElement(Fragment, null,
      React.createElement('h2', null, 'Search Results'),
      React.createElement('table', null,
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', null, 'ID'),
            React.createElement('th', null, 'Title'),
            React.createElement('th', null, 'Description')
          )
        ),
        React.createElement('tbody', null,
          results.map(result => (
            React.createElement('tr', { key: result.id },
              React.createElement('td', null, result.id),
              React.createElement('td', null, result.title),
              React.createElement('td', null, result.description)
            )
          ))
        )
      )
    )
  );
}

module.exports = ResultsTable;