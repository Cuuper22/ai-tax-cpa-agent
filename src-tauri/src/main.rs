//! AI Tax CPA - Personal Tax Assistant
//! 
//! A local-first, privacy-focused tax preparation application
//! with AI-powered assistance via Claude API.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    ai_tax_cpa_lib::run();
}
