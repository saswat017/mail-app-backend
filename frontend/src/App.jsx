import { useState, useEffect } from "react";
import Login from "./Login";
import Inbox from "./Inbox";
import Compose from "./Compose";
import "./App.css";

// Set VITE_API_BASE in .env.development / .env.production (or your host's env settings).
// Falls back to localhost:5000 if it's not defined anywhere.
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [view, setView] = useState("inbox"); // "inbox" or "compose"

  // On load, ask the backend: am I already logged in?
  useEffect(() => {
    fetch(`${API_BASE}/auth/status`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setLoggedIn(data.loggedIn))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return <div className="centered">Checking login status...</div>;
  }

  if (!loggedIn) {
    return <Login apiBase={API_BASE} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>My Mail</h1>
        <nav>
          <button
            className={view === "inbox" ? "active" : ""}
            onClick={() => setView("inbox")}
          >
            Inbox
          </button>
          <button
            className={view === "compose" ? "active" : ""}
            onClick={() => setView("compose")}
          >
            Compose
          </button>
        </nav>
      </header>

      <main>
        {view === "inbox" && <Inbox apiBase={API_BASE} />}
        {view === "compose" && <Compose apiBase={API_BASE} />}
      </main>
    </div>
  );
}

export default App;