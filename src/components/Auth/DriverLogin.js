import React, { useState } from "react";
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext";
import '../Common/Form.css';


function DriverLogin() {
  const navigate = useNavigate();

  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const { email, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/drivers/login", { email, password });
      login(res.data.token);
      navigate("/driver");
    } catch (err) {
      console.error(err.response.data.error);
    }
  };

  return (
    <div className="form-container">
      <h2>Driver Login</h2>
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
