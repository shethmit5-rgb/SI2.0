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
  const [step, setStep] = useState(1);
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
  const [message, setMessage] = useState("");
  const [registeredPhone, setRegisteredPhone] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState(""); // Keeping it just in case
  const [touched, setTouched] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "", color: "" });
  const [isEmailChecking, setIsEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(true);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [step, timeLeft]);

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
    
    // Clear email availability when email changes
    if (name === "email") {
      setEmailAvailable(true);
      if (errors.email && errors.email !== "Email already registered") {
        setErrors(prev => ({ ...prev, email: null }));
      }
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate on blur
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

  // ✅ EMAIL AVAILABILITY CHECK FUNCTION
  const checkEmailAvailability = async (email) => {
    if (!email || !validateEmail(email)) return;
    
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
      // Don't block registration if email check fails
      setEmailAvailable(true);
    } finally {
      setIsEmailChecking(false);
    }
  };

  const checkPasswordStrength = (password) => {
    const strength = getPasswordStrength(password);
    setPasswordStrength(strength);
  };

  const validateStep1 = () => {
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
    
    // Check if email is available
    if (!emailAvailable && !emailError) {
      newErrors.email = "Email already registered. Please use a different email.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      const res = await axios.post("http://localhost:5000/api/register", formData);
      setMessage(res.data.message);
      setRegisteredEmail(formData.email);
      setRegisteredPhone(formData.phoneNumber);
      setStep(2);
      setTimeLeft(300); // 5 minutes
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

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      setErrors({ verify: "Please enter a valid 6-digit code" });
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      await axios.post("http://localhost:5000/api/verify-phone", {
        phoneNumber: registeredPhone,
        code: verificationCode
      });
      alert("✅ Phone number verified successfully! Please login.");
      navigate("/login");
    } catch (err) {
      setErrors({ verify: err.response?.data?.message || "Verification failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (timeLeft > 0) return; // Prevent resend if timer is running
    
    setLoading(true);
    setErrors({});
    
    try {
      await axios.post("http://localhost:5000/api/resend-otp", {
        phoneNumber: registeredPhone
      });
      setMessage("New OTP sent successfully!");
      setTimeLeft(300); // Reset timer
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setErrors({ verify: err.response?.data?.message || "Failed to resend code" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        {step === 1 ? (
          <>
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
                />
                {isEmailChecking && <span className="info-text">Checking availability...</span>}
                {errors.email && (touched.email || !emailAvailable) && (
                  <span className="error-text">{errors.email}</span>
                )}
                {!errors.email && emailAvailable && formData.email && touched.email && (
                  <span className="success-text">✓ Email available</span>
                )}
              </div>

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
                disabled={loading || isEmailChecking || !emailAvailable}
              >
                {loading ? "Registering..." : "Register"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2>Verify Your Mobile Number</h2>
            <p>Enter the 6-digit code sent to <strong>{registeredPhone}</strong></p>
            
            {message && <div className="success-message">{message}</div>}
            {errors.verify && <div className="error-message">{errors.verify}</div>}
            
            <div className="countdown-timer">
              {timeLeft > 0 ? (
                <p>Code expires in: <strong>{formatTime(timeLeft)}</strong></p>
              ) : (
                <p className="expired-text">OTP has expired. Please request a new one.</p>
              )}
            </div>

            <form onSubmit={handleVerify}>
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
              
              <button type="submit" className="register-btn" disabled={loading || timeLeft === 0}>
                {loading ? "Verifying..." : "Verify Mobile Number"}
              </button>
            </form>
            
            <button 
              onClick={handleResendCode} 
              className="resend-btn" 
              disabled={loading || timeLeft > 0}
              style={{ opacity: timeLeft > 0 ? 0.5 : 1, cursor: timeLeft > 0 ? 'not-allowed' : 'pointer' }}
            >
              {timeLeft > 0 ? `Resend Code in ${formatTime(timeLeft)}` : "Resend OTP"}
            </button>
          </>
        )}
        
        <p className="login-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}