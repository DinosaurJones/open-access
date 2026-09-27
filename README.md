# OpenAccess

A modern, open-source Microsoft Access alternative built with **Tauri, Svelte, and SQLite**. This app allows you to manage local databases, create custom forms, and generate reports.

## Features

- **Database Management**: Create, view, and manage SQLite databases
- **Table Explorer**: Browse tables, view schemas, and manage data
- **Form Designer**: Create custom forms for data entry (coming soon)
- **Report Designer**: Generate custom reports (coming soon)
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Lightweight**: Tiny binaries (~5MB) thanks to Tauri

## Tech Stack

- **Frontend**: [Svelte](https://svelte.dev/) + [Vite](https://vitejs.dev/)
- **Backend**: [Tauri](https://tauri.app/) (Rust)
- **Database**: [SQLite](https://sqlite.org/)
- **Styling**: Custom CSS with variables

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://www.rust-lang.org/) (v1.70 or later)
- [pnpm](https://pnpm.io/) (recommended) or npm/yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/openaccess.git
   cd openaccess