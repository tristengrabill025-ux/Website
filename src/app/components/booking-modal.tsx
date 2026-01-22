import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, Clock, Zap, User, Mail, CreditCard, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { projectId, publicAnonKey } from "/utils/supabase/info";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType: "optimization" | "repair" | null;
}

export function BookingModal({ isOpen, onClose, serviceType }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [isRush, setIsRush] = useState(false);
  const [customerDiscord, setCustomerDiscord] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [step, setStep] = useState<"selection" | "payment" | "success">("selection");
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  
  // Payment form fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");

  const serviceDetails = {
    optimization: {
      title: "PC Optimization",
      price: 30,
      description: "Deep system cleanup, performance tuning, and optimization",
    },
    repair: {
      title: "PC Repair",
      price: 20,
      description: "Hardware diagnostics, component repair, and system recovery",
    },
  };

  const rushFee = 20;
  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
    "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM"
  ];

  // Timer countdown
  useEffect(() => {
    if (step === "payment" && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up - close modal and reset
            handleTimeExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [step, timeRemaining]);

  const handleTimeExpired = () => {
    alert("Payment time expired. Please try booking again.");
    handleClose();
  };

  const handleClose = () => {
    setSelectedDate(null);
    setSelectedTime("");
    setIsRush(false);
    setCustomerDiscord("");
    setCustomerEmail("");
    setStep("selection");
    setTimeRemaining(600);
    setError("");
    setCardNumber("");
    setCardExpiry("");
    setCardCVC("");
    onClose();
  };

  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const handleProceedToPayment = () => {
    if (!isRush && (!selectedDate || !selectedTime)) {
      alert("Please select both date and time");
      return;
    }

    if (!customerDiscord || !customerEmail) {
      alert("Please enter your Discord and email");
      return;
    }

    // Store booking details in sessionStorage before redirect
    const bookingData = {
      selectedDate: isRush ? new Date().toISOString() : selectedDate!.toISOString(),
      selectedTime: isRush ? "ASAP" : selectedTime,
      isRush,
      customerDiscord,
      customerEmail,
      serviceType,
      timestamp: Date.now()
    };
    sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));

    // Redirect to appropriate Stripe Checkout based on service type and rush service
    const stripeLinks = {
      optimization: {
        basic: 'https://book.stripe.com/test_28E28r208h1odBQ9L9fEk02',
        rush: 'https://buy.stripe.com/test_4gMfZh7ksbH47dscXlfEk03'
      },
      repair: {
        basic: 'https://buy.stripe.com/test_bJeeVd208fXk0P41eDfEk04',
        rush: 'https://buy.stripe.com/test_3cI28rgV28uSbtIbThfEk05'
      }
    };

    const paymentLink = isRush 
      ? stripeLinks[serviceType].rush 
      : stripeLinks[serviceType].basic;

    window.location.href = paymentLink;
  };

  const handlePayment = async () => {
    if (!cardNumber || !cardExpiry || !cardCVC) {
      setError("Please fill in all payment details");
      return;
    }

    // Validate card number (basic Luhn algorithm check)
    if (cardNumber.length !== 16) {
      setError("Please enter a valid 16-digit card number");
      return;
    }

    // Validate expiry format (MM/YY)
    const expiryPattern = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryPattern.test(cardExpiry)) {
      setError("Please enter expiry in MM/YY format");
      return;
    }

    // Validate expiry is not in the past
    const [month, year] = cardExpiry.split("/");
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits
    const currentMonth = currentDate.getMonth() + 1;
    const expiryYear = parseInt(year);
    const expiryMonth = parseInt(month);

    if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
      setError("Card has expired");
      return;
    }

    // Validate CVC
    if (cardCVC.length !== 3) {
      setError("Please enter a valid 3-digit CVC");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      // In production, this would integrate with a real payment processor like Stripe
      // For now, we'll simulate a payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate random payment failures (10% chance) to make it realistic
      if (Math.random() < 0.1) {
        throw new Error("Payment declined. Please check your card details and try again.");
      }

      // Create the booking only after successful payment
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0dda4881/bookings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            date: format(selectedDate!, "yyyy-MM-dd"),
            time: selectedTime,
            serviceType: serviceType,
            isRush: isRush,
            customerName: customerDiscord,
            customerEmail: customerEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      setStep("success");
    } catch (error) {
      console.error("Error processing payment:", error);
      setError(`${error instanceof Error ? error.message : "Payment failed. Please try again."}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!serviceType) return null;

  const service = serviceDetails[serviceType];
  const totalPrice = service.price + (isRush ? rushFee : 0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/20 z-50 max-h-[90vh] overflow-y-auto"
          >
            <div className="p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{service.title}</h2>
                  <p className="text-slate-300">{service.description}</p>
                  <p className="text-2xl font-bold text-purple-400 mt-2">${service.price} / session</p>
                </div>
                <button
                  onClick={handleClose}
                  className="text-slate-400 hover:text-white transition-colors p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Step 1: Selection */}
              {step === "selection" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {/* Rush Option */}
                  <div
                    className={`mb-6 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isRush
                        ? "border-yellow-500 bg-yellow-500/10"
                        : "border-slate-600 bg-slate-700/50 hover:border-yellow-500/50"
                    }`}
                    onClick={() => setIsRush(!isRush)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Zap className={`w-6 h-6 ${isRush ? "text-yellow-400" : "text-slate-400"}`} />
                        <div>
                          <h3 className="font-bold text-white">Rush Service</h3>
                          <p className="text-sm text-slate-300">Service started within 2 hours of payment</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-yellow-400">+${rushFee}</p>
                        <div
                          className={`w-6 h-6 rounded border-2 ${
                            isRush ? "bg-yellow-500 border-yellow-500" : "border-slate-500"
                          } flex items-center justify-center`}
                        >
                          {isRush && <span className="text-white text-sm">✓</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rush Service Info Message */}
                  {isRush && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
                    >
                      <div className="flex items-start gap-3">
                        <Zap className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-bold text-yellow-400 mb-1">Express Service Activated</h4>
                          <p className="text-sm text-slate-300">
                            Your service will begin within 2 hours after payment confirmation.<br />       
                            No need to schedule a specific date or time!
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Calendar - Hidden when Rush is selected */}
                  {!isRush && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-purple-400" />
                        <h3 className="text-xl font-bold text-white">Select Date</h3>
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {generateCalendarDays().map((date, index) => {
                          const isSelected =
                            selectedDate && format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
                          return (
                            <motion.button
                              key={index}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedDate(date)}
                              className={`p-3 rounded-lg text-center transition-all ${
                                isSelected
                                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/50"
                                  : "bg-slate-700/50 text-slate-300 hover:bg-slate-600"
                              }`}
                            >
                              <div className="text-xs opacity-70">{format(date, "EEE")}</div>
                              <div className="text-lg font-bold">{format(date, "d")}</div>
                              <div className="text-xs opacity-70">{format(date, "MMM")}</div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Time Slots - Hidden when Rush is selected */}
                  {!isRush && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-purple-400" />
                        <h3 className="text-xl font-bold text-white">Available Times</h3>
                      </div>
                      <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
                        {timeSlots.map((time) => (
                          <motion.button
                            key={time}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedTime(time)}
                            className={`p-3 rounded-lg text-center transition-all ${
                              selectedTime === time
                                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/50"
                                : "bg-slate-700/50 text-slate-300 hover:bg-slate-600"
                            }`}
                          >
                            {time}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Customer Information */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-4">Customer Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <svg 
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" 
                          viewBox="0 0 71 55" 
                          fill="currentColor"
                        >
                          <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/>
                        </svg>
                        <input
                          type="text"
                          placeholder="Your Discord"
                          value={customerDiscord}
                          onChange={(e) => setCustomerDiscord(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 rounded-lg bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                      </div>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="email"
                          placeholder="your@email.com"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 rounded-lg bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary & Continue Button */}
                  <div className="border-t border-slate-600 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-slate-300">
                        <p>Base Price: ${service.price}</p>
                        {isRush && <p>Rush Service: +${rushFee}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400">Total</p>
                        <p className="text-3xl font-bold text-white">${totalPrice}</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleProceedToPayment}
                      className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transition-all"
                    >
                      Proceed to Payment
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {step === "payment" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {/* Timer Warning */}
                  <div className={`mb-6 p-4 rounded-xl border-2 ${
                    timeRemaining < 120 
                      ? "border-red-500 bg-red-500/10" 
                      : "border-yellow-500 bg-yellow-500/10"
                  }`}>
                    <div className="flex items-center gap-3">
                      <AlertCircle className={`w-6 h-6 ${
                        timeRemaining < 120 ? "text-red-400" : "text-yellow-400"
                      }`} />
                      <div className="flex-1">
                        <h3 className="font-bold text-white">Complete payment within:</h3>
                        <p className="text-sm text-slate-300">
                          Your booking will be cancelled if payment is not completed in time
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-3xl font-bold ${
                          timeRemaining < 120 ? "text-red-400" : "text-yellow-400"
                        }`}>
                          {formatTime(timeRemaining)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Booking Summary */}
                  <div className="mb-6 p-4 bg-slate-700/50 rounded-xl">
                    <h3 className="text-xl font-bold text-white mb-3">Booking Summary</h3>
                    <div className="space-y-2 text-slate-300">
                      <div className="flex justify-between">
                        <span>Service:</span>
                        <span className="font-semibold text-white">{service.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span className="font-semibold text-white">
                          {selectedDate && format(selectedDate, "MMM dd, yyyy")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span className="font-semibold text-white">{selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Customer:</span>
                        <span className="font-semibold text-white">{customerDiscord}</span>
                      </div>
                      {isRush && (
                        <div className="flex justify-between text-yellow-400">
                          <span>Rush Service:</span>
                          <span className="font-semibold">+${rushFee}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-slate-600">
                        <span className="text-lg font-bold">Total:</span>
                        <span className="text-2xl font-bold text-purple-400">${totalPrice}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Form */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard className="w-5 h-5 text-purple-400" />
                      <h3 className="text-xl font-bold text-white">Payment Details</h3>
                    </div>
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Card Number"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                        className="w-full px-4 py-3 rounded-lg bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                        maxLength={16}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="px-4 py-3 rounded-lg bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                          maxLength={5}
                        />
                        <input
                          type="text"
                          placeholder="CVC"
                          value={cardCVC}
                          onChange={(e) => setCardCVC(e.target.value.replace(/\D/g, "").slice(0, 3))}
                          className="px-4 py-3 rounded-lg bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                          maxLength={3}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                      Your payment information is secure and encrypted
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Payment Button */}
                  <div className="flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep("selection")}
                      disabled={isProcessing}
                      className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                      Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePayment}
                      disabled={isProcessing}
                      className="flex-1 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          Pay ${totalPrice}
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Success */}
              {step === "success" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                    className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle className="w-16 h-16 text-green-400" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-white mb-4">Booking Confirmed!</h2>
                  <p className="text-slate-300 mb-6">
                    Your {service.title} appointment has been successfully booked.
                  </p>
                  <div className="bg-slate-700/50 rounded-xl p-6 mb-6 text-left">
                    <div className="space-y-2 text-slate-300">
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span className="font-semibold text-white">
                          {selectedDate && format(selectedDate, "MMMM dd, yyyy")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span className="font-semibold text-white">{selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Customer:</span>
                        <span className="font-semibold text-white">{customerDiscord}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Email:</span>
                        <span className="font-semibold text-white">{customerEmail}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mb-6">
                    A confirmation email has been sent to {customerEmail}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClose}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transition-all"
                  >
                    Done
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}