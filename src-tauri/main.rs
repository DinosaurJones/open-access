// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            // Create a default database if it doesn't exist
            let db_path = app.path_resolver().app_data_dir().unwrap().join("database.db");
            let db_dir = db_path.parent().unwrap();
            std::fs::create_dir_all(db_dir).ok();

            // Initialize the database with a sample table if it doesn't exist
            if !db_path.exists() {
                let conn = tauri_plugin_sql::Connection::connect(&format!("sqlite:{}", db_path.display()))?;
                conn.execute(
                    "CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        email TEXT UNIQUE NOT NULL,
                        age INTEGER,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )"
                )?;
                conn.execute(
                    "INSERT INTO users (name, email, age) VALUES ('John Doe', 'john@example.com', 30)"
                )?;
                conn.execute(
                    "INSERT INTO users (name, email, age) VALUES ('Jane Smith', 'jane@example.com', 25)"
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}