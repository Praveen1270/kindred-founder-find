import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Lightbulb, 
  MessageCircle, 
  Bell, 
  Search, 
  ArrowRight, 
  CheckCircle,
  Star,
  Zap,
  Sparkles
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      navigate('/sign');
    }
  };
  const features = [
    {
      icon: <Search className="h-6 w-6" />,
      title: "Smart Matching",
      description: "AI-powered algorithm matches you with founders based on skills, industry, and startup stage."
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: "Direct Messaging",
      description: "Connect directly with potential co-founders through our built-in messaging system."
    },
    {
      icon: <Bell className="h-6 w-6" />,
      title: "Instant Notifications",
      description: "Get notified immediately when you're matched with compatible founders."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Verified Profiles",
      description: "All founders are verified to ensure quality connections and genuine opportunities."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Co-founder, TechFlow",
      content: "FounderCollab helped me find my perfect co-founder. We launched our SaaS platform in just 6 months!",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      role: "Founder, GreenTech Solutions",
      content: "The matching algorithm is incredible. I connected with someone who perfectly complemented my skills.",
      rating: 5
    },
    {
      name: "Priya Patel",
      role: "CEO, HealthAI",
      content: "From idea to MVP in record time thanks to the amazing co-founder I found here.",
      rating: 5
    }
  ];

  const stats = [
    { number: "2,500+", label: "Founders Connected" },
    { number: "150+", label: "Successful Startups" },
    { number: "95%", label: "Satisfaction Rate" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">FounderCollab</span>
            </div>
            <Button 
              onClick={handleGetStarted}
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-full font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            <span>Join thousands of founders</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            Find Your Perfect
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Co-Founder
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Connect with like-minded founders, share your startup idea, and build the next big thing together. 
            Our AI-powered matching system finds the perfect co-founder for your vision.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Start Finding Matches
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-gray-200 text-gray-700 hover:bg-gray-50 px-8 py-4 rounded-full text-lg font-medium transition-all duration-200"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-3">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to Find Your Co-Founder
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our platform combines advanced technology with human insight to create meaningful connections.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {features.map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">How It Works</h2>
            <p className="text-xl text-gray-600">
              Get started in minutes and find your co-founder in days
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Create Your Profile</h3>
              <p className="text-gray-600 leading-relaxed">
                Share your skills, experience, and startup idea. Tell us what you're looking for in a co-founder.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Matched</h3>
              <p className="text-gray-600 leading-relaxed">
                Our AI analyzes thousands of profiles to find founders who complement your skills and vision.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Connect & Build</h3>
              <p className="text-gray-600 leading-relaxed">
                Message your matches, schedule calls, and start building your startup together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Success Stories</h2>
            <p className="text-xl text-gray-600">
              See how founders are building amazing companies together
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="group">
                <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 border border-gray-100">
                  <div className="flex items-center mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-6 text-lg">"{testimonial.content}"</p>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{testimonial.name}</div>
                    <div className="text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Ready to Find Your Co-Founder?
          </h2>
          <p className="text-xl mb-12 opacity-90 leading-relaxed">
            Join thousands of founders who have already found their perfect match
          </p>
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="bg-white text-gray-900 hover:bg-gray-100 px-10 py-4 rounded-full text-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}; 