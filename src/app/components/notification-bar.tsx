import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

export function NotificationBar() {
  const [isVisible, setIsVisible] = useState(true);

  // Check if user previously dismissed the notification
  useEffect(() => {
    const dismissed = localStorage.getItem("notificationBarDismissed");
    if (dismissed === "true") {
      setIsVisible(false);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("notificationBarDismissed", "true");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg"
        >
          <div className="container mx-auto px-4 py-3 flex items-center justify-center relative">
            <p className="text-sm md:text-base font-medium text-center">
              Discount codes available{" "}
              <a
                href="https://discord.gg/tNJZQ2QTzR"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline hover:text-cyan-200 transition-colors"
              >
                HERE
              </a>
            </p>
            <button
              onClick={handleClose}
              className="absolute right-4 p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Close notification"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
