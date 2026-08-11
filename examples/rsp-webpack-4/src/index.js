import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {initDatadog} from './observability';

// Browser RUM + logs for service:adobe-demo (no-op without RUM credentials).
initDatadog();

if (ReactDOM.version.startsWith('18')) {
  let ReactDOMClient = require('react-dom/client');
  const root = ReactDOMClient.createRoot(
    document.getElementById('root')
  );
  root.render(
      <App />
  );
} else {
  ReactDOM.render(
    <App />, document.getElementById("root")
  )
}
