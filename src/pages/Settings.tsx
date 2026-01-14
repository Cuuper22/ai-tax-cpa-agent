import { useState } from "react";
import { motion } from "framer-motion";
import { Key, Lock, Shield, Eye, EyeOff, Check } from "lucide-react";
import { auth } from "@/lib/tauri";
import { useSettingsStore, useAuthStore } from "@/store";

export default function Settings() {
  const { hasApiKey, saveApiKey } = useSettingsStore();
  const { lock } = useAuthStore();
  
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState(false);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    
    setIsSavingKey(true);
    try {
      await saveApiKey(apiKey);
      setKeySaved(true);
      setApiKey("");
      setTimeout(() => setKeySaved(false), 3000);
    } catch (error) {
      console.error("Failed to save API key:", error);
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleChangePin = async () => {
    setPinError(null);
    setPinSuccess(false);
    
    if (newPin.length < 4) {
      setPinError("PIN must be at least 4 characters");
      return;
    }
    
    if (newPin !== confirmPin) {
      setPinError("PINs do not match");
      return;
    }
    
    setIsChangingPin(true);
    try {
      await auth.changePin(currentPin, newPin);
      setPinSuccess(true);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setTimeout(() => setPinSuccess(false), 3000);
    } catch (error) {
      setPinError(String(error));
    } finally {
      setIsChangingPin(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your app preferences and security</p>
      </div>

      {/* API Key Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Key className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Anthropic API Key</h2>
            <p className="text-sm text-gray-500">Required for AI assistant features</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">API Key</label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={hasApiKey ? "••••••••••••••••" : "sk-ant-..."}
                className="input pr-10"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="helper-text">
              Get your API key from{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                console.anthropic.com
              </a>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveApiKey}
              disabled={!apiKey.trim() || isSavingKey}
              className="btn btn-primary"
            >
              {isSavingKey ? (
                <div className="spinner spinner-sm" />
              ) : keySaved ? (
                <>
                  <Check className="w-5 h-5" />
                  Saved!
                </>
              ) : (
                "Save API Key"
              )}
            </button>
            {hasApiKey && !keySaved && (
              <span className="text-sm text-success-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                API key configured
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Change PIN Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-warning-100 rounded-lg">
            <Lock className="w-5 h-5 text-warning-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Change PIN</h2>
            <p className="text-sm text-gray-500">Update your app unlock PIN</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Current PIN</label>
            <input
              type="password"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              placeholder="••••"
              maxLength={6}
              className="input max-w-[200px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">New PIN</label>
              <input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="••••"
                maxLength={6}
                className="input"
              />
            </div>
            <div>
              <label className="label">Confirm New PIN</label>
              <input
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="••••"
                maxLength={6}
                className="input"
              />
            </div>
          </div>

          {pinError && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm">
              {pinError}
            </div>
          )}

          {pinSuccess && (
            <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <Check className="w-4 h-4" />
              PIN changed successfully
            </div>
          )}

          <button
            onClick={handleChangePin}
            disabled={!currentPin || !newPin || !confirmPin || isChangingPin}
            className="btn btn-secondary"
          >
            {isChangingPin ? <div className="spinner spinner-sm" /> : "Change PIN"}
          </button>
        </div>
      </motion.div>

      {/* Security Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-success-100 rounded-lg">
            <Shield className="w-5 h-5 text-success-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
            <p className="text-sm text-gray-500">Your data protection status</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600">Database Encryption</span>
            <span className="badge badge-success">AES-256 (SQLCipher)</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600">Key Derivation</span>
            <span className="badge badge-success">Argon2id</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600">Data Storage</span>
            <span className="badge badge-success">Local Only</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600">API Key Storage</span>
            <span className="badge badge-success">Encrypted</span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <button onClick={() => lock()} className="btn btn-danger">
            <Lock className="w-5 h-5" />
            Lock App Now
          </button>
        </div>
      </motion.div>

      {/* About */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>AI Tax CPA</strong> v1.0.0</p>
          <p>Personal AI-powered tax assistant with local-first architecture.</p>
          <p className="text-gray-400 mt-4">
            Built with Tauri, React, and Claude AI. Your data never leaves your device.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
