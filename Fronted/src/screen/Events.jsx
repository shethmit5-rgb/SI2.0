import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/axiosConfig";
import "../static/event.css";

export default function Events() {
  const [tournaments, setTournaments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        let res;
        try {
          res = await api.get("/tournaments/public");
        } catch {
          res = await api.get("/tournaments");
        }

        setTournaments(res.data);
        setFiltered(res.data);
      } catch (err) {
        console.error("Failed to load tournaments", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ================= FILTER ================= */
  useEffect(() => {
    if (filter === "all") {
      setFiltered(tournaments);
    } else {
      setFiltered(tournaments.filter((t) => t.status === filter));
    }
  }, [filter, tournaments]);

  if (loading) {
    return <div className="loading">Loading tournaments...</div>;
  }

  return (
    <section className="events-page">
      
      {/* HEADER */}
      <div className="events-header">
        <h1>🏆 Tournaments</h1>
        <p>Explore all tournaments happening around you</p>
      </div>

      {/* FILTER BUTTONS */}
      <div className="filters">
        <button onClick={() => setFilter("all")} className={filter==="all" ? "active" : ""}>All</button>
        <button onClick={() => setFilter("upcoming")} className={filter==="upcoming" ? "active" : ""}>Upcoming</button>
        <button onClick={() => setFilter("ongoing")} className={filter==="ongoing" ? "active" : ""}>Ongoing</button>
        <button onClick={() => setFilter("completed")} className={filter==="completed" ? "active" : ""}>Completed</button>
      </div>

      {/* GRID */}
      <div className="events-grid">
        {filtered.length > 0 ? (
          filtered.map((t) => (
            <div key={t._id} className="event-card">

              <div className="event-top">
                <span className={`status ${t.status}`}>
                  {t.status}
                </span>
                <span className="sport">{t.sportId?.name}</span>
              </div>

              <h3>{t.eventName}</h3>

              <div className="event-info">
                <p>📅 {new Date(t.startDate).toLocaleDateString()}</p>
                <p>📍 {t.location}</p>
                <p>👥 {t.teams?.length || 0} teams</p>
              </div>

              <div className="event-prize">
                🏆 ₹{t.prizePool?.toLocaleString() || 0}
              </div>

              {t.activeSponsorships && t.activeSponsorships.length > 0 && (
                <div className="card-sponsors" style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "10px 0", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.7 }}>Sponsors:</span>
                  {t.activeSponsorships.map((s) => (
                    s.logo ? (
                      <img 
                        key={s._id} 
                        src={s.logo} 
                        alt={s.name} 
                        title={`${s.name} (${s.type === "title" ? "Title Sponsor" : `In-Kind: ${s.equipment}`})`}
                        style={{ height: "20px", objectFit: "contain", borderRadius: "2px" }} 
                      />
                    ) : null
                  ))}
                </div>
              )}

              <Link to={`/tournament/${t._id}`} className="event-btn">
                View Details
              </Link>

            </div>
          ))
        ) : (
          <p className="no-data">No tournaments found</p>
        )}
      </div>

    </section>
  );
}