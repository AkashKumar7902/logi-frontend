import React, { useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import "../Common/Form.css";

function UserRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const { name, email, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ensure that you're sending the correct endpoint and payload
      await api.post(
        "/users/register",
        { name, email, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      navigate("/login/user");
    } catch (err) {
      console.error(err || "Registration failed");
    }
  };

  return (
    <div className="form-container">
      <h2>User Registration</h2>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={onChange}
            placeholder="Enter your name"
            required
          />
          {/* Optionally, display error message */}
          {/* <div className="error-message">Name is required</div> */}
        </div>

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

export default UserRegister;
