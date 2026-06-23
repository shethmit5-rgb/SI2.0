import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./CreateTournament.css";

export default function CreateTournament() {
  const navigate = useNavigate();

  const [sports, setSports] = useState([]);
  const [venues, setVenues] = useState([]);
  const [logoFile, setLogoFile] = useState(null);

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
    organizerId: "",
    teamRegistrationFee: "",
  });
  const [organizers, setOrganizers] = useState([]);

  /* LOAD SPORTS, VENUES & ORGANIZERS */
  useEffect(() => {
    axios.get("http://localhost:5000/api/sports").then(res => setSports(res.data));
    axios.get("http://localhost:5000/api/venues").then(res => setVenues(res.data));
    axios.get("http://localhost:5000/api/users/public").then(res => {
      const orgs = res.data.filter(u => u.role === "organizer");
      setOrganizers(orgs);
    });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /* SUBMIT */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.maxParticipants) {
      const num = Number(formData.maxParticipants);
      if (isNaN(num) || num < 2 || (num & (num - 1)) !== 0) {
        alert("Max participants must be a power of 2 (2, 4, 8, 16, 32, etc.)");
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");
      const data = new FormData();

      Object.entries(formData).forEach(([k, v]) => {
        if (v !== undefined && v !== "") data.append(k, v);
      });
      if (logoFile) data.append("logo", logoFile);

      await axios.post(
        "http://localhost:5000/api/tournaments",
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("🏆 Tournament created successfully");
      navigate("/admin/tournaments");

    } catch (err) {
      alert(err.response?.data?.message || "Creation failed");
    }
  };

  return (
    <div className="ct-page">
      <div className="ct-card">
        <h2 className="ct-title">
          Create Tournament
          <span>Organize professional sports events</span>
        </h2>

        <form className="ct-form" onSubmit={handleSubmit}>

          <div className="ct-group">
            <label>Tournament Name</label>
            <input
              name="eventName"
              placeholder="Eg. Summer Cup 2026"
              value={formData.eventName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="ct-row">
            <div className="ct-group">
              <label>Sport</label>
              <select
                name="sportId"
                value={formData.sportId}
                onChange={handleChange}
                required
              >
                <option value="">Select Sport</option>
                {sports.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="ct-group">
              <label>Venue</label>
              <select
                name="venueId"
                value={formData.venueId}
                onChange={handleChange}
                required
              >
                <option value="">Select Venue</option>
                {venues.map(v => (
                  <option key={v._id} value={v._id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="ct-group">
            <label>Location</label>
            <input
              name="location"
              placeholder="City / Area"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          <div className="ct-group">
            <label>Assign Organizer</label>
            <select
              name="organizerId"
              value={formData.organizerId}
              onChange={handleChange}
            >
              <option value="">Select Organizer (Default to current user)</option>
              {organizers.map(org => (
                <option key={org._id} value={org._id}>
                  {org.name} ({org.email})
                </option>
              ))}
            </select>
          </div>

          <div className="ct-row">
            <div className="ct-group">
              <label>Start Date</label>
              <input type="date" name="startDate" onChange={handleChange} />
            </div>

            <div className="ct-group">
              <label>End Date</label>
              <input type="date" name="endDate" onChange={handleChange} />
            </div>
          </div>

          <div className="ct-group">
            <label>Max Participants</label>
            <input
              type="number"
              name="maxParticipants"
              placeholder="Eg. 16"
              value={formData.maxParticipants}
              onChange={handleChange}
            />
          </div>

          <div className="ct-group">
            <label>Team Registration Fee (₹)</label>
            <input
              type="number"
              name="teamRegistrationFee"
              placeholder="e.g., 1000 (0 for free)"
              value={formData.teamRegistrationFee}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div className="ct-group">
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Tournament details..."
              rows="3"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="ct-group">
            <label>Rules</label>
            <textarea
              name="rules"
              placeholder="Rules & regulations..."
              rows="3"
              value={formData.rules}
              onChange={handleChange}
            />
          </div>

          <div className="ct-group">
            <label>Tournament Logo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files[0])}
            />
          </div>

          <button type="submit" className="ct-btn">
            🚀 Create Tournament
          </button>

        </form>
      </div>
    </div>
  );
}
