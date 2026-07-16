import { useState } from "react";
import "./AuthPage.css";

function AuthPage({ mode, onSwitchMode, onSubmit, onClose }) {
  const isLogin = mode === "login";
  const [contactMethod, setContactMethod] = useState("email"); // "email" | "phone"
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const displayName = isLogin ? (contact.split("@")[0] || "User") : (name || "User");
    onSubmit({ name: displayName });
  };

  return (
    <div className="auth-page">
      <button className="auth-close" onClick={onClose}>×</button>

      <div className="auth-card">
        <h1 className="auth-title">{isLogin ? "Welcome back" : "Create your account"}</h1>
        <p className="auth-subtitle">
          {isLogin ? "Log in to continue to Stratum" : "Sign up to start summarizing"}
        </p>

        <div className="auth-social-buttons">
          <button type="button" className="auth-social-button">
            <span className="auth-social-icon">G</span>
            {isLogin ? "Log in with Google" : "Sign up with Google"}
          </button>
          <button type="button" className="auth-social-button">
            <span className="auth-social-icon"></span>
            {isLogin ? "Log in with Apple" : "Sign up with Apple"}
          </button>
        </div>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-contact-toggle">
          <button
            type="button"
            className={`auth-contact-tab ${contactMethod === "email" ? "active" : ""}`}
            onClick={() => setContactMethod("email")}
          >
            Email
          </button>
          <button
            type="button"
            className={`auth-contact-tab ${contactMethod === "phone" ? "active" : ""}`}
            onClick={() => setContactMethod("phone")}
          >
            Phone
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              className="auth-input"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <input
            type={contactMethod === "email" ? "email" : "tel"}
            className="auth-input"
            placeholder={contactMethod === "email" ? "Email address" : "Phone number"}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
          />

          <input
            type="password"
            className="auth-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {isLogin && (
            <button type="button" className="auth-forgot">
              Forgot password?
            </button>
          )}

          <button type="submit" className="auth-submit">
            {isLogin ? "Log in" : "Sign up"}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="auth-switch-link"
            onClick={() => onSwitchMode(isLogin ? "signup" : "login")}
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default AuthPage;