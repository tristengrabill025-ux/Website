import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User, Mail, Clock, Zap } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from "date-fns";
import { projectId, publicAnonKey } from "/utils/supabase/info";

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

interface BookingsCalendarProps {
  accessToken: string;
}

export function BookingsCalendar({ accessToken }: BookingsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
      const bookingsList = Array.isArray(data.bookings) ? data.bookings : [];
      setBookings(bookingsList);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getBookingsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return bookings.filter((booking) => booking.date === dateStr);
  };

  const selectedDateBookings = selectedDate ? getBookingsForDate(selectedDate) : [];

  const serviceDetails = {
    optimization: { title: "PC Optimization", price: 99, color: "purple" },
    repair: { title: "PC Repair", price: 149, color: "blue" },
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white">Bookings Calendar</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xl font-semibold text-white min-w-[200px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center font-semibold text-slate-400 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {daysInMonth.map((day) => {
          const dayBookings = getBookingsForDate(day);
          const isSelected = selectedDate && format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <motion.button
              key={day.toString()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedDate(day)}
              className={`
                relative min-h-[100px] p-3 rounded-lg border-2 transition-all
                ${isSelected ? "border-purple-500 bg-purple-500/20" : "border-slate-600 bg-slate-700/50"}
                ${!isCurrentMonth && "opacity-50"}
                ${isToday(day) && "ring-2 ring-yellow-400"}
              `}
            >
              <div className="text-left">
                <span className={`text-lg font-bold ${isToday(day) ? "text-yellow-400" : "text-white"}`}>
                  {format(day, "d")}
                </span>
              </div>
              {dayBookings.length > 0 && (
                <div className="mt-2 space-y-1">
                  {dayBookings.slice(0, 3).map((booking, idx) => {
                    const service = serviceDetails[booking.serviceType as keyof typeof serviceDetails];
                    return (
                      <div
                        key={idx}
                        className={`text-xs px-2 py-1 rounded bg-${service.color}-500/30 text-${service.color}-300 truncate`}
                      >
                        {booking.time}
                      </div>
                    );
                  })}
                  {dayBookings.length > 3 && (
                    <div className="text-xs text-slate-400">+{dayBookings.length - 3} more</div>
                  )}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-white mb-4">
            Bookings for {format(selectedDate, "MMMM dd, yyyy")}
          </h3>
          {selectedDateBookings.length === 0 ? (
            <p className="text-slate-400">No bookings for this date</p>
          ) : (
            <div className="grid gap-4">
              {selectedDateBookings.map((booking) => {
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
                          <h4 className="text-xl font-bold text-white">{service.title}</h4>
                          {booking.isRush && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 border border-yellow-500 rounded text-yellow-400 text-sm">
                              <Zap className="w-4 h-4" />
                              Rush
                            </span>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
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
                          <div className="text-2xl font-bold text-purple-400">${total}</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}