import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { validateTournamentName, validateDates, validateNumber, validateDescription, validateRules } from "../utils/validators";
import "../static/EditTournament.css";

export default function EditTournamentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sports, setSports] = useState([]);
  const [venues, setVenues] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [formData, setFormData] = useState({
    eventName: "",
    sportId: "",
    venueId: "",
    location: "",
    startDate: "",
    endDate: "",
    maxParticipants: "",
    description: "",
    rules: "",
    status: "upcoming",
    organizerId: ""
  });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [id, user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch tournament details
      const tournamentRes = await api.get(`/tournaments/${id}`);
      const tournament = tournamentRes.data;

      // Fetch sports, venues and if admin, organizers
      const promises = [
        api.get("/sports"),
        api.get("/venues")
      ];
      if (user && user.role === "admin") {
        promises.push(api.get("/users/public"));
      }

      const [sportsRes, venuesRes, usersRes] = await Promise.all(promises);

      setSports(sportsRes.data);
      setVenues(venuesRes.data);
      if (usersRes) {
        setOrganizers(usersRes.data.filter(u => u.role === "organizer"));
      }

      // Format dates for input
      const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toISOString().split("T")[0];
      };

      setFormData({
        eventName: tournament.eventName || "",
        sportId: tournament.sportId?._id || tournament.sportId || "",
        venueId: tournament.venueId?._id || tournament.venueId || "",
        location: tournament.location || "",
        startDate: formatDate(tournament.startDate),
        endDate: formatDate(tournament.endDate),
        maxParticipants: tournament.maxParticipants || "",
        description: tournament.description || "",
        rules: tournament.rules || "",
        status: tournament.status || "upcoming",
        organizerId: tournament.organizerId?._id || tournament.organizerId || ""
      });

      setLogoPreview(tournament.logo || "");

    } catch (err) {
      console.error("Failed to fetch tournament:", err);
      setErrorMessage("Failed to load tournament data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const nameError = validateTournamentName(formData.eventName);
    if (nameError) newErrors.eventName = nameError;

    if (!formData.sportId) newErrors.sportId = "Please select a sport";
    if (!formData.venueId) newErrors.venueId = "Please select a venue";

    const dateError = validateDates(formData.startDate, formData.endDate);
    if (dateError) newErrors.dates = dateError;

    const maxParticipantsError = validateNumber(formData.maxParticipants, "Max participants", 2, 100);
    if (maxParticipantsError) {
      newErrors.maxParticipants = maxParticipantsError;
    } else if (formData.maxParticipants) {
      const num = Number(formData.maxParticipants);
      if ((num & (num - 1)) !== 0) {
        newErrors.maxParticipants = "Max participants must be a power of 2 (2, 4, 8, 16, 32, etc.)";
      }
    }

    const descriptionError = validateDescription(formData.description);
    if (descriptionError) newErrors.description = descriptionError;

    const rulesError = validateRules(formData.rules);
    if (rulesError) newErrors.rules = rulesError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const data = new FormData();
      data.append("eventName", formData.eventName);
      data.append("sportId", formData.sportId);
      data.append("venueId", formData.venueId);
      data.append("location", formData.location);
      data.append("startDate", formData.startDate);
      data.append("endDate", formData.endDate);
      data.append("maxParticipants", formData.maxParticipants);
      data.append("description", formData.description);
      data.append("rules", formData.rules);
      data.append("status", formData.status);
      if (user && user.role === "admin" && formData.organizerId) {
        data.append("organizerId", formData.organizerId);
      }

      if (logo) {
        data.append("logo", logo);
      }

      await api.put(`/tournaments/${id}`, data);
      setSuccessMessage("✅ Tournament updated successfully!");

      setTimeout(() => {
        navigate(`/tournament/${id}`);
      }, 1500);

    } catch (err) {
      console.error("Update failed:", err);
      setErrorMessage(err.response?.data?.message || "Failed to update tournament");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "upcoming": return "#f59e0b";
      case "ongoing": return "#10b981";
      case "completed": return "#6b7280";
      default: return "#6b7280";
    }
  };

  if (loading) {
    return (
      <div className="edit-tournament-loading">
        <div className="spinner"></div>
        <p>Loading tournament data...</p>
      </div>
    );
  }

  return (
    <div className="edit-tournament-page">
      <div className="edit-tournament-container">
        <div className="page-header">
          <h1>✏️ Edit Tournament</h1>
          <p>Update your tournament details</p>
        </div>

        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        {errorMessage && (
          <div className="error-message">{errorMessage}</div>
        )}

        <form onSubmit={handleSubmit} className="edit-tournament-form">
          {/* Tournament Name */}
          <div className="form-group">
            <label>Tournament Name *</label>
            <input
              type="text"
              name="eventName"
              value={formData.eventName}
              onChange={handleChange}
              placeholder="Enter tournament name"
              className={errors.eventName ? "error" : ""}
            />
            {errors.eventName && <span className="error-text">{errors.eventName}</span>}
          </div>

          {/* Sport and Venue Row */}
          <div className="form-row">
            <div className="form-group">
              <label>Sport *</label>
              <select
                name="sportId"
                value={formData.sportId}
                onChange={handleChange}
                className={errors.sportId ? "error" : ""}
              >
                <option value="">Select Sport</option>
                {sports.map(sport => (
                  <option key={sport._id} value={sport._id}>
                    {sport.name} ({sport.type})
                  </option>
                ))}
              </select>
              {errors.sportId && <span className="error-text">{errors.sportId}</span>}
            </div>

            <div className="form-group">
              <label>Venue *</label>
              <select
                name="venueId"
                value={formData.venueId}
                onChange={handleChange}
                className={errors.venueId ? "error" : ""}
              >
                <option value="">Select Venue</option>
                {venues.map(venue => (
                  <option key={venue._id} value={venue._id}>
                    {venue.name} ({venue.type})
                  </option>
                ))}
              </select>
              {errors.venueId && <span className="error-text">{errors.venueId}</span>}
            </div>
          </div>

          {/* Location */}
          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="City, State, Country"
            />
          </div>

          {user && user.role === "admin" && (
            <div className="form-group">
              <label>Assign Organizer</label>
              <select
                name="organizerId"
                value={formData.organizerId || ""}
                onChange={handleChange}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              >
                <option value="">Select Organizer (Default to current user)</option>
                {organizers.map(org => (
                  <option key={org._id} value={org._id}>
                    {org.name} ({org.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dates Row */}
          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>End Date *</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>
          </div>
          {errors.dates && <span className="error-text">{errors.dates}</span>}

          {/* Max Participants and Status Row */}
          <div className="form-row">
            <div className="form-group">
              <label>Max Participants (Teams)</label>
              <input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleChange}
                placeholder="e.g., 16"
                min="2"
                max="100"
              />
              {errors.maxParticipants && <span className="error-text">{errors.maxParticipants}</span>}
            </div>

            <div className="form-group">
              <label>Tournament Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={{ borderColor: getStatusColor(formData.status) }}
              >
                <option value="upcoming">📅 Upcoming</option>
                <option value="ongoing">🔥 Ongoing</option>
                <option value="completed">✅ Completed</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your tournament..."
              rows="4"
              className={errors.description ? "error" : ""}
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
            <small>{formData.description?.length || 0}/2000 characters</small>
          </div>

          {/* Rules */}
          <div className="form-group">
            <label>Rules & Guidelines</label>
            <textarea
              name="rules"
              value={formData.rules}
              onChange={handleChange}
              placeholder="Enter tournament rules..."
              rows="4"
              className={errors.rules ? "error" : ""}
            />
            {errors.rules && <span className="error-text">{errors.rules}</span>}
            <small>{formData.rules?.length || 0}/5000 characters</small>
          </div>

          {/* Logo Upload */}
          <div className="form-group">
            <label>Tournament Logo</label>
            <div className="logo-upload">
              {logoPreview && (
                <div className="logo-preview">
                  <img src={logoPreview} alt="Tournament Logo" />
                  <button
                    type="button"
                    className="remove-logo"
                    onClick={() => {
                      setLogo(null);
                      setLogoPreview("");
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="logo-input"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="save-btn"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}