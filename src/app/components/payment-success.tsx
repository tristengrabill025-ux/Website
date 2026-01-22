import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CheckCircle, Calendar, Clock, User, Mail, Home } from "lucide-react";
import { format } from "date-fns";
import { projectId, publicAnonKey } from "/utils/supabase/info";

export function PaymentSuccess() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState("");
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Get pending booking from sessionStorage
        const pendingBookingStr = sessionStorage.getItem('pendingBooking');
        
        if (!pendingBookingStr) {
          setError("No pending booking found");
          setIsProcessing(false);
          return;
        }

        const bookingData = JSON.parse(pendingBookingStr);
        
        // Check if booking is still within 10-minute window
        const timeElapsed = Date.now() - bookingData.timestamp;
        const tenMinutesInMs = 10 * 60 * 1000;
        
        if (timeElapsed > tenMinutesInMs) {
          setError("Booking session expired. Please try again.");
          sessionStorage.removeItem('pendingBooking');
          setIsProcessing(false);
          return;
        }

        // Create the booking
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-0dda4881/bookings`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              date: format(new Date(bookingData.selectedDate), "yyyy-MM-dd"),
              time: bookingData.selectedTime,
              serviceType: bookingData.serviceType,
              isRush: bookingData.isRush,
              customerDiscord: bookingData.customerDiscord,
              customerEmail: bookingData.customerEmail,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create booking");
        }

        // Clear pending booking
        sessionStorage.removeItem('pendingBooking');
        
        // Save booking details for display
        setBookingDetails(bookingData);
        setIsProcessing(false);
      } catch (err) {
        console.error("Error creating booking:", err);
        setError(err instanceof Error ? err.message : "Failed to create booking");
        setIsProcessing(false);
      }
    };

    processPayment();
  }, []);

  const serviceDetails: any = {
    optimization: {
      title: "PC Optimization",
      price: 99,
    },
    repair: {
      title: "PC Repair",
      price: 149,
    },
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-xl">Processing your booking...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-red-500/20 p-8 text-center"
        >
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-16 h-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Booking Failed</h2>
          <p className="text-red-400 mb-6">{error}</p>
          <motion.a
            href="/"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            <Home className="w-5 h-5" />
            Return Home
          </motion.a>
        </motion.div>
      </div>
    );
  }

  if (!bookingDetails) {
    return null;
  }

  const service = serviceDetails[bookingDetails.serviceType];
  const totalPrice = service.price + (bookingDetails.isRush ? 50 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/20 p-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
          className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-16 h-16 text-green-400" />
        </motion.div>

        <h1 className="text-4xl font-bold text-white text-center mb-4">
          Payment Successful!
        </h1>
        <p className="text-slate-300 text-center mb-8">
          Your booking has been confirmed. We've sent a confirmation email to{" "}
          <span className="text-purple-400 font-semibold">{bookingDetails.customerEmail}</span>
        </p>

        <div className="bg-slate-700/50 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Booking Details</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Date</p>
                <p className="text-white font-semibold">
                  {format(new Date(bookingDetails.selectedDate), "MMMM dd, yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Time</p>
                <p className="text-white font-semibold">{bookingDetails.selectedTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Service</p>
                <p className="text-white font-semibold">{service.title}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Contact</p>
                <p className="text-white font-semibold">{bookingDetails.customerDiscord}</p>
                <p className="text-slate-400 text-sm">{bookingDetails.customerEmail}</p>
              </div>
            </div>

            {bookingDetails.isRush && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500 rounded-lg">
                <p className="text-yellow-400 font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                  </svg>
                  Rush Service - Completed within 2 hours
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-600">
              <div className="flex justify-between items-center">
                <span className="text-lg text-slate-300">Total Paid</span>
                <span className="text-3xl font-bold text-purple-400">${totalPrice}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <motion.a
            href="/"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 text-center px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            Return Home
          </motion.a>
        </div>

        <p className="text-sm text-slate-400 text-center mt-6">
          Need help? Contact us at support@techfixpro.com
        </p>
      </motion.div>
    </div>
  );
}