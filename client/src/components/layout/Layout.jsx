import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Navigation from './Navigation';

export default function Layout() {
  return (
    <div className="layout">
      <Header />
      <div className="layout-container">
        <Navigation />
        <main className="layout-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}