import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  validateEmail, 
  validatePassword, 
  validateName,
  getPasswordStrength 
} from "../utils/validators";
import "./Register.css";

export default function RegisterWithVerification() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    role: "player"
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "", color: "" });
  const [isEmailChecking, setIsEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(true);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [otpError, setOtpError] = useState("");

  useEffect(() => {
    if (otpSent && !isEmailVerified && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [otpSent, isEmailVerified, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    
    // Reset OTP verification states when email changes
    if (name === "email") {
      setEmailAvailable(true);
      setIsEmailVerified(false);
      setOtpSent(false);
      setVerificationCode("");
      setOtpError("");
      setOtpMessage("");
      if (errors.email && errors.email !== "Email already registered") {
        setErrors(prev => ({ ...prev, email: null }));
      }
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    let error = null;
    switch(field) {
      case "name":
        error = validateName(formData.name);
        break;
      case "email":
        error = validateEmail(formData.email);
        if (!error && formData.email) {
          checkEmailAvailability(formData.email);
        }
        break;
      case "phoneNumber":
        if (!/^\+[1-9]\d{1,14}$/.test(formData.phoneNumber)) {
          error = "Enter a valid phone number with country code (e.g. +919876543210)";
        }
        break;
      case "password":
        error = validatePassword(formData.password);
        break;
      case "confirmPassword":
        if (formData.password !== formData.confirmPassword) {
          error = "Passwords do not match";
        }
        break;
    }
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const checkEmailAvailability = async (email) => {
    if (!email || validateEmail(email)) return;
    
    setIsEmailChecking(true);
    try {
      const res = await axios.post("http://localhost:5000/api/check-email", { email });
      if (!res.data.available) {
        setErrors(prev => ({ ...prev, email: "Email already registered. Please use a different email." }));
        setEmailAvailable(false);
      } else {
        setEmailAvailable(true);
        setErrors(prev => ({ ...prev, email: null }));
      }
    } catch (err) {
      console.error("Email check failed:", err);
      setEmailAvailable(true);
    } finally {
      setIsEmailChecking(false);
    }
  };

  const checkPasswordStrength = (password) => {
    const strength = getPasswordStrength(password);
    setPasswordStrength(strength);
  };

  const handleSendOtp = async () => {
    if (!formData.email || validateEmail(formData.email) || !emailAvailable) {
      setOtpError("Please enter a valid, unregistered email address.");
      return;
    }
    
    setLoadingOtp(true);
    setOtpError("");
    setOtpMessage("");
    try {
      const res = await axios.post("http://localhost:5000/api/send-email-otp", {
        email: formData.email
      });
      setOtpSent(true);
      setTimeLeft(300); // 5 minutes
      setOtpMessage(res.data.message || "OTP sent successfully!");
    } catch (err) {
      setOtpError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setOtpError("Please enter a valid 6-digit code");
      return;
    }
    
    setVerifyingOtp(true);
    setOtpError("");
    setOtpMessage("");
    try {
      await axios.post("http://localhost:5000/api/verify-email-otp", {
        email: formData.email,
        otp: verificationCode
      });
      setIsEmailVerified(true);
      setOtpMessage("Email verified successfully!");
    } catch (err) {
      setOtpError(err.response?.data?.message || "Verification failed");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    
    if (nameError) newErrors.name = nameError;
    if (emailError) newErrors.email = emailError;
    if (!/^\+[1-9]\d{1,14}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Enter a valid phone number with country code (e.g. +919876543210)";
    }
    if (passwordError) newErrors.password = passwordError;
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    if (!emailAvailable && !emailError) {
      newErrors.email = "Email already registered. Please use a different email.";
    }

    if (!isEmailVerified) {
      newErrors.submit = "Please verify your email address before registering.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      const res = await axios.post("http://localhost:5000/api/register", formData);
      alert("🎉 " + (res.data.message || "Registration successful! You can now login."));
      navigate("/login");
    } catch (err) {
      if (err.response?.data?.message.includes("Email already registered")) {
        setErrors({ email: err.response.data.message });
      } else if (err.response?.data?.message.includes("Phone number already registered")) {
        setErrors({ phoneNumber: err.response.data.message });
      } else {
        setErrors({ submit: err.response?.data?.message || "Registration failed" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h2>Create Account</h2>
        <p>Join tournaments & manage events easily</p>
        
        {errors.submit && <div className="error-message">{errors.submit}</div>}
        
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              onBlur={() => handleBlur("name")}
              className={errors.name && touched.name ? "error" : ""}
            />
            {errors.name && touched.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => handleBlur("email")}
              className={errors.email && (touched.email || !emailAvailable) ? "error" : ""}
              disabled={isEmailVerified}
            />
            {isEmailChecking && <span className="info-text">Checking availability...</span>}
            {errors.email && (touched.email || !emailAvailable) && (
              <span className="error-text">{errors.email}</span>
            )}
            {!errors.email && emailAvailable && formData.email && touched.email && !isEmailVerified && !otpSent && (
              <span className="success-text">✓ Email available</span>
            )}
            {isEmailVerified && (
              <span className="success-text" style={{ fontWeight: 'bold' }}>✓ Email Verified Successfully</span>
            )}
          </div>

          {/* Email OTP Verification Section */}
          {formData.email && !validateEmail(formData.email) && emailAvailable && (
            <div className="email-otp-section" style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              {!isEmailVerified ? (
                <>
                  {!otpSent ? (
                    <button
                      type="button"
                      className="resend-btn"
                      style={{ margin: 0, width: '100%', height: '40px' }}
                      onClick={handleSendOtp}
                      disabled={loadingOtp || isEmailChecking}
                    >
                      {loadingOtp ? "Sending OTP..." : "Send Verification OTP"}
                    </button>
                  ) : (
                    <div>
                      <div className="input-group" style={{ marginBottom: '10px' }}>
                        <input
                          type="text"
                          placeholder="Enter 6-digit Email OTP"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          maxLength="6"
                          style={{ marginBottom: '5px' }}
                        />
                        {otpError && <div className="error-text" style={{ color: '#ef4444', fontSize: '12px' }}>{otpError}</div>}
                        {otpMessage && <div className="success-text" style={{ color: '#10b981', fontSize: '12px' }}>{otpMessage}</div>}
                      </div>

                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="register-btn"
                          style={{ margin: 0, padding: '8px 16px', flex: 1, height: '40px' }}
                          onClick={handleVerifyOtp}
                          disabled={verifyingOtp || verificationCode.length !== 6 || timeLeft === 0}
                        >
                          {verifyingOtp ? "Verifying..." : "Verify OTP"}
                        </button>

                        <button
                          type="button"
                          className="resend-btn"
                          style={{ margin: 0, padding: '8px 16px', flex: 1, height: '40px', opacity: timeLeft > 0 ? 0.5 : 1, cursor: timeLeft > 0 ? 'not-allowed' : 'pointer' }}
                          onClick={handleSendOtp}
                          disabled={loadingOtp || timeLeft > 0}
                        >
                          {timeLeft > 0 ? `Resend (${formatTime(timeLeft)})` : "Resend OTP"}
                        </button>
                      </div>
                      
                      {timeLeft > 0 ? (
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', textAlign: 'center' }}>
                          OTP expires in: <strong>{formatTime(timeLeft)}</strong>
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px', textAlign: 'center' }}>
                          OTP has expired. Please click Resend OTP.
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}

          <div className="input-group">
            <input
              type="tel"
              name="phoneNumber"
              placeholder="Mobile Number (e.g. +919876543210)"
              value={formData.phoneNumber}
              onChange={handleChange}
              onBlur={() => handleBlur("phoneNumber")}
              className={errors.phoneNumber && touched.phoneNumber ? "error" : ""}
            />
            {errors.phoneNumber && touched.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
          </div>

          <div className="input-group">
            <input
              type="password"
              name="password"
              placeholder="Password (min 6 chars, 1 uppercase, 1 number, 1 special)"
              value={formData.password}
              onChange={(e) => {
                handleChange(e);
                checkPasswordStrength(e.target.value);
              }}
              onBlur={() => handleBlur("password")}
              className={errors.password && touched.password ? "error" : ""}
            />
            {errors.password && touched.password && <span className="error-text">{errors.password}</span>}
            
            {/* Password Strength Meter */}
            {formData.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className="strength-fill" 
                    style={{ 
                      width: `${(passwordStrength.score / 5) * 100}%`, 
                      backgroundColor: passwordStrength.color 
                    }}
                  />
                </div>
                <span className="strength-label" style={{ color: passwordStrength.color }}>
                  {passwordStrength.label} Password
                </span>
              </div>
            )}
          </div>

          <div className="input-group">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={() => handleBlur("confirmPassword")}
              className={errors.confirmPassword && touched.confirmPassword ? "error" : ""}
            />
            {errors.confirmPassword && touched.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          <div className="input-group">
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="player">Player</option>
              <option value="coach">Coach</option>
              <option value="organizer">Organizer</option>
              <option value="sponsor">Sponsor</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="register-btn" 
            disabled={loading || isEmailChecking || !emailAvailable || !isEmailVerified}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        
        <p className="login-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}