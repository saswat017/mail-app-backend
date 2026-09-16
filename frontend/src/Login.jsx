function Login({ apiBase }) {
  const handleLogin = () => {
    // Just send the browser to the backend's auth route —
    // it'll redirect to Google, then back, then reload this app once logged in.
    window.location.href = `${apiBase}/auth/google`;
  };

  return (
    <div className="centered">
      <h1>My Mail</h1>
      <p>Connect your Gmail account to get started.</p>
      <button className="primary-btn" onClick={handleLogin}>
        Sign in with Google
      </button>
    </div>
  );
}

export default Login;
