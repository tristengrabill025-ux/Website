import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Monitor,
  Wrench,
  CheckCircle,
  Clock,
  Shield,
  Zap,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { AnimatedBackgroundOcean } from "@/app/components/animated-background-ocean";
import { BookingModal } from "@/app/components/booking-modal";
import { AdminPanel } from "@/app/components/admin-panel";
import { LoginModal } from "@/app/components/login-modal";
import * as auth from "@/utils/auth";
import type { AuthUser } from "@/utils/auth";

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<
    "optimization" | "repair" | null
  >(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginMode, setLoginMode] = useState<"login" | "signup">("login");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showNotification, setShowNotification] = useState(true);

  // Check if user has previously closed the notification
  useEffect(() => {
    const notificationClosed = localStorage.getItem("notification-closed");
    if (notificationClosed === "true") {
      setShowNotification(false);
    }
  }, []);

  const handleCloseNotification = () => {
    setShowNotification(false);
    localStorage.setItem("notification-closed", "true");
  };

  const handleBookService = (
    serviceType: "optimization" | "repair",
  ) => {
    setSelectedService(serviceType);
    setIsModalOpen(true);
  };

  const handleLogin = async (
    email: string,
    password: string,
  ) => {
    const loggedInUser = await auth.signIn(email, password);
    setUser(loggedInUser);
  };

  const handleSignup = async (
    email: string,
    password: string,
    name: string,
  ) => {
    const newUser = await auth.signUp(email, password, name);
    setUser(newUser);
  };

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
    setShowAdmin(false);
  };

  const handleAdminClick = () => {
    if (user) {
      setShowAdmin(true);
    } else {
      setShowLogin(true);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    auth.getSession().then((session) => {
      if (session) {
        setUser(session);
      }
    });
  }, []);

  const features = [
    {
      icon: Clock,
      title: "Fast Turnaround",
      description: "Get your PC back up and running in no time",
    },
    {
      icon: Shield,
      title: "Certified Experts",
      description:
        "Professional technicians with years of experience",
    },
    {
      icon: CheckCircle,
      title: "Satisfaction Guaranteed",
      description: "100% money-back guarantee on all services",
    },
  ];

  return (
    <div className="min-h-screen text-white">
      <AnimatedBackgroundOcean />

      {/* Notification Bar */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
            className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-lg"
          >
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex-1 text-center">
                <p className="text-sm md:text-base font-medium">
                  Discount codes available{" "}
                  <a
                    href="https://discord.gg/tNJZQ2QTzR"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-bold hover:text-cyan-200 transition-colors"
                  >
                    HERE
                  </a>
                </p>
              </div>
              <button
                onClick={handleCloseNotification}
                className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Close notification"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className={`fixed left-0 right-0 z-40 transition-all duration-300 ${showNotification ? 'top-[52px]' : 'top-0'}`}>
        <div className="container mx-auto px-4 py-6">
          <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
            className="relative bg-slate-800/30 backdrop-blur-2xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden"
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 via-teal-600/10 to-sky-600/10 animate-gradient-x" />
            
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-sky-500/20 blur-xl opacity-50" />
            
            <div className="relative flex items-center justify-between px-8 py-4">
              {/* Logo */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <motion.div
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-cyan-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                  <Monitor className="w-10 h-10 text-cyan-400 relative z-10" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-teal-400 to-sky-400 bg-clip-text text-transparent">
                    TechFix Pro
                  </h1>
                  <p className="text-xs text-slate-400">Premium PC Services</p>
                </div>
              </motion.div>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-8">
                {["Services", "About"].map((item, index) => (
                  <motion.a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="relative text-slate-300 hover:text-white transition-colors group"
                  >
                    <span className="relative z-10">{item}</span>
                    <motion.div
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-sky-400 origin-left"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.a>
                ))}
                
                {/* Discord Button */}
                <motion.a
                  href="https://discord.gg/tNJZQ2QTzR"
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="relative ml-4 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] rounded-lg transition-all group flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5 text-white"
                    viewBox="0 0 71 55"
                    fill="currentColor"
                  >
                    <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/>
                  </svg>
                  <span className="text-white font-semibold">Discord</span>
                </motion.a>
              </div>
              
              {/* Auth Buttons */}
              <div className="flex items-center gap-3">
                {user ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="relative px-4 py-2 bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-xl border border-slate-600/50 backdrop-blur-xl"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-sky-600/20 rounded-xl opacity-0 hover:opacity-100 transition-opacity" />
                      <div className="relative flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-slate-200 font-medium">Hi, {user.name}</span>
                      </div>
                    </motion.div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLogout}
                      className="relative px-4 py-2 bg-gradient-to-r from-red-600/20 to-red-700/20 hover:from-red-600/30 hover:to-red-700/30 rounded-xl border border-red-500/30 text-white flex items-center gap-2 backdrop-blur-xl group overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 to-red-600/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
                      <LogOut className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">Logout</span>
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex gap-3"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setLoginMode("login");
                        setShowLogin(true);
                      }}
                      className="relative px-6 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl text-white font-medium backdrop-blur-xl border border-slate-600/50 group overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 to-blue-600/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
                      <span className="relative z-10">Login</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setLoginMode("signup");
                        setShowLogin(true);
                      }}
                      className="relative px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl text-white font-bold shadow-lg shadow-purple-500/30 group overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
                      <span className="relative z-10 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Sign Up
                      </span>
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`relative z-10 container mx-auto px-4 text-center transition-all duration-300 ${showNotification ? 'pt-[240px]' : 'pt-[188px]'} py-20`}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Expert PC Services
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto">
            Professional PC optimization and repair services.
            Get your computer running like new with our expert
            technicians.
          </p>
        </motion.div>

        {/* Service Cards */}
        <div
          id="services"
          className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-16"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.03 }}
            className="relative bg-gradient-to-br from-slate-800/80 to-purple-900/50 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/30 shadow-2xl overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="bg-purple-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Monitor className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-3xl font-bold mb-3">
                PC Optimization
              </h3>
              <p className="text-slate-300 mb-6">
                Deep system cleanup, performance tuning,
                software updates, and optimization to maximize
                your PC's speed and efficiency.
              </p>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-4xl font-bold text-purple-400">
                  $30
                </span>
                <span className="text-slate-400">
                  / session
                </span>
              </div>
              <ul className="space-y-2 mb-8 text-left">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-slate-300">
                    System cleanup & optimization
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-slate-300">
                    Malware & virus removal
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-slate-300">
                    Performance benchmarking
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-slate-300">
                    Software updates & patches
                  </span>
                </li>
              </ul>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  handleBookService("optimization")
                }
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-xl font-bold shadow-lg transition-all"
              >
                Book Optimization
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.03 }}
            className="relative bg-gradient-to-br from-slate-800/80 to-blue-900/50 backdrop-blur-xl rounded-2xl p-8 border border-blue-500/30 shadow-2xl overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Wrench className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-3xl font-bold mb-3">
                PC Repair
              </h3>
              <p className="text-slate-300 mb-6">
                Complete hardware diagnostics, component
                replacement, system recovery, and comprehensive
                troubleshooting services.
              </p>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-4xl font-bold text-blue-400">
                  $20
                </span>
                <span className="text-slate-400">
                  / session
                </span>
              </div>
              <ul className="space-y-2 mb-8 text-left">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-slate-300">
                    Hardware diagnostics
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-slate-300">
                    Component repair/replacement
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-slate-300">
                    System recovery & backup
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-slate-300">
                    Advanced troubleshooting
                  </span>
                </li>
              </ul>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleBookService("repair")}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-xl font-bold shadow-lg transition-all"
              >
                Book Repair
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Rush Service Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto mt-12 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30"
        >
          <div className="flex items-center justify-center gap-3">
            <Zap className="w-8 h-8 text-yellow-400" />
            <div className="text-center">
              <h4 className="text-xl font-bold text-yellow-400">
                Rush Service Available!
              </h4>
              <p className="text-slate-300">
                Need it done fast? Add rush service for just{" "}
                <span className="font-bold text-yellow-400">
                  +$20
                </span>{" "}
                and get your PC serviced within 2 hours after
                purchase
              </p>
            </div>
            <Zap className="w-8 h-8 text-yellow-400" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 text-center"
            >
              <div className="bg-purple-500/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto">
                <feature.icon className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-300">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        serviceType={selectedService}
      />

      {/* Admin Panel */}
      <AdminPanel
        isOpen={showAdmin}
        onClose={() => setShowAdmin(false)}
        accessToken={user?.accessToken || ""}
      />

      {/* Admin Toggle Button - Only show for admins */}
      {user && user.email && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAdmin(true)}
          className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white"
        >
          <Settings className="w-8 h-8" />
        </motion.button>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={handleLogin}
        onSignup={handleSignup}
        loginMode={loginMode}
        setLoginMode={setLoginMode}
      />
    </div>
  );
}