import React, { useState } from "react";
import api, { getApiErrorMessage } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import '../Common/Form.css';

function DriverRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    vehicle_type: "car",
  });
  const [error, setError] = useState("");

  const { name, email, password, vehicle_type } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/drivers/register", { name, email, password, vehicle_type });
      navigate("/login/driver");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to register"));
    }
  };

  return (
    <div className="form-container">
      <h2>Driver Registration</h2>
      {error && <p className="error-message">{error}</p>}
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

        <div className="form-group">
          <label htmlFor="vehicle_type">Vehicle Type</label>
          <select
            id="vehicle_type"
            name="vehicle_type"
            value={vehicle_type}
            onChange={onChange}
            required
          >
            <option value="bike">Bike</option>
            <option value="car">Car</option>
            <option value="van">Van</option>
          </select>
        </div>

        <div className="button-group">
          <button type="submit">Register</button>
        </div>
      </form>
    </div>
    );
}

export default DriverRegister;
