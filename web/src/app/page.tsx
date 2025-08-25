'use client'
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Megaphone, 
  Calendar, 
  BookOpen, 
  Users, 
  FileText, 
  PartyPopper,
  Download,
  Globe,
  Crown,
  Star,
  GraduationCap,
  UserCheck,
  Shield
} from 'lucide-react';

const UPSSHubLanding = () => {
  const [activeLogin, setActiveLogin] = useState('student');

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const features = [
    {
      icon: Megaphone,
      title: "Digital Notice Board",
      description: "Never miss an announcement"
    },
    {
      icon: Calendar,
      title: "Smart Timetable",
      description: "Real-time updates on class changes"
    },
    {
      icon: BookOpen,
      title: "Assignments & Results",
      description: "Submit, track, and improve"
    },
    {
      icon: Users,
      title: "Guild of Scholars",
      description: "Voice/video calls, debates, live classes"
    },
    {
      icon: FileText,
      title: "Study Resources",
      description: "Notes, eBooks, past questions"
    },
    {
      icon: PartyPopper,
      title: "Events Hub",
      description: "Sports, Entrepreneurial Week, debates"
    }
  ];

  const testimonials = [
    {
      text: "Now I never miss announcements.",
      author: "Student"
    },
    {
      text: "It is easier to track assignments and results.",
      author: "Teacher"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-purple-500/10"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <motion.div 
            className="text-center"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div 
              variants={fadeInUp}
              className="mb-8"
            >
              {/* Placeholder for 3D Animation - C++/WebAssembly integration point */}
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-r from-emerald-400 to-purple-500 rounded-full flex items-center justify-center">
                <GraduationCap className="w-16 h-16 text-white" />
              </div>
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent mb-6"
            >
              UPSS Hub
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-xl md:text-2xl text-gray-600 mb-4 font-medium"
            >
              Your School. Connected.
            </motion.p>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto"
            >
              From timetables to assignments, announcements to live classes — everything in one app.
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <button className="group px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-emerald-500/25 flex items-center gap-3">
                <Download className="w-5 h-5" />
                Download App
              </button>
              <button className="group px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full font-semibold hover:bg-white transition-all duration-300 transform hover:scale-105 shadow-lg border border-gray-200 flex items-center gap-3">
                <Globe className="w-5 h-5" />
                Open Web Portal
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-4xl font-bold text-gray-800 mb-4"
            >
              Everything You Need
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-gray-600"
            >
              All school activities, simplified in one platform
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="group p-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-emerald-200"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Role-Based Access */}
      <section className="py-20 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-4xl font-bold text-gray-800 mb-4"
            >
              Made for Everyone
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-gray-600"
            >
              Different roles, tailored experiences
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8 mb-12"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center p-8 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Students 🎓</h3>
              <p className="text-gray-600">Access timetables, results, resources</p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="text-center p-8 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Teachers 👩‍🏫</h3>
              <p className="text-gray-600">Upload assignments, grades, announcements</p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="text-center p-8 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Admins 🏫</h3>
              <p className="text-gray-600">Manage dashboards, events, school-wide data</p>
            </motion.div>
          </motion.div>
          
          <motion.div 
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="inline-flex bg-white rounded-full p-2 shadow-lg mb-6">
              {['student', 'teacher', 'admin'].map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveLogin(role)}
                  className={`px-6 py-3 rounded-full font-semibold capitalize transition-all duration-300 ${
                    activeLogin === role
                      ? 'bg-gradient-to-r from-emerald-500 to-purple-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            <div className="block">
              <button className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105">
                Login as {activeLogin.charAt(0).toUpperCase() + activeLogin.slice(1)} →
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Premium Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-4xl font-bold text-gray-800 mb-4"
            >
              Keep Learning Beyond 3 Months
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-gray-600"
            >
              Choose the plan that works for your school
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="grid lg:grid-cols-3 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {/* Free Trial */}
            <motion.div variants={fadeInUp} className="p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg border border-gray-200">
              <div className="text-center">
                <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Free Trial</h3>
                <p className="text-gray-600 mb-6">Perfect for getting started</p>
                <div className="text-3xl font-bold text-gray-800 mb-6">3 Months<span className="text-lg font-normal"> FREE</span></div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>All core features</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>Guild of Scholars access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>No credit card required</span>
                  </li>
                </ul>
                <button className="w-full py-3 bg-gray-200 text-gray-700 rounded-full font-semibold">
                  Currently Active
                </button>
              </div>
            </motion.div>
            
            {/* Standard Premium */}
            <motion.div variants={fadeInUp} className="p-8 bg-gradient-to-br from-emerald-50 to-white rounded-2xl shadow-lg border-2 border-emerald-200 transform scale-105">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Standard Premium</h3>
                <p className="text-gray-600 mb-6">For individual users</p>
                <div className="text-3xl font-bold text-emerald-600 mb-6">₦300<span className="text-lg font-normal">/month</span></div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>Continue after free trial</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>All features included</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>Very affordable pricing</span>
                  </li>
                </ul>
                <button className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300">
                  Choose Standard
                </button>
              </div>
            </motion.div>
            
            {/* School-Wide Premium */}
            <motion.div variants={fadeInUp} className="p-8 bg-gradient-to-br from-purple-50 via-yellow-50 to-white rounded-2xl shadow-lg border-2 border-yellow-300 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Crown className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">School-Wide Premium</h3>
                <p className="text-gray-600 mb-6">For school management</p>
                <div className="text-3xl font-bold text-purple-600 mb-6">Custom<span className="text-lg font-normal"> pricing</span></div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Unlock premium for entire school</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>No individual payments needed</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Head admin pays once</span>
                  </li>
                </ul>
                <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-yellow-500 text-white rounded-full font-semibold hover:from-purple-600 hover:to-yellow-600 transition-all duration-300">
                  Contact for Pricing 👑
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div 
            className="grid md:grid-cols-2 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="p-8 bg-white rounded-2xl shadow-lg text-center"
              >
                <p className="text-lg text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <p className="text-gray-500 font-semibold">— {testimonial.author}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Download CTA */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-4xl font-bold text-white mb-6"
            >
              Ready to Get Started?
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-emerald-100 mb-10"
            >
              Join UPSS Hub today and transform your school experience
            </motion.p>
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <button className="px-8 py-4 bg-white text-emerald-600 rounded-full font-semibold hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-3">
                <Download className="w-5 h-5" />
                Get the App
              </button>
              <button className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-full font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 border border-white/30 flex items-center gap-3">
                <Globe className="w-5 h-5" />
                Use on Web
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent mb-4">
              UPSS Hub
            </h3>
            <p className="text-lg text-gray-300 mb-6">Knowledge and Virtue</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-gray-400">
              <span>Contact & Support</span>
              <span className="hidden sm:block">•</span>
              <span>Version 1.0.0</span>
              <span className="hidden sm:block">•</span>
              <span>© 2024 UPSS Hub</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};


export default UPSSHubLanding;