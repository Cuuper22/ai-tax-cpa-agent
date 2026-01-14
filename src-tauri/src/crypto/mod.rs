//! Cryptographic utilities for PIN-based encryption
//! 
//! Uses Argon2id for key derivation and AES-256 for database encryption via SQLCipher.

use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2, Algorithm, Params, Version,
};
use zeroize::{Zeroize, ZeroizeOnDrop};
use thiserror::Error;
use std::path::PathBuf;

#[cfg(windows)]
use keyring::Entry;

/// Key derivation parameters (OWASP recommended for Argon2id)
const ARGON2_MEMORY_KB: u32 = 64 * 1024; // 64 MB
const ARGON2_ITERATIONS: u32 = 3;
const ARGON2_PARALLELISM: u32 = 4;
const ARGON2_OUTPUT_LEN: usize = 32; // 256 bits for AES-256

/// Service name for OS keyring
const KEYRING_SERVICE: &str = "ai-tax-cpa";
const KEYRING_USER: &str = "pin-hash";

#[derive(Debug, Error)]
pub enum CryptoError {
    #[error("Failed to derive key: {0}")]
    KeyDerivation(String),
    
    #[error("Invalid PIN")]
    InvalidPin,
    
    #[error("No PIN configured")]
    NoPinConfigured,
    
    #[error("Keyring error: {0}")]
    Keyring(String),
    
    #[error("Crypto operation failed: {0}")]
    OperationFailed(String),
}

/// Derived encryption key with automatic zeroization
#[derive(Clone, Zeroize, ZeroizeOnDrop)]
pub struct DerivedKey {
    key: Vec<u8>,
}

impl DerivedKey {
    pub fn new(key: Vec<u8>) -> Self {
        Self { key }
    }
    
    /// Get the key as a hex string for SQLCipher
    pub fn as_hex(&self) -> String {
        hex::encode(&self.key)
    }
    
    /// Get the raw key bytes
    pub fn as_bytes(&self) -> &[u8] {
        &self.key
    }
}

/// Key manager for PIN-based encryption
/// 
/// Handles:
/// - PIN verification using Argon2id hashing
/// - Deriving encryption keys from PIN
/// - Secure storage of PIN hash in OS keyring
pub struct KeyManager {
    /// The derived database encryption key (only present when unlocked)
    db_key: Option<DerivedKey>,
    
    /// Salt used for key derivation (stored with PIN hash)
    salt: Option<SaltString>,
    
    /// Cached PIN hash for verification
    pin_hash: Option<String>,
    
    /// Data directory for fallback storage
    data_dir: Option<PathBuf>,
}

impl Default for KeyManager {
    fn default() -> Self {
        Self::new()
    }
}

impl KeyManager {
    pub fn new() -> Self {
        Self {
            db_key: None,
            salt: None,
            pin_hash: None,
            data_dir: None,
        }
    }
    
    /// Set the data directory for fallback storage
    pub fn set_data_dir(&mut self, path: PathBuf) {
        self.data_dir = Some(path);
    }
    
    /// Check if a PIN has been set up
    pub fn has_stored_key(&self) -> bool {
        // Try to load from keyring first
        if let Some(hash) = self.load_pin_hash() {
            return !hash.is_empty();
        }
        false
    }
    
    /// Setup encryption from a new PIN (first-time setup)
    pub fn setup_from_pin(&mut self, pin: &str) -> Result<(), CryptoError> {
        // Generate a random salt
        let salt = SaltString::generate(&mut OsRng);
        
        // Hash the PIN for verification
        let pin_hash = self.hash_pin(pin, &salt)?;
        
        // Derive the database encryption key
        let db_key = self.derive_key(pin, &salt)?;
        
        // Store the PIN hash in secure storage
        self.store_pin_hash(&pin_hash)?;
        
        // Keep salt and key in memory
        self.salt = Some(salt);
        self.pin_hash = Some(pin_hash);
        self.db_key = Some(db_key);
        
        log::info!("PIN setup complete");
        Ok(())
    }
    
    /// Verify a PIN against the stored hash
    pub fn verify_pin(&mut self, pin: &str) -> bool {
        let stored_hash = match self.load_pin_hash() {
            Some(hash) => hash,
            None => return false,
        };
        
        // Parse the stored hash
        let parsed_hash = match PasswordHash::new(&stored_hash) {
            Ok(hash) => hash,
            Err(_) => return false,
        };
        
        // Verify the PIN
        let argon2 = self.get_argon2();
        if argon2.verify_password(pin.as_bytes(), &parsed_hash).is_ok() {
            // PIN is valid, derive the key
            if let Some(salt_str) = parsed_hash.salt {
                if let Ok(salt) = SaltString::from_b64(salt_str.as_str()) {
                    if let Ok(key) = self.derive_key(pin, &salt) {
                        self.db_key = Some(key);
                        self.salt = Some(salt);
                        self.pin_hash = Some(stored_hash);
                        return true;
                    }
                }
            }
        }
        
        false
    }
    
