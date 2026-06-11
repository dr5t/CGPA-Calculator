# AeroGrade — Premium GPA & CGPA Calculator

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-indigo.svg)](package.json)
[![Security Policy](https://img.shields.io/badge/Security-Supported-emerald.svg)](SECURITY.md)

AeroGrade is a responsive, single-page CGPA and GPA Calculator application designed with a glassmorphism aesthetic. It allows students to manage multiple semesters, create custom grading scales, track performance with interactive charts, and forecast future academic requirements.

---

## 🚀 Key Features

* **Flexible Grading System**: Built-in support for standard **4.0 Scale** (A+, A, B...), **10.0 Scale** (O, A+, A...), and **Percentage Scale** (0-100%).
* **Custom Scale Creator**: Build your own grading system by mapping custom letter symbols to specific GPA point values.
* **Interactive Dashboard**:
  * **GPA Trend Line Chart**: Features smooth SVG curves mapping your semester performance over time with hover-to-view node details.
  * **Grade Distribution Donut**: Aggregated chart displaying the counts and percentages of grades earned.
* **Target CGPA Goal Planner**: A "What-If" analysis tool that determines the average GPA needed in remaining semesters to achieve your target graduation CGPA.
* **State Persistence**: Automatic background caching with `localStorage` so data is preserved upon tab closures or reloads.
* **JSON Backup System**: Export your current semesters configuration as a JSON file, or restore existing backup templates.
* **Print-Optimized Transcript**: Custom stylesheets that clean up interactive components to generate clean, professional academic transcript printouts.
* **Light / Dark Mode**: Transitions smoothly between light and dark backgrounds based on preference, with automatic operating system mode detection support.

---

## 🛠️ Tech Stack

* **Structure**: HTML5 (Semantic Structure)
* **Styling**: Vanilla CSS3 (CSS Custom Variables, Flexbox, Grid, Glassmorphism, Print Overrides)
* **Logic & Analytics**: Vanilla JavaScript ES6 (State-management, SVG Rendering, JSON Backup, File Readers)

---

## 📁 File Structure

```text
├── index.html       # Application interface & markup
├── index.css        # Clean glassmorphic styling & overrides
├── app.js           # Calculations & SVG charting engine
├── LICENSE          # MIT License agreement
├── SECURITY.md      # Security reporting policy
└── README.md        # Project overview & documentation
```

---

## 💻 Running the Application

Simply open the `index.html` file in any modern web browser:
```bash
# Double click index.html or open via terminal on macOS
open index.html
```
No installation or compilation commands are needed. The page runs fully client-side.

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 👤 Developer

Developed with ❤️ by **Shaurya Tiwari**.
