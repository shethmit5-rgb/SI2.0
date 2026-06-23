import api from "../utils/axiosConfig";

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const createOrder = async (amount, registrationId, tournamentId) => {
  const response = await api.post("/payments/create-order", {
    amount,
    registrationId,
    tournamentId,
  });
  return response.data;
};

export const verifyPayment = async (paymentData) => {
  const response = await api.post("/payments/verify-payment", paymentData);
  return response.data;
};

export const getRazorpayKey = async () => {
  const response = await api.get("/payments/get-key");
  return response.data;
};

export const initiateRegistrationPayment = async (tournamentId, teamId) => {
  const response = await api.post("/registrations/pay", { tournamentId, teamId });
  return response.data;
};

export const verifyRegistrationPayment = async (paymentData) => {
  const response = await api.post("/registrations/verify-payment", paymentData);
  return response.data;
};

export const initiateJoinPayment = async (teamId) => {
  const response = await api.post("/teams/pay-join", { teamId });
  return response.data;
};

export const verifyJoinPayment = async (paymentData) => {
  const response = await api.post("/teams/verify-join", paymentData);
  return response.data;
};

export const verifyTournamentPayment = async (paymentData) => {
  const response = await api.post("/tournaments/verify-payment", paymentData);
  return response.data;
};

export const getAdminPayments = async () => {
  const response = await api.get("/payments/admin/all");
  return response.data;
};

export const adminOverridePayment = async (transactionId, status) => {
  const response = await api.post("/payments/admin/override", { transactionId, status });
  return response.data;
};