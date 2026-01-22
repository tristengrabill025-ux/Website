import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Clock, User, Mail, Zap, Trash2, X, UserPlus, CalendarDays, List } from "lucide-react";
import { format } from "date-fns";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { BookingsCalendar } from "./bookings-calendar";

interface Booking {
  id: string;
  serviceType: string;
  date: string;
  time: string;
  isRush: boolean;
  customerDiscord: string;
  customerEmail: string;
  createdAt: string;
}

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
}

export function AdminPanel({ isOpen, onClose, accessToken }: AdminPanelProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [createAdminError, setCreateAdminError] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [testBookingStatus, setTestBookingStatus] = useState<string>("");

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0dda4881/admin/bookings`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle case where bookings is an array or empty
      const bookingsList = Array.isArray(data.bookings) ? data.bookings : [];
      
      if (bookingsList.length > 0) {
        // Sort bookings by date and time
        const sortedBookings = bookingsList.sort(
          (a: Booking, b: Booking) =>
            new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime()
        );
        setBookings(sortedBookings);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0dda4881/admin/bookings/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        setBookings(bookings.filter((b) => b.id !== id));
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  const createAdmin = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0dda4881/admin/users`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: newAdminEmail,
            password: newAdminPassword,
            name: newAdminName,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        setCreateAdminError(data.error.message);
      } else {
        setCreateAdminError("");
        setShowCreateAdmin(false);
        setNewAdminEmail("");
        setNewAdminPassword("");
        setNewAdminName("");
      }
    } catch (error) {
      console.error("Error creating admin:", error);
      setCreateAdminError("An error occurred while creating the admin.");
    }
  };

  const createTestBooking = async () => {
    setTestBookingStatus("Creating test booking...");
    try {
      // Create a test booking with current date and time
      const testDate = format(new Date(), "yyyy-MM-dd");
      const testTime = format(new Date(), "HH:mm");
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0dda4881/bookings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            serviceType: "optimization",
            date: testDate,
            time: testTime,
            isRush: true,
            customerDiscord: "TestUser#1234",
            customerEmail: "test@example.com",
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Test booking error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (data.error) {
        setTestBookingStatus(`Error: ${data.error}`);
      } else {
        setTestBookingStatus("✅ Test booking created! Check your Discord for the notification!");
        // Refresh bookings to show the new test booking
        setTimeout(() => {
          fetchBookings();
          setTestBookingStatus("");
        }, 3000);
      }
    } catch (error) {
      console.error("Error creating test booking:", error);
      setTestBookingStatus(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBookings();
    }
  }, [isOpen]);

  const serviceDetails = {
    optimization: { title: "PC Optimization", price: 99 },
    repair: { title: "PC Repair", price: 149 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/20 z-50 max-h-[90vh] overflow-y-auto"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-white">Booking Management</h2>
                <div className="flex gap-3">
                  <div className="flex bg-slate-700 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("list")}
                      className={`px-3 py-1 rounded flex items-center gap-2 transition-colors ${
                        viewMode === "list" ? "bg-purple-600 text-white" : "text-slate-300"
                      }`}
                    >
                      <List className="w-4 h-4" />
                      List
                    </button>
                    <button
                      onClick={() => setViewMode("calendar")}
                      className={`px-3 py-1 rounded flex items-center gap-2 transition-colors ${
                        viewMode === "calendar" ? "bg-purple-600 text-white" : "text-slate-300"
                      }`}
                    >
                      <CalendarDays className="w-4 h-4" />
                      Calendar
                    </button>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={fetchBookings}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold"
                  >
                    Refresh
                  </motion.button>
                  <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-white transition-colors p-2"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {viewMode === "calendar" ? (
                <BookingsCalendar accessToken={accessToken} />
              ) : (
                <>
                  {isLoading ? (
                    <div className="text-center text-slate-300 py-12">Loading bookings...</div>
                  ) : bookings.length === 0 ? (
                    <div className="text-center text-slate-300 py-12">No bookings yet</div>
                  ) : (
                    <div className="grid gap-4">
                      {bookings.map((booking) => {
                        const service = serviceDetails[booking.serviceType as keyof typeof serviceDetails];
                        const total = service.price + (booking.isRush ? 50 : 0);

                        return (
                          <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-700/50 backdrop-blur-xl rounded-xl p-6 border border-slate-600/50"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <h3 className="text-xl font-bold text-white">{service.title}</h3>
                                  {booking.isRush && (
                                    <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 border border-yellow-500 rounded text-yellow-400 text-sm">
                                      <Zap className="w-4 h-4" />
                                      Rush
                                    </span>
                                  )}
                                  <span className="px-2 py-1 bg-green-500/20 border border-green-500 rounded text-green-400 text-sm">
                                    {booking.status}
                                  </span>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                  <div className="flex items-center gap-2 text-slate-300">
                                    <Calendar className="w-5 h-5 text-purple-400" />
                                    <span>{format(new Date(booking.date), "MMMM dd, yyyy")}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-300">
                                    <Clock className="w-5 h-5 text-purple-400" />
                                    <span>{booking.time}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-300">
                                    <User className="w-5 h-5 text-purple-400" />
                                    <span>{booking.customerDiscord}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-300">
                                    <Mail className="w-5 h-5 text-purple-400" />
                                    <span>{booking.customerEmail}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4">
                                  <span className="text-slate-400 text-sm">
                                    Booked: {format(new Date(booking.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                                  </span>
                                  <span className="text-2xl font-bold text-purple-400">${total}</span>
                                </div>
                              </div>

                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => deleteBooking(booking.id)}
                                className="text-red-400 hover:text-red-300 p-2"
                              >
                                <Trash2 className="w-5 h-5" />
                              </motion.button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              <div className="mt-8">
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    🧪 Test Discord Webhook
                  </h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Click the button below to create a test booking and verify your Discord webhook is working correctly. 
                    You should receive a notification in your Discord channel.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={createTestBooking}
                    disabled={testBookingStatus.includes("Creating")}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Zap className="w-5 h-5" />
                    Create Test Booking
                  </motion.button>
                  {testBookingStatus && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-3 p-3 rounded-lg ${
                        testBookingStatus.includes("✅") 
                          ? "bg-green-500/20 border border-green-500/50 text-green-300" 
                          : testBookingStatus.includes("❌")
                          ? "bg-red-500/20 border border-red-500/50 text-red-300"
                          : "bg-slate-700/50 border border-slate-600/50 text-slate-300"
                      }`}
                    >
                      {testBookingStatus}
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowCreateAdmin(!showCreateAdmin)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold"
                >
                  {showCreateAdmin ? "Cancel" : "Create Admin"}
                </button>
              </div>

              {showCreateAdmin && (
                <div className="mt-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-white">Name</label>
                    <input
                      type="text"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-slate-700/50 backdrop-blur-xl rounded-md border border-slate-600/50 text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-white">Email</label>
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-slate-700/50 backdrop-blur-xl rounded-md border border-slate-600/50 text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-white">Password</label>
                    <input
                      type="password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-slate-700/50 backdrop-blur-xl rounded-md border border-slate-600/50 text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  {createAdminError && (
                    <div className="text-red-400 text-sm mb-4">{createAdminError}</div>
                  )}
                  <button
                    onClick={createAdmin}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold"
                  >
                    Create Admin
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}