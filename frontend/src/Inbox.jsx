import { useState, useEffect } from "react";

function Inbox({ apiBase }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null); // full body of the opened email
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetch(`${apiBase}/read/messages`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setMessages(data.messages);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [apiBase]);

  const openMessage = (id) => {
    setLoadingDetail(true);
    setSelected(null);
    fetch(`${apiBase}/read/messages/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setSelected(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingDetail(false));
  };

  if (loading) return <p>Loading inbox...</p>;
  if (error) return <p className="error">Error: {error}</p>;

  // If a message is open, show it full-screen with a back button
  if (selected || loadingDetail) {
    return (
      <div className="message-detail">
        <button onClick={() => setSelected(null)}>&larr; Back to inbox</button>
        {loadingDetail ? (
          <p>Loading message...</p>
        ) : (
          <>
            <h2>{selected.subject || "(no subject)"}</h2>
            <p className="meta">
              <strong>From:</strong> {selected.from}
            </p>
            <p className="meta">
              <strong>Date:</strong> {selected.date}
            </p>
            <pre className="body-text">{selected.body}</pre>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="inbox">
      {messages.length === 0 && <p>No messages found.</p>}
      {messages.map((msg) => (
        <div key={msg.id} className="message-row" onClick={() => openMessage(msg.id)}>
          <div className="message-from">{msg.from}</div>
          <div className="message-subject">{msg.subject || "(no subject)"}</div>
          <div className="message-snippet">{msg.snippet}</div>
        </div>
      ))}
    </div>
  );
}

export default Inbox;
