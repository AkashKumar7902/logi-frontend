import React, { useState } from "react";
import api, { getApiErrorMessage } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext";
import '../Common/Form.css';


function DriverLogin() {
  const navigate = useNavigate();

  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const { email, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/drivers/login", { email, password });
      login(res.data.token);
      navigate("/driver");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to log in"));
    }
  };

  return (
    <div className="form-container">
      <h2>Driver Login</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={onChange}
            placeholder="Enter your email"
            required
          />
          {/* <div className="error-message">Valid email is required</div> */}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={onChange}
            placeholder="Enter your password"
            required
          />
          {/* <div className="error-message">Password must be at least 6 characters</div> */}
        </div>

        <div className="button-group">
          <button type="submit">Login</button>
        </div>
      </form>
    </div>
  );
}

export default DriverLogin;
