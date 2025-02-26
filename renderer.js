const React = require('react');
const ReactDOM = require('react-dom/client');
const App = require('./src/App');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  React.createElement(React.StrictMode, null,
    React.createElement(App, null)
  )
);