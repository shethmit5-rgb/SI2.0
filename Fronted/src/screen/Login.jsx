import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { validateEmail, validatePassword } from "../utils/validators";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationPhone, setVerificationPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const handleBlur = (field) => {
    let error = null;
    if (field === "email") {
      error = validateEmail(form.email);
    } else if (field === "password") {
      error = validatePassword(form.password);
    }
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const emailError = validateEmail(form.email);
    const passwordError = validatePassword(form.password);
    
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const res = await axios.post("http://localhost:5000/api/login", form);
      login(res.data.user, res.data.token);
      
      if (res.data.user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      if (err.response?.data?.requiresPhoneVerification) {
        setNeedsVerification(true);
        setVerificationPhone(err.response.data.phoneNumber);
        setErrors({ verify: err.response.data.message });
      } else {
        setErrors({ submit: err.response?.data?.message || "Login failed" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/resend-otp", {
        phoneNumber: verificationPhone
      });
      alert("New OTP sent to your mobile number!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      setErrors({ verify: "Please enter a valid 6-digit code" });
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      await axios.post("http://localhost:5000/api/verify-phone", {
        phoneNumber: verificationPhone,
        code: verificationCode
      });
      alert("✅ Mobile number verified successfully! You can now login.");
      setNeedsVerification(false);
      setVerificationCode("");
    } catch (err) {
      setErrors({ verify: err.response?.data?.message || "Verification failed" });
    } finally {
      setLoading(false);
    }
  };

  if (needsVerification) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h2>Mobile Not Verified</h2>
          <p>Please verify your mobile number before logging in.</p>
          <p className="verification-email">Code sent to: <strong>{verificationPhone}</strong></p>
          
          {errors.verify && <div className="error-message">{errors.verify}</div>}
          
          <form onSubmit={handleVerifyOTP}>
            <div className="input-group">
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength="6"
                required
              />
            </div>
            
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Verifying..." : "Verify Mobile Number"}
            </button>
          </form>

          <button onClick={handleResendVerification} className="resend-btn" disabled={loading} style={{ marginTop: '10px' }}>
            Resend OTP
          </button>
          <Link to="/register" className="back-link">← Back to Register</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p>Login to manage tournaments & events</p>

        {errors.submit && <div className="error-message">{errors.submit}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              onBlur={() => handleBlur("email")}
              className={errors.email ? "error" : ""}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="input-group password-group">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              onBlur={() => handleBlur("password")}
              className={errors.password ? "error" : ""}
            />
            <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "🙈" : "👁️"}
            </span>
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="login-links">
          <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
          <Link to="/register" className="register-link">Create Account</Link>
        </div>
      </div>
    </div>
  );
}