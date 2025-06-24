import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';


// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LiveBids from "./pages/LiveBids";
import ClosedBids from "./pages/ClosedBids";
import BidDetail from "./pages/BidDetail";
import NotFound from "./pages/NotFound";

// Dashboard Pages
import WasteGeneratorDashboard from "./pages/dashboards/WasteGeneratorDashboard";
import RecyclerDashboard from "./pages/dashboards/RecyclerDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import AdminWinnerSelection from "./pages/dashboards/AdminWinnerSelection";
import AdminUsers from "./pages/dashboards/AdminUsers";
import AdminBidManagement from "./pages/dashboards/AdminBidManagement";

// Waste Generator Pages
import CreateBid from "./pages/dashboards/CreateBid";
import MyBids from "./pages/dashboards/MyBids";
import SelectWinner from "./pages/dashboards/SelectWinner";
import SelectVenue from "./pages/dashboards/SelectVenue";

// Recycler/Aggregator Pages
import Participated from "./pages/dashboards/Participated";
import UploadProof from "./pages/dashboards/UploadProof";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes with layout */}
            <Route path="/" element={<Layout><Landing /></Layout>} />
            <Route path="/login" element={<Layout><Login /></Layout>} />
            <Route path="/register" element={<Layout><Register /></Layout>} />
            
            {/* Protected public pages */}
            <Route path="/live-bids" element={
              <ProtectedRoute>
                <Layout><LiveBids /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/closed-bids" element={
              <ProtectedRoute>
                <Layout><ClosedBids /></Layout>
              </ProtectedRoute>
            } />
            
            {/* Bid detail page */}
            <Route path="/bid/:bidId" element={
              <ProtectedRoute>
                <Layout>
                  <div>
                    {console.log('BidDetail route matched')}
                    <BidDetail />
                  </div>
                </Layout>
              </ProtectedRoute>
            } />

            {/* Dashboard routes - Fixed structure */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              {/* Waste Generator Dashboard */}
              <Route path="waste_generator" element={
                <ProtectedRoute allowedRoles={['waste_generator']}>
                  <WasteGeneratorDashboard />
                </ProtectedRoute>
              } />
              <Route path="waste_generator/create-bid" element={
                <ProtectedRoute allowedRoles={['waste_generator']}>
                  <CreateBid />
                </ProtectedRoute>
              } />
              <Route path="waste_generator/my-bids" element={
                <ProtectedRoute allowedRoles={['waste_generator']}>
                  <MyBids />
                </ProtectedRoute>
              } />
              <Route path="waste_generator/select-winner/:bidId" element={
                <ProtectedRoute allowedRoles={['waste_generator']}>
                  <SelectWinner />
                </ProtectedRoute>
              } />
              <Route path="waste_generator/select-venue/:bidId" element={
                <ProtectedRoute allowedRoles={['waste_generator']}>
                  <SelectVenue />
                </ProtectedRoute>
              } />
              <Route path="waste_generator/gate-passes" element={
                <ProtectedRoute allowedRoles={['waste_generator']}>
                  <div className="p-8 text-center">
                    <h2 className="text-2xl font-semibold mb-4">Gate Passes</h2>
                    <p className="text-gray-600">Gate pass management coming soon.</p>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="waste_generator/gate-passes/:bidId" element={
                <ProtectedRoute allowedRoles={['waste_generator']}>
                  <div className="p-8 text-center">
                    <h2 className="text-2xl font-semibold mb-4">Generate Gate Pass</h2>
                    <p className="text-gray-600">Gate pass generation coming soon.</p>
                  </div>
                </ProtectedRoute>
              } />

              {/* Recycler Dashboard - Fixed */}
              <Route path="recycler" element={
                <ProtectedRoute allowedRoles={['recycler']}>
                  <RecyclerDashboard />
                </ProtectedRoute>
              } />
              <Route path="recycler/live-bids" element={
                <ProtectedRoute allowedRoles={['recycler']}>
                  <div className="p-8 text-center">
                    <h2 className="text-2xl font-semibold mb-4">Live Bids</h2>
                    <p className="text-gray-600">Please use the main Live Bids page from the header.</p>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="recycler/participated" element={
                <ProtectedRoute allowedRoles={['recycler']}>
                  <Participated />
                </ProtectedRoute>
              } />
              <Route path="recycler/upload-proof" element={
                <ProtectedRoute allowedRoles={['recycler']}>
                  <UploadProof />
                </ProtectedRoute>
              } />

              {/* Aggregator Dashboard */}
              <Route path="aggregator" element={
                <ProtectedRoute allowedRoles={['aggregator']}>
                  <RecyclerDashboard />
                </ProtectedRoute>
              } />
              <Route path="aggregator/live-bids" element={
                <ProtectedRoute allowedRoles={['aggregator']}>
                  <div className="p-8 text-center">
                    <h2 className="text-2xl font-semibold mb-4">Live Bids</h2>
                    <p className="text-gray-600">Please use the main Live Bids page from the header.</p>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="aggregator/participated" element={
                <ProtectedRoute allowedRoles={['aggregator']}>
                  <Participated />
                </ProtectedRoute>
              } />
              <Route path="aggregator/upload-proof" element={
                <ProtectedRoute allowedRoles={['aggregator']}>
                  <UploadProof />
                </ProtectedRoute>
              } />

              {/* Admin Dashboard */}
              <Route path="admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="admin/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              } />
              <Route path="admin/bids" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminBidManagement />
                </ProtectedRoute>
              } />
              <Route path="admin/winner-selection" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminWinnerSelection />
                </ProtectedRoute>
              } />
              <Route path="admin/logs" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <div className="p-8 text-center">
                    <h2 className="text-2xl font-semibold mb-4">Audit Logs</h2>
                    <p className="text-gray-600">System logs and audit trail coming soon.</p>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="admin/documents" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <div className="p-8 text-center">
                    <h2 className="text-2xl font-semibold mb-4">Document Management</h2>
                    <p className="text-gray-600">Document verification system coming soon.</p>
                  </div>
                </ProtectedRoute>
              } />

              {/* Default dashboard route - redirects based on user role */}
              <Route index element={
                <ProtectedRoute>
                  <DashboardRedirect />
                </ProtectedRoute>
              } />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

// Component to redirect to appropriate dashboard based on user role
const DashboardRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'waste_generator':
          navigate('/dashboard/waste_generator', { replace: true });
          break;
        case 'recycler':
          navigate('/dashboard/recycler', { replace: true });
          break;
        case 'aggregator':
          navigate('/dashboard/aggregator', { replace: true });
          break;
        case 'admin':
          navigate('/dashboard/admin', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    }
  }, [user, navigate]);

  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <span className="ml-2">Redirecting to dashboard...</span>
    </div>
  );
};

export default App;
