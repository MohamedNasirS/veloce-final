import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import React from 'react';

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
import AdminGatePassList from "./pages/dashboards/AdminGatePassList";
import AdminGatePass from "./pages/dashboards/AdminGatePass";
import UserRegistrationMonitor from "./components/UserRegistrationMonitor";

// Waste Generator Pages
import CreateBid from "./pages/dashboards/CreateBid";
import MyBids from "./pages/dashboards/MyBids";
import SelectWinner from "./pages/dashboards/SelectWinner";
import GatePassList from "./pages/dashboards/GatePassList";
import GatePass from "./pages/dashboards/GatePass";


// Recycler/Aggregator Pages
import Participated from "./pages/dashboards/Participated";
import UploadDocuments from "./pages/dashboards/UploadDocuments";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter basename="/marketplace">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Layout><Landing /></Layout>} />
            <Route path="/login" element={<Layout><Login /></Layout>} />
            <Route path="/register" element={<Layout><Register /></Layout>} />

            {/* Protected routes */}
            <Route
              path="/live-bids"
              element={<ProtectedRoute><Layout><LiveBids /></Layout></ProtectedRoute>}
            />
            <Route
              path="/closed-bids"
              element={<ProtectedRoute><Layout><ClosedBids /></Layout></ProtectedRoute>}
            />
            <Route
              path="/bid/:bidId"
              element={<ProtectedRoute><Layout><BidDetail /></Layout></ProtectedRoute>}
            />

            {/* Dashboard Routes */}
            <Route
              path="/dashboard"
              element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
            >
              <Route index element={<DashboardRedirect />} />

              {/* Admin Routes */}
              <Route path="admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
              <Route path="admin/bids" element={<ProtectedRoute allowedRoles={['admin']}><AdminBidManagement /></ProtectedRoute>} />
              <Route path="admin/winner-selection" element={<ProtectedRoute allowedRoles={['admin']}><AdminWinnerSelection /></ProtectedRoute>} />
              <Route path="admin/gate-passes" element={<ProtectedRoute allowedRoles={['admin']}><AdminGatePassList /></ProtectedRoute>} />
              <Route path="admin/gate-passes/:bidId" element={<ProtectedRoute allowedRoles={['admin']}><AdminGatePass /></ProtectedRoute>} />
              <Route path="admin/monitor" element={<ProtectedRoute allowedRoles={['admin']}><UserRegistrationMonitor /></ProtectedRoute>} />

              {/* Waste Generator Routes */}
              <Route path="waste_generator" element={<ProtectedRoute allowedRoles={['waste_generator']}><WasteGeneratorDashboard /></ProtectedRoute>} />
              <Route path="waste_generator/create-bid" element={<ProtectedRoute allowedRoles={['waste_generator']}><CreateBid /></ProtectedRoute>} />
              <Route path="waste_generator/my-bids" element={<ProtectedRoute allowedRoles={['waste_generator']}><MyBids /></ProtectedRoute>} />
              <Route path="waste_generator/select-winner/:bidId" element={<ProtectedRoute allowedRoles={['waste_generator']}><SelectWinner /></ProtectedRoute>} />
              {/* --- ADDED GATE PASS ROUTES --- */}
              <Route path="waste_generator/gate-passes" element={<ProtectedRoute allowedRoles={['waste_generator']}><GatePassList /></ProtectedRoute>} />
              <Route path="waste_generator/gate-passes/:bidId" element={<ProtectedRoute allowedRoles={['waste_generator']}><GatePass /></ProtectedRoute>} />
              {/* ----------------------------- */}

              {/* Recycler/Aggregator Routes */}
              <Route path="recycler" element={<ProtectedRoute allowedRoles={['recycler', 'aggregator']}><RecyclerDashboard /></ProtectedRoute>} />
              <Route path="recycler/participated" element={<ProtectedRoute allowedRoles={['recycler', 'aggregator']}><Participated /></ProtectedRoute>} />
              <Route path="recycler/upload-documents" element={<ProtectedRoute allowedRoles={['recycler', 'aggregator']}><UploadDocuments /></ProtectedRoute>} />
              <Route path="aggregator" element={<ProtectedRoute allowedRoles={['aggregator']}><RecyclerDashboard /></ProtectedRoute>} />
              <Route path="aggregator/participated" element={<ProtectedRoute allowedRoles={['aggregator']}><Participated /></ProtectedRoute>} />
              <Route path="aggregator/upload-documents" element={<ProtectedRoute allowedRoles={['aggregator']}><UploadDocuments /></ProtectedRoute>} />
            </Route>

            {/* Not Found Route */}
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
      <span className="ml-2">Redirecting...</span>
    </div>
  );
};

export default App; 