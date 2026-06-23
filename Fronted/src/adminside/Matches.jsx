import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Matches.css";

export default function Matches() {
  const token = localStorage.getItem("token");
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const [tournaments, setTournaments] = useState([]);
  const [venues, setVenues] = useState([]);
  const [matches, setMatches] = useState([]);
  const [roundInfo, setRoundInfo] = useState(null);

  const [form, setForm] = useState({
    tournamentId: "",
    teamA: "",
    teamB: "",
    date: "",
    time: "",
    venueId: "",
  });

  /* LOAD INITIAL DATA */
  useEffect(() => {
    // Fetch all tournaments for admin
    axios.get("http://localhost:5000/api/tournaments", auth).then(res => setTournaments(res.data));
    axios.get("http://localhost:5000/api/venues").then(res => setVenues(res.data));
  }, []);

  /* FETCH ROUND INFO + MATCHES WHEN TOURNAMENT SELECTED */
  useEffect(() => {
    if (!form.tournamentId) {
      setRoundInfo(null);
      return;
    }
    fetchRoundInfo(form.tournamentId);
    loadMatches(form.tournamentId);
  }, [form.tournamentId]);

  const fetchRoundInfo = async (tournamentId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/tournaments/${tournamentId}/round-info`, auth);
      setRoundInfo(res.data);
      const venue = res.data.tournament?.venueId;
      const vId = typeof venue === "object" ? venue?._id : venue;
      setForm(prev => ({
        ...prev,
        venueId: vId || "",
        teamA: "",
        teamB: ""
      }));
    } catch (err) {
      console.error("Failed to load round info:", err);
    }
  };

  const loadMatches = async (tournamentId) => {
    const res = await axios.get(
      `http://localhost:5000/api/matches/tournament/${tournamentId}`,
      auth
    );
    setMatches(res.data);
  };

  /* SUBMIT MATCH */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.teamA === form.teamB) {
      alert("Team A and Team B must be different");
      return;
    }

    if (roundInfo?.isCompleted) {
      alert("Tournament is already completed. No more matches can be created.");
      return;
    }

    const matchDate = new Date(`${form.date}T${form.time}`);

    try {
      await axios.post(
        "http://localhost:5000/api/matches",
        {
          tournamentId: form.tournamentId,
          teams: [form.teamA, form.teamB],
          matchDate,
          venueId: form.venueId,
        },
        auth
      );

      // Refresh matches and round info
      await fetchRoundInfo(form.tournamentId);
      await loadMatches(form.tournamentId);
    } catch (err) {
      alert(err.response?.data?.message || "Match creation failed");
    }
  };

  return (
    <div className="match-page">
      <div className="match-card">
        <h2>Manage Matches</h2>

        <form className="match-form" onSubmit={handleSubmit}>
          <select
            value={form.tournamentId}
            onChange={(e) => setForm({ ...form, tournamentId: e.target.value })}
            required
          >
            <option value="">Select Tournament</option>
            {tournaments.map(t => (
              <option key={t._id} value={t._id}>{t.eventName}</option>
            ))}
          </select>

          {roundInfo && (
            <div style={{ margin: "10px 0", padding: "10px", backgroundColor: "#f3f4f6", borderRadius: "6px" }}>
              <p style={{ margin: 0, fontWeight: "bold" }}>⚡ Current Active Round: {roundInfo.currentRound}</p>
              {roundInfo.isCompleted && (
                <p style={{ margin: "5px 0 0 0", color: "#10b981", fontWeight: "bold" }}>
                  🏆 Tournament Completed! Winner: {roundInfo.winner?.teamName || "TBD"}
                </p>
              )}
            </div>
          )}

          <div className="match-row">
            <select
              value={form.teamA}
              onChange={(e) => setForm({ ...form, teamA: e.target.value })}
              required
              disabled={!form.tournamentId || roundInfo?.isCompleted}
            >
              <option value="">{!form.tournamentId ? "Select Tournament First" : "Select Team A"}</option>
              {roundInfo && roundInfo.availableTeams && roundInfo.availableTeams.map(t => (
                <option key={t._id} value={t._id}>{t.teamName}</option>
              ))}
            </select>

            <select
              value={form.teamB}
              onChange={(e) => setForm({ ...form, teamB: e.target.value })}
              required
              disabled={!form.tournamentId || !form.teamA || roundInfo?.isCompleted}
            >
              <option value="">{!form.teamA ? "Select Team A First" : "Select Team B"}</option>
              {roundInfo && roundInfo.availableTeams && roundInfo.availableTeams
                .filter(t => t._id !== form.teamA)
                .map(t => (
                  <option key={t._id} value={t._id}>{t.teamName}</option>
                ))}
            </select>
          </div>

          <div className="match-row">
            <input type="date" value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
              disabled={!form.tournamentId || roundInfo?.isCompleted}
            />
            <input type="time" value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              required
              disabled={!form.tournamentId || roundInfo?.isCompleted}
            />
            <select
              value={form.venueId}
              onChange={(e) => setForm({ ...form, venueId: e.target.value })}
              required
              disabled={!form.tournamentId || roundInfo?.isCompleted}
            >
              <option value="">Select Venue</option>
              {venues.map(v => (
                <option key={v._id} value={v._id}>{v.name}</option>
              ))}
            </select>
          </div>

          <button className="match-btn" disabled={!form.tournamentId || roundInfo?.isCompleted}>
            Add Match
          </button>
        </form>

        <div className="match-list">
          <h3>Match List</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Match</th>
                <th>Date</th>
                <th>Venue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m, i) => (
                <tr key={m._id}>
                  <td>{i + 1}</td>
                  <td>{m.teams[0]?.teamName} vs {m.teams[1]?.teamName}</td>
                  <td>{new Date(m.matchDate).toLocaleString()}</td>
                  <td>{m.venueId?.name}</td>
                  <td>{m.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}