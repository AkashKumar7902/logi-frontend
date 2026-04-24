import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getApiErrorMessage } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../shared/Button";
import Input from "../shared/Input";
import { Card, CardBody } from "../shared/Card";

function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { email, password } = formData;

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!email) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
    return errs;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/admins/login", { email, password });
      login(res.data.token);
      navigate("/admin");
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Unable to log in"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-start justify-center px-4 py-12 bg-ink-50 dark:bg-ink-900">
      <Card className="w-full max-w-md">
        <CardBody className="p-7">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-ink-900 text-white mb-3 dark:bg-ink-700">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">Admin sign in</h2>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              Authorized personnel only
            </p>
          </div>

          {formError && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-danger-500/30 bg-danger-50 text-danger-700 text-sm px-3 py-2 dark:bg-danger-500/10 dark:text-danger-500"
            >
              {formError}
            </div>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={onChange}
              placeholder="admin@company.com"
              error={fieldErrors.email}
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={onChange}
              placeholder="Enter your password"
              error={fieldErrors.password}
              required
            />

            <Button type="submit" fullWidth loading={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export default AdminLogin;
