// import "../static/sponsors.css";

// const sponsors = [
//   {
//     name: "TechCorp",
//     logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=400&q=80",
//   },
//   {
//     name: "Sportify",
//     logo: "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&q=80",
//   },
//   {
//     name: "EventPro",
//     logo: "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=400&q=80",
//   },
//   {
//     name: "PlayZone",
//     logo: "https://images.unsplash.com/photo-1526948531399-320e7e40f0ca?w=400&q=80",
//   },
//   {
//     name: "ArenaX",
//     logo: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&q=80",
//   },
//   {
//     name: "LiveScore",
//     logo: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80",
//   },
//   {
//     name: "Athletica",
//     logo: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=400&q=80",
//   },
//   {
//     name: "ChampionHub",
//     logo: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&q=80",
//   },
// ];


// const Sponsors = () => {
//   return (
//     <section className="sponsors-section">
//       {/* HEADER */}
//       <div className="sponsors-header fade-up">
//         <h2>Our Trusted Sponsors</h2>
//         <div className="underline"></div>
//         <p>
//           We collaborate with industry-leading brands that power world-class
//           sports tournaments, athlete development, and innovative event
//           experiences.
//         </p>
//       </div>

//       {/* GRID */}
//       <div className="sponsors-grid">
//         {sponsors.map((sp, index) => (
//           <div
//             className="sponsor-card fade-stagger"
//             style={{ animationDelay: `${index * 0.12}s` }}
//             key={index}
//           >
//             <img src={sp.logo} alt={sp.name} />
//           </div>
//         ))}
//       </div>

//       {/* WHY SPONSORS */}
//       <div className="sponsor-info fade-up">
//         <h3>Why Our Sponsors Matter</h3>
//         <p>
//           Our sponsors enable high-quality venues, professional refereeing,
//           athlete safety, live broadcasting, digital score systems, and fair
//           prize distribution. Their partnership elevates every tournament to
//           international standards.
//         </p>
//       </div>

//       {/* BENEFITS */}
//       <div className="sponsor-benefits">
//         <h3>Benefits for Sponsors</h3>

//         <div className="benefits-grid">
//           <div className="benefit-card">
//             🌍 <h4>Global Visibility</h4>
//             <p>Your brand reaches athletes, teams, and audiences worldwide.</p>
//           </div>

//           <div className="benefit-card">
//             🤝 <h4>Community Impact</h4>
//             <p>Support youth sports, talent growth, and healthy competition.</p>
//           </div>

//           <div className="benefit-card">
//             📈 <h4>Brand Growth</h4>
//             <p>Associate your brand with excellence and performance.</p>
//           </div>
//         </div>
//       </div>

//       {/* CTA */}
//       <div className="sponsor-cta">
//         <h2>Become a Sponsor</h2>
//         <p>
//           Partner with us and be part of unforgettable sporting moments.
//         </p>
//         <a href="/contact" className="hero-btn">
//           Partner With Us
//         </a>
//       </div>
//     </section>
//   );
// };

// export default Sponsors;

import { useEffect, useState } from "react";
import api from "../utils/axiosConfig";

export default function Sponsors() {
  const [sponsors, setSponsors] = useState([]);

  useEffect(() => {
    api.get("/sponsors/public").then((res) => {
      setSponsors(res.data);
    });
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      <h2>Our Sponsors</h2>

      {sponsors.map((s) => (
        <div key={s._id} style={cardStyle}>
          <h3>{s.name}</h3>
          <p>Amount: ₹{s.amount}</p>
          <p>Tournament: {s.tournamentId?.eventName}</p>
        </div>
      ))}
    </div>
  );
}

const cardStyle = {
  background: "var(--glass-bg, rgba(255, 255, 255, 0.18))",
  backdropFilter: "Glass(14px) blur(14px)",
  WebkitBackdropFilter: "Glass(14px) blur(14px)",
  border: "1px solid var(--glass-border, rgba(255, 255, 255, 0.25))",
  padding: "20px",
  margin: "20px 0",
  borderRadius: "24px",
  boxShadow: "var(--glass-shadow, 0 8px 32px rgba(0, 0, 0, 0.08))"
};