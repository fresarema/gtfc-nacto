import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar/Sidebar';

export const MainLayout: React.FC = () => {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1, width: '100%', boxSizing: 'border-box' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;