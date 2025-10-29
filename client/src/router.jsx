/**
 * Router Update - Add /tickets/new route
 * client/src/router.jsx
 */

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
import NewTicket from "./pages/NewTicket";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/common/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
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
        path: "tickets/new",
        element: <NewTicket />,
      },
      {
        path: "tickets/:id",
        element: <TicketDetail />,
      },
    ],
  },
]);