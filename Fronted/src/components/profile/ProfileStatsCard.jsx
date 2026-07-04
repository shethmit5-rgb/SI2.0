import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  LineChart,
  Line,
  Cell,
} from "recharts";
import "../../static/Profile.css";

export default function ProfileStatsCard({ role, statsData = {} }) {
  // 1. Define stats configuration based on role
  let cards = [];
  let chartSection = null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (role === "organizer") {
    const s = statsData.stats || {};
    cards = [
      {
        title: "Organized Tournaments",
        value: s.totalTournaments || 0,
        trend: "▲ +2 this season",
        color: "primary",
        icon: "🏆",
      },
      {
        title: "Active Tournaments",
        value: s.ongoing || 0,
        trend: "⚡ Active Now",
        color: "teal",
        icon: "🔥",
      },
      {
        title: "Teams Registered",
        value: statsData.registrations?.approved || 0,
        trend: "▲ +18% vs last year",
        color: "highlight",
        icon: "👥",
      },
      {
        title: "Matches Managed",
        value: statsData.matches?.total || 0,
        trend: "▲ +40 total",
        color: "premium",
        icon: "⚔️",
      },
    ];

    const organizerChartData = [
      { name: "Jan", Tournaments: 1, Registrations: 4 },
      { name: "Feb", Tournaments: 2, Registrations: 8 },
      { name: "Mar", Tournaments: 3, Registrations: 15 },
      { name: "Apr", Tournaments: 5, Registrations: 28 },
      { name: "May", Tournaments: 6, Registrations: 34 },
      { name: "Jun", Tournaments: s.totalTournaments || 6, Registrations: statsData.registrations?.total || 42 },
    ];

    chartSection = (
      <div className="stats-chart-wrapper glass-card">
        <h3>📈 Tournament Growth & Registration Rates</h3>
        <div style={{ width: "100%", height: 260, minWidth: 0 }}>
          <ResponsiveContainer>
            <AreaChart data={organizerChartData}>
              <defs>
                <linearGradient id="colorTourneys" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRegs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--teal)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--teal)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip contentStyle={{ background: "rgba(17,24,39,0.9)", border: "1px solid var(--border)", borderRadius: "8px" }} />
              <Area type="monotone" dataKey="Tournaments" stroke="var(--primary)" fillOpacity={1} fill="url(#colorTourneys)" strokeWidth={2} />
              <Area type="monotone" dataKey="Registrations" stroke="var(--teal)" fillOpacity={1} fill="url(#colorRegs)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  } else if (role === "coach") {
    const s = statsData.stats || {};
    const f = statsData.financials || {};
    cards = [
      {
        title: "Teams Managed",
        value: s.teamsCreated || 0,
        trend: "▲ +1 Active",
        color: "primary",
        icon: "🛡️",
      },
      {
        title: "Players Coached",
        value: s.activePlayers || 0,
        trend: `👥 ${s.pendingPlayers || 0} Pending Approval`,
        color: "teal",
        icon: "👟",
      },
      {
        title: "Win Rate",
        value: `${s.winRate || 0}%`,
        trend: `Wins: ${s.wins || 0} | Losses: ${s.losses || 0}`,
        color: "success",
        icon: "⚡",
      },
      {
        title: "Prize Earnings",
        value: formatCurrency(f.prizeMoneyWon || 0),
        trend: "🏆 Cup Rewards",
        color: "premium",
        icon: "💰",
      },
    ];

    const coachChartData = [
      { name: "Week 1", WinRate: 40 },
      { name: "Week 2", WinRate: 50 },
      { name: "Week 3", WinRate: 45 },
      { name: "Week 4", WinRate: 60 },
      { name: "Week 5", WinRate: parseFloat(s.winRate) || 75 },
    ];

    chartSection = (
      <div className="stats-chart-wrapper glass-card">
        <h3>📈 Team Performance & Win Rate Trend</h3>
        <div style={{ width: "100%", height: 260, minWidth: 0 }}>
          <ResponsiveContainer>
            <AreaChart data={coachChartData}>
              <defs>
                <linearGradient id="colorWinrate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--success)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} unit="%" />
              <Tooltip contentStyle={{ background: "rgba(17,24,39,0.9)", border: "1px solid var(--border)", borderRadius: "8px" }} />
              <Area type="monotone" dataKey="WinRate" stroke="var(--success)" fillOpacity={1} fill="url(#colorWinrate)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  } else if (role === "player") {
    const s = statsData.stats || {};
    const f = statsData.financials || {};
    cards = [
      {
        title: "Matches Played",
        value: s.totalMatchesPlayed || 0,
        trend: `Wins: ${s.matchesWon || 0} | Losses: ${s.matchesLost || 0}`,
        color: "primary",
        icon: "⚔️",
      },
      {
        title: "Goals & Assists",
        value: `${f.goals || 0} G / ${f.assists || 0} A`,
        trend: "⭐ Contribution Index",
        color: "teal",
        icon: "⚽",
      },
      {
        title: "Tournament Rewards",
        value: s.tournamentsWon || 0,
        trend: `🏆 ${s.runnerUpFinishes || 0} Runner-up`,
        color: "success",
        icon: "🥇",
      },
      {
        title: "Lifetime Earnings",
        value: formatCurrency(f.totalPrizeMoneyEarned || 0),
        trend: "▲ +₹50k this month",
        color: "premium",
        icon: "💰",
      },
    ];

    const playerChartData = [
      { name: "Feb", Earnings: 0 },
      { name: "Mar", Earnings: 20000 },
      { name: "Apr", Earnings: 35000 },
      { name: "May", Earnings: 60000 },
      { name: "Jun", Earnings: f.totalPrizeMoneyEarned || 75000 },
    ];

    chartSection = (
      <div className="stats-chart-wrapper glass-card">
        <h3>📈 Earnings & Rewards Growth Trend</h3>
        <div style={{ width: "100%", height: 260, minWidth: 0 }}>
          <ResponsiveContainer>
            <AreaChart data={playerChartData}>
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--highlight)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--highlight)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip contentStyle={{ background: "rgba(17,24,39,0.9)", border: "1px solid var(--border)", borderRadius: "8px" }} />
              <Area type="monotone" dataKey="Earnings" stroke="var(--highlight)" fillOpacity={1} fill="url(#colorEarnings)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  } else if (role === "sponsor") {
    const s = statsData.stats || {};
    const f = statsData.financials || {};
    cards = [
      {
        title: "Sponsored Amount",
        value: formatCurrency(f.totalSponsoredAmount || 0),
        trend: "💰 Approved Funds",
        color: "premium",
        icon: "💎",
      },
      {
        title: "Sponsored Tournaments",
        value: s.sponsoredTournaments || 0,
        trend: `⚡ ${s.activeSponsorships || 0} Active`,
        color: "primary",
        icon: "🏁",
      },
      {
        title: "Players Rewarded",
        value: s.totalPlayersRewarded || 0,
        trend: "▲ +100% Athlete reach",
        color: "teal",
        icon: "👥",
      },
      {
        title: "ROI Visibility Index",
        value: `${(s.sponsoredTournaments * 12 + 50) || 50}%`,
        trend: "📈 Positive Brand Impact",
        color: "success",
        icon: "✨",
      },
    ];

    const sponsorChartData = [
      { name: "Mar", Sponsored: 50000 },
      { name: "Apr", Sponsored: 100000 },
      { name: "May", Sponsored: 150000 },
      { name: "Jun", Sponsored: f.totalSponsoredAmount || 150000 },
    ];

    chartSection = (
      <div className="stats-chart-wrapper glass-card">
        <h3>📈 Sponsorship Growth & Funding Velocity</h3>
        <div style={{ width: "100%", height: 260, minWidth: 0 }}>
          <ResponsiveContainer>
            <AreaChart data={sponsorChartData}>
              <defs>
                <linearGradient id="colorSponsor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--gold-champagne)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--gold-champagne)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip contentStyle={{ background: "rgba(17,24,39,0.9)", border: "1px solid var(--border)", borderRadius: "8px" }} />
              <Area type="monotone" dataKey="Sponsored" stroke="var(--gold)" fillOpacity={1} fill="url(#colorSponsor)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-stats-card-container">
      {/* 4 Cards Grid */}
      <div className="profile-stats-grid">
        {cards.map((card, idx) => (
          <div key={idx} className={`stat-card-premium border-theme-${card.color} glass-card`}>
            <div className="stat-card-header">
              <span className="stat-card-icon">{card.icon}</span>
              <span className="stat-card-trend">{card.trend}</span>
            </div>
            <strong className="stat-card-value">{card.value}</strong>
            <span className="stat-card-title">{card.title}</span>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      {chartSection}
    </div>
  );
}
