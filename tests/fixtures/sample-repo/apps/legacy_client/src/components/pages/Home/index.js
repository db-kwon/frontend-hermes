import { apiRequest } from "api/client";

// Wrapper + object-literal API call — the dominant legacy JS pattern.
export const getDashboard = async () =>
  apiRequest({ url: "/dashboard/v2/summary/", method: "GET" });

export default function Home() {
  return null;
}
