import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { loadRazorpayScript, verifyTournamentPayment, getRazorpayKey } from "../services/paymentService";
import "../static/CreateTournament.css";

export default function CreateTournamentUser() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
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
    organizerId: "",
    teamRegistrationFee: "",
  });
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    fetchSportsAndVenues();
  }, [user]);

  const fetchSportsAndVenues = async () => {
    try {
      const promises = [
        api.get("/sports"),
        api.get("/venues"),
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
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.maxParticipants) {
      const num = Number(formData.maxParticipants);
      if (isNaN(num) || num < 2 || (num & (num - 1)) !== 0) {
        alert("Max participants must be a power of 2 (2, 4, 8, 16, 32, etc.)");
        return;
      }
    }

    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== "") {
          data.append(key, formData[key]);
        }
      });
      if (logo) data.append("logo", logo);

      const response = await api.post("/tournaments", data);
      
      if (response.data && response.data.requiresPayment) {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          alert("Razorpay SDK failed to load. Are you online?");
          setLoading(false);
          return;
        }

        const keyRes = await getRazorpayKey();
        const options = {
          key: keyRes.key,
          amount: response.data.order.amount,
          currency: response.data.order.currency || "INR",
          name: "Tournament Creation Fee",
          description: "Pay fee to create tournament",
          order_id: response.data.order.id,
          handler: async (paymentRes) => {
            setLoading(true);
            try {
              const verifyRes = await verifyTournamentPayment({
                razorpay_order_id: paymentRes.razorpay_order_id,
                razorpay_payment_id: paymentRes.razorpay_payment_id,
                razorpay_signature: paymentRes.razorpay_signature,
                transactionId: response.data.transactionId,
              });
              if (verifyRes.success) {
                alert("✅ Tournament created successfully!");
                navigate("/my-tournaments");
              } else {
                alert("❌ Payment verification failed.");
              }
            } catch (err) {
              console.error(err);
              alert(err.response?.data?.message || "Payment verification failed");
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
          },
          theme: {
            color: "#6366f1",
          },
          modal: {
            ondismiss: () => {
              alert("Payment cancelled. You can complete the payment later from your dashboard.");
              navigate("/my-tournaments");
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        alert("✅ Tournament created successfully!");
        navigate("/my-tournaments");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create tournament");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ct-page">
      <div className="ct-card">
        <h2>Create Tournament</h2>
        <p>Organize your own sports event</p>

        <form onSubmit={handleSubmit} className="ct-form">
          <div className="ct-group">
            <label>Tournament Name *</label>
            <input
              name="eventName"
              placeholder="e.g., Summer Championship 2024"
              value={formData.eventName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="ct-row">
            <div className="ct-group">
              <label>Sport *</label>
              <select name="sportId" value={formData.sportId} onChange={handleChange} required>
                <option value="">Select Sport</option>
                {sports.map(sport => (
                  <option key={sport._id} value={sport._id}>{sport.name}</option>
                ))}
              </select>
            </div>

            <div className="ct-group">
              <label>Venue *</label>
              <select name="venueId" value={formData.venueId} onChange={handleChange} required>
                <option value="">Select Venue</option>
                {venues.map(venue => (
                  <option key={venue._id} value={venue._id}>{venue.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="ct-group">
            <label>Location</label>
            <input
              name="location"
              placeholder="City, State"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          {user && user.role === "admin" && (
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
          )}

          <div className="ct-row">
            <div className="ct-group">
              <label>Start Date *</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
            </div>
            <div className="ct-group">
              <label>End Date *</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />
            </div>
          </div>

          <div className="ct-group">
            <label>Max Participants (Teams)</label>
            <input
              type="number"
              name="maxParticipants"
              placeholder="e.g., 16"
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
              rows="3"
              placeholder="Describe your tournament..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="ct-group">
            <label>Rules</label>
            <textarea
              name="rules"
              rows="3"
              placeholder="Tournament rules..."
              value={formData.rules}
              onChange={handleChange}
            />
          </div>

          <div className="ct-group">
            <label>Tournament Logo</label>
            <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files[0])} />
          </div>

          <button type="submit" disabled={loading} className="ct-btn">
            {loading ? "Creating..." : "Create Tournament"}
          </button>
        </form>
      </div>
    </div>
  );
}