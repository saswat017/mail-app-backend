import { useState } from "react";

function Compose({ apiBase }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState(null); // null | "sending" | "sent" | "error"
  const [errorMsg, setErrorMsg] = useState("");

  const handleSend = async () => {
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch(`${apiBase}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ to, subject, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setStatus("sent");
      setTo("");
      setSubject("");
      setBody("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="compose">
      <input
        type="email"
        placeholder="To"
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />
      <input
        type="text"
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <textarea
        placeholder="Write your message..."
        rows={10}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button
        className="primary-btn"
        onClick={handleSend}
        disabled={status === "sending" || !to || !subject || !body}
      >
        {status === "sending" ? "Sending..." : "Send"}
      </button>

      {status === "sent" && <p className="success">Email sent!</p>}
      {status === "error" && <p className="error">Error: {errorMsg}</p>}
    </div>
  );
}

export default Compose;
