import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

export default function EditTournament() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [organizers, setOrganizers] = useState([]);

  const token = localStorage.getItem("token");
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchTournament();
    axios.get("http://localhost:5000/api/users/public").then(res => {
      const orgs = res.data.filter(u => u.role === "organizer");
      setOrganizers(orgs);
    });
  }, [id]);

  // ✅ FIXED: Use public endpoint to GET tournament data
  const fetchTournament = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/tournaments/public/${id}`);
      setForm(res.data);
    } catch (err) {
      console.error("Failed to fetch tournament:", err);
      alert("Failed to load tournament data");
    } finally {
      setLoading(false);
    }
  };

  const update = async () => {
    if (form.maxParticipants) {
      const num = Number(form.maxParticipants);
      if (isNaN(num) || num < 2 || (num & (num - 1)) !== 0) {
        alert("Max participants must be a power of 2 (2, 4, 8, 16, 32, etc.)");
        return;
      }
    }

    try {
      await axios.put(
        `http://localhost:5000/api/tournaments/${id}`,
        {
          eventName: form.eventName,
          location: form.location,
          startDate: form.startDate,
          endDate: form.endDate,
          maxParticipants: form.maxParticipants,
          description: form.description,
          rules: form.rules,
          status: form.status,
          organizerId: form.organizerId || null,
        },
        auth
      );
      alert("✅ Tournament Updated Successfully");
      navigate("/admin/tournaments");
    } catch (err) {
      console.error("Update failed:", err);
      alert(err.response?.data?.message || "Update failed");
    }
  };

  // Custom button styles
  const buttonStyles = {
    update: {
      backgroundColor: "#10b981",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      marginRight: "10px",
    },
    cancel: {
      backgroundColor: "#6b7280",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
    },
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "50px" }}>Loading tournament data...</div>;
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px" }}>
      <h2 style={{ marginBottom: "20px" }}>Edit Tournament</h2>

      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Event Name</label>
        <input
          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          value={form.eventName || ""}
          onChange={e => setForm({ ...form, eventName: e.target.value })}
        />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Location</label>
        <input
          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          value={form.location || ""}
          onChange={e => setForm({ ...form, location: e.target.value })}
        />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Assign Organizer</label>
        <select
          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          value={form.organizerId || ""}
          onChange={e => setForm({ ...form, organizerId: e.target.value })}
        >
          <option value="">Select Organizer (Default to current user)</option>
          {organizers.map(org => (
            <option key={org._id} value={org._id}>
              {org.name} ({org.email})
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Start Date</label>
        <input
          type="date"
          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          value={form.startDate ? form.startDate.slice(0, 10) : ""}
          onChange={e => setForm({ ...form, startDate: e.target.value })}
        />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>End Date</label>
        <input
          type="date"
          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          value={form.endDate ? form.endDate.slice(0, 10) : ""}
          onChange={e => setForm({ ...form, endDate: e.target.value })}
        />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Max Participants</label>
        <input
          type="number"
          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          value={form.maxParticipants || ""}
          onChange={e => setForm({ ...form, maxParticipants: e.target.value })}
        />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Status</label>
        <select
          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          value={form.status || "upcoming"}
          onChange={e => setForm({ ...form, status: e.target.value })}
        >
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Description</label>
        <textarea
          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", minHeight: "80px" }}
          value={form.description || ""}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Rules</label>
        <textarea
          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", minHeight: "80px" }}
          value={form.rules || ""}
          onChange={e => setForm({ ...form, rules: e.target.value })}
        />
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button
          style={buttonStyles.update}
          onClick={update}
          onMouseEnter={(e) => e.target.style.backgroundColor = "#059669"}
          onMouseLeave={(e) => e.target.style.backgroundColor = "#10b981"}
        >
          Update Tournament
        </button>
        <button
          style={buttonStyles.cancel}
          onClick={() => navigate("/admin/tournaments")}
          onMouseEnter={(e) => e.target.style.backgroundColor = "#4b5563"}
          onMouseLeave={(e) => e.target.style.backgroundColor = "#6b7280"}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}