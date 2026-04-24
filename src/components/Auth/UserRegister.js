import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { getApiErrorMessage } from "../../services/api";
import Button from "../shared/Button";
import Input from "../shared/Input";
import { Card, CardBody } from "../shared/Card";

function UserRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { name, email, password } = formData;

  const onChange = (e) => {
    const { name: k, value } = e.target;
    setFormData((prev) => ({ ...prev, [k]: value }));
    if (fieldErrors[k]) {
      setFieldErrors((prev) => ({ ...prev, [k]: undefined }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6)
      errs.password = "Password must be at least 6 characters";
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
      await api.post("/users/register", { name, email, password });
      navigate("/login/user");
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Registration failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-start justify-center px-4 py-12 bg-ink-50 dark:bg-ink-900">
      <Card className="w-full max-w-md">
        <CardBody className="p-7">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">Create your account</h2>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              Start shipping with Logi in minutes
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
              label="Name"
              name="name"
              autoComplete="name"
              value={name}
              onChange={onChange}
              placeholder="Jane Doe"
              error={fieldErrors.name}
              required
            />
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={onChange}
              placeholder="you@example.com"
              error={fieldErrors.email}
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={onChange}
              placeholder="At least 6 characters"
              error={fieldErrors.password}
              required
            />

            <Button type="submit" fullWidth loading={submitting}>
              {submitting ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-600 dark:text-ink-300">
            Already have an account?{" "}
            <Link
              to="/login/user"
              className="text-brand-600 font-medium hover:text-brand-700 hover:underline dark:text-brand-400 dark:hover:text-brand-300"
            >
              Sign in
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

export default UserRegister;
