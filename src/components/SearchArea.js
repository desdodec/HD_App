const React = require('react');
const { useState, Fragment } = React;
const eventBus = require('../eventBus');

function SearchArea() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All Tracks');
  const [dropdownFilterColumn, setDropdownFilterColumn] = useState('id'); // Set default dropdown filter to 'id'
  const [dropdownSearchTerm, setDropdownSearchTerm] = useState('');

  const handleSearch = (filterValue) => {
    console.log('Search term:', searchTerm, 'Filter:', filterValue, 'Dropdown Column:', dropdownFilterColumn, 'Dropdown Search Term:', dropdownSearchTerm);
    console.log('SearchArea emitting filter:', filterValue, 'Dropdown Column:', dropdownFilterColumn, 'Dropdown Search Term:', dropdownSearchTerm);
    eventBus.emit('search', { searchTerm, filter: filterValue, dropdownFilterColumn, dropdownSearchTerm });
  };

  const handleDropdownFilterColumnChange = (event) => {
    setDropdownFilterColumn(event.target.value);
  };

  const handleDropdownSearchTermChange = (event) => {
    setDropdownSearchTerm(event.target.value);
  };


  return (
    React.createElement(Fragment, null,
      React.createElement('input', {
        type: 'text',
        placeholder: 'Search...',
        value: searchTerm,
        onChange: (e) => setSearchTerm(e.target.value)
      }),
      React.createElement('button', { onClick: () => handleSearch(filter) }, 'Search'),
      React.createElement('button', { onClick: () => { setSearchTerm(''); setFilter('All Tracks'); setDropdownFilterColumn('id'); setDropdownSearchTerm(''); console.log('SearchArea emitting clearResults event'); eventBus.emit('clearResults'); } }, 'Clear'), // Added Clear button and emit clearResults event + log
      React.createElement('div', null,
        React.createElement('button', { onClick: () => { console.log('Clicked All Tracks button'); setFilter('All Tracks'); handleSearch('All Tracks'); } }, 'All Tracks'),
        React.createElement('button', { onClick: () => { console.log('Clicked Vocal button'); setFilter('Vocal'); handleSearch('Vocal'); } }, 'Vocal'),
        React.createElement('button', { onClick: () => { console.log('Clicked Solo button'); setFilter('Solo'); handleSearch('Solo'); } }, 'Solo'),
        React.createElement('button', { onClick: () => { console.log('Clicked Instrumental button'); setFilter('Instrumental'); handleSearch('Instrumental'); } }, 'Instrumental')
      ),
      React.createElement('div', null, // Dropdown filters container
        React.createElement('select', { value: dropdownFilterColumn, onChange: handleDropdownFilterColumnChange },
          React.createElement('option', { value: '' }, 'No Filter'),
          React.createElement('option', { value: 'id' }, 'ID'),
          React.createElement('option', { value: 'title' }, 'Title'),
          React.createElement('option', { value: 'composer' }, 'Composer'),
          React.createElement('option', { value: 'cd_title' }, 'CD Title'),
          React.createElement('option', { value: 'library' }, 'Library'),
          React.createElement('option', { value: 'version' }, 'Version')
        ),
        React.createElement('input', {
          type: 'text',
          placeholder: 'Dropdown Filter Search...',
          value: dropdownSearchTerm,
          onChange: handleDropdownSearchTermChange
        }),
        React.createElement('button', { onClick: () => handleSearch(filter, dropdownFilterColumn, dropdownSearchTerm) }, 'Apply Dropdown Filter')
      )
    )
  );
}

module.exports = SearchArea;