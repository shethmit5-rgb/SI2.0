import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import api from "../utils/axiosConfig";
import SkeletonChart from "../components/loading/SkeletonChart";

export default function SponsorshipChart() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSponsorshipData();
  }, []);

  const fetchSponsorshipData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/sponsors/stats");
      
      // ✅ Check if response data exists
      if (!response.data) {
        setChartData([]);
        return;
      }

      // ✅ Handle different response structures
      let data = [];
      
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data.sponsorships) {
        data = response.data.sponsorships;
      } else {
        data = [];
      }

      // ✅ Filter out null/undefined items and format data
      const formattedData = data
        .filter(item => item && item.eventName) // Remove null items
        .map(item => ({
          name: item.eventName || "Unknown",
          value: item.amount || item.sponsorshipAmount || 0,
          tournamentId: item.tournamentId,
        }));

      setChartData(formattedData);
    } catch (err) {
      console.error("Error fetching sponsorship data:", err);
      setError(err.response?.data?.message || "Failed to load sponsorship data");
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  // Colors for the pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

  if (loading) {
    return (
      <div className="sponsorship-chart-container">
        <SkeletonChart type="pie" height="350px" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="sponsorship-chart-container">
        <div className="error-message">Error: {error}</div>
        <button onClick={fetchSponsorshipData} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="sponsorship-chart-container">
        <div className="no-data-message">No sponsorship data available</div>
      </div>
    );
  }

  return (
    <div className="sponsorship-chart-container">
      <h3>Sponsorship Distribution by Tournament</h3>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={150}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}