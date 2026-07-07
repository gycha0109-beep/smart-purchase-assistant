import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getSession } from './mockAuth';
import { initMockDb } from './mockDb';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ItemManagement from './pages/ItemManagement';
import VendorManagement from './pages/VendorManagement';
import InventoryInput from './pages/InventoryInput';
import OrderRecommendation from './pages/OrderRecommendation';
import PurchaseOrderDraft from './pages/PurchaseOrderDraft';

const ProtectedRoute = ({ children, setIsAuthenticated }) => {
  const session = getSession();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return React.cloneElement(children, { setIsAuthenticated });
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initMockDb();
    setIsAuthenticated(!!getSession());
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/" element={
          <ProtectedRoute setIsAuthenticated={setIsAuthenticated}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="items" element={<ItemManagement />} />
          <Route path="vendors" element={<VendorManagement />} />
          <Route path="inventory" element={<InventoryInput />} />
          <Route path="recommendation" element={<OrderRecommendation />} />
          <Route path="draft" element={<PurchaseOrderDraft />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
