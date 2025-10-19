import React from "react";
import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import MapView from "./pages/MapView";
import Missions from "./pages/Missions";
import Leaderboard from "./pages/Leaderboard";
import UserProfile from "./pages/UserProfile";
import TicketDetail from "./pages/TicketDetail";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "feed",
        element: <Feed />,
      },
      {
        path: "map",
        element: <MapView />,
      },
      {
        path: "missions",
        element: <Missions />,
      },
      {
        path: "leaderboard",
        element: <Leaderboard />,
      },
      {
        path: "profile",
        element: <UserProfile />,
      },
      {
        path: "tickets/:id",
        element: <TicketDetail />,
      },
    ],
  },
]);
