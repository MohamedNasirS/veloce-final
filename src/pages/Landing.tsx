
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Recycle, Shield, Clock, Users, TrendingUp, Award } from 'lucide-react';

const Landing = () => {
  const { user } = useAuth();

  const roles = [
    {
      title: 'Waste Generator',
      description: 'Post your waste for bidding and select the best recycler',
      features: ['Create waste listings', 'Receive competitive bids', 'Select winners', 'Generate gate passes'],
      color: 'bg-blue-500',
      icon: Users
    },
    {
      title: 'Recycler',
      description: 'Bid on waste materials and grow your recycling business',
      features: ['Browse live auctions', 'Place competitive bids', 'Upload compliance documents', 'Track bid status'],
      color: 'bg-green-500',
      icon: Recycle
    },
    {
      title: 'Aggregator',
      description: 'Collect and aggregate waste for efficient recycling',
      features: ['Participate in auctions', 'Manage multiple bids', 'Upload proof documents', 'Track rankings'],
      color: 'bg-purple-500',
      icon: TrendingUp
    },
    {
      title: 'Admin',
      description: 'Manage the platform and ensure compliance',
      features: ['Approve users', 'Set base prices', 'Monitor activities', 'Generate reports'],
      color: 'bg-red-500',
      icon: Shield
    }
  ];

  const stats = [
    { label: 'Active Waste Generators', value: '500+', icon: Users },
    { label: 'Registered Recyclers', value: '200+', icon: Recycle },
    { label: 'Tons Recycled', value: '10,000+', icon: TrendingUp },
    { label: 'Successful Bids', value: '1,500+', icon: Award }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Welcome to <span className="text-green-600">WasteBid</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          India's premier digital marketplace for waste management. Connect waste generators 
          with certified recyclers and aggregators through transparent, competitive auctions. 
          Transform waste into value with our secure, compliant platform.
        </p>
        
        {user ? (
          <div className="space-x-4">
            <Link to="/live-bids">
              <Button size="lg" className="text-lg px-8 py-3">
                View Live Bids
              </Button>
            </Link>
            <Link to={`/dashboard/${user.role}`}>
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-x-4">
            <Link to="/register">
              <Button size="lg" className="text-lg px-8 py-3">
                Get Started
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                Login
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
        {stats.map((stat, index) => (
          <Card key={index} className="text-center">
            <CardContent className="p-6">
              <stat.icon className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role Overview */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Choose Your Role
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className={`w-12 h-12 ${role.color} rounded-lg mb-4 flex items-center justify-center`}>
                  <role.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">{role.title}</CardTitle>
                <CardDescription>{role.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {role.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Platform Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Bidding</h3>
            <p className="text-gray-600">Live auction interface with countdown timers and instant bid updates</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Transparent Process</h3>
            <p className="text-gray-600">Full audit trail and transparent bidding process for all participants</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Compliance Management</h3>
            <p className="text-gray-600">Document upload and verification system for regulatory compliance</p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">Post Your Waste</h3>
            <p className="text-gray-600">Waste generators create detailed listings with photos, specifications, and pickup requirements</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">Receive Bids</h3>
            <p className="text-gray-600">Certified recyclers and aggregators place competitive bids on your waste materials</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">Complete Transaction</h3>
            <p className="text-gray-600">Select the best bid, arrange pickup, and complete the transaction securely</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