    /// Get the database encryption key (hex encoded for SQLCipher)
    pub fn get_db_key(&self) -> Option<String> {
        self.db_key.as_ref().map(|k| k.as_hex())
    }
    
    /// Change the PIN
    pub fn change_pin(&mut self, current_pin: &str, new_pin: &str) -> Result<(), CryptoError> {
        // Verify current PIN first
        if !self.verify_pin(current_pin) {
            return Err(CryptoError::InvalidPin);
        }
        
        // Generate new salt
        let new_salt = SaltString::generate(&mut OsRng);
        
        // Hash the new PIN
        let new_hash = self.hash_pin(new_pin, &new_salt)?;
        
        // Derive new database key
        let new_key = self.derive_key(new_pin, &new_salt)?;
        
        // Store the new hash
        self.store_pin_hash(&new_hash)?;
        
        // Update in-memory state
        self.salt = Some(new_salt);
        self.pin_hash = Some(new_hash);
        self.db_key = Some(new_key);
        
        // Note: The database needs to be re-keyed separately using PRAGMA rekey
        log::info!("PIN changed successfully");
        Ok(())
    }
    
    /// Clear sensitive data from memory
    pub fn clear(&mut self) {
        self.db_key = None;
        // Salt and pin_hash don't need zeroizing as they're not secret
    }
    
    // ---- Private methods ----
    
    fn get_argon2(&self) -> Argon2<'_> {
        let params = Params::new(
            ARGON2_MEMORY_KB,
            ARGON2_ITERATIONS,
            ARGON2_PARALLELISM,
            Some(ARGON2_OUTPUT_LEN),
        ).expect("Invalid Argon2 params");
        
        Argon2::new(Algorithm::Argon2id, Version::V0x13, params)
    }
    
    fn hash_pin(&self, pin: &str, salt: &SaltString) -> Result<String, CryptoError> {
        let argon2 = self.get_argon2();
        
        let hash = argon2.hash_password(pin.as_bytes(), salt)
            .map_err(|e| CryptoError::KeyDerivation(e.to_string()))?;
        
        Ok(hash.to_string())
    }
    
    fn derive_key(&self, pin: &str, salt: &SaltString) -> Result<DerivedKey, CryptoError> {
        let argon2 = self.get_argon2();
        
        let mut key = vec![0u8; ARGON2_OUTPUT_LEN];
        let salt_bytes = salt.as_str().as_bytes();
        argon2.hash_password_into(pin.as_bytes(), salt_bytes, &mut key)
            .map_err(|e| CryptoError::KeyDerivation(e.to_string()))?;
        
        Ok(DerivedKey::new(key))
    }
    
    #[cfg(windows)]
    fn store_pin_hash(&self, hash: &str) -> Result<(), CryptoError> {
        let entry = Entry::new(KEYRING_SERVICE, KEYRING_USER)
            .map_err(|e| CryptoError::Keyring(e.to_string()))?;
        
        entry.set_password(hash)
            .map_err(|e| CryptoError::Keyring(e.to_string()))?;
        
        Ok(())
    }
    
    #[cfg(windows)]
    fn load_pin_hash(&self) -> Option<String> {
        let entry = Entry::new(KEYRING_SERVICE, KEYRING_USER).ok()?;
        entry.get_password().ok()
    }
    
    #[cfg(not(windows))]
    fn store_pin_hash(&self, hash: &str) -> Result<(), CryptoError> {
        // Fallback: Store in app data directory
        let path = self.get_pin_file_path()?;
        std::fs::write(&path, hash)
            .map_err(|e| CryptoError::OperationFailed(e.to_string()))?;
        Ok(())
    }
    
    #[cfg(not(windows))]
    fn load_pin_hash(&self) -> Option<String> {
        let path = self.get_pin_file_path().ok()?;
        std::fs::read_to_string(&path).ok()
    }
    
    #[cfg(not(windows))]
    fn get_pin_file_path(&self) -> Result<PathBuf, CryptoError> {
        let data_dir = self.data_dir.as_ref()
            .ok_or(CryptoError::OperationFailed("Data directory not set".into()))?;
        Ok(data_dir.join(".pin_hash"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_key_derivation() {
        let mut km = KeyManager::new();
        let salt = SaltString::generate(&mut OsRng);
        
        let key1 = km.derive_key("1234", &salt).unwrap();
        let key2 = km.derive_key("1234", &salt).unwrap();
        let key3 = km.derive_key("5678", &salt).unwrap();
        
        // Same PIN + salt = same key
        assert_eq!(key1.as_hex(), key2.as_hex());
        
        // Different PIN = different key
        assert_ne!(key1.as_hex(), key3.as_hex());
        
        // Key is 32 bytes (64 hex chars)
        assert_eq!(key1.as_hex().len(), 64);
    }
    
    #[test]
    fn test_pin_hashing() {
        let km = KeyManager::new();
        let salt = SaltString::generate(&mut OsRng);
        
        let hash = km.hash_pin("1234", &salt).unwrap();
        
        // Hash should be in PHC format
        assert!(hash.starts_with("$argon2id$"));
    }
}
