import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store";

export default function LockScreen() {
  const { hasPin, setupPin, unlock, error, clearError, isLoading } = useAuthStore();
  const [pin, setPin] = useState(["", "", "", ""]);
  const [showPin, setShowPin] = useState(false);
  const [confirmPin, setConfirmPin] = useState<string[] | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isSetup = !hasPin;
  const isConfirming = isSetup && confirmPin !== null;

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    // Clear error when PIN changes
    if (error) clearError();
  }, [pin]);

  const handlePinChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if PIN is complete
    if (index === 3 && value) {
      const fullPin = newPin.join("");
      handleSubmit(fullPin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (fullPin: string) => {
    if (isSetup) {
      if (!confirmPin) {
        // First entry - save and ask to confirm
        setConfirmPin(pin);
        setPin(["", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        // Confirming - check match
        if (fullPin === confirmPin.join("")) {
          await setupPin(fullPin);
        } else {
          setConfirmPin(null);
          setPin(["", "", "", ""]);
          setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
      }
    } else {
      // Unlocking
      const success = await unlock(fullPin);
      if (!success) {
        setPin(["", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    }
  };

  const resetSetup = () => {
    setConfirmPin(null);
    setPin(["", "", "", ""]);
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center"
          >
            <Shield className="w-10 h-10 text-primary-600" />
          </motion.div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isSetup
              ? isConfirming
                ? "Confirm Your PIN"
                : "Create Your PIN"
              : "Welcome Back"}
          </h1>
          <p className="text-gray-500 text-sm">
            {isSetup
              ? isConfirming
                ? "Enter the same PIN again to confirm"
                : "Set a 4-digit PIN to secure your data"
              : "Enter your PIN to unlock the app"}
          </p>
        </div>

        {/* PIN Input */}
        <div className="flex justify-center gap-3 mb-6">
          {pin.map((digit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <input
                ref={(el) => (inputRefs.current[index] = el)}
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`pin-input ${digit ? "pin-input-filled" : ""}`}
                disabled={isLoading}
              />
            </motion.div>
          ))}
        </div>

        {/* Show/Hide PIN */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setShowPin(!showPin)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPin ? "Hide PIN" : "Show PIN"}
          </button>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm text-center">
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirm mismatch message */}
        <AnimatePresence>
          {isSetup && confirmPin && pin.every((d) => d === "") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <button
                onClick={resetSetup}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Start over
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center">
            <div className="spinner" />
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Your data is encrypted locally on this device
        </div>
      </motion.div>
    </div>
  );
}
