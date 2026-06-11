const DEFAULT_SCALES = {
  "4.0": [
    { grade: "A+", points: 4.0 },
    { grade: "A", points: 4.0 },
    { grade: "A-", points: 3.7 },
    { grade: "B+", points: 3.3 },
    { grade: "B", points: 3.0 },
    { grade: "B-", points: 2.7 },
    { grade: "C+", points: 2.3 },
    { grade: "C", points: 2.0 },
    { grade: "C-", points: 1.7 },
    { grade: "D+", points: 1.3 },
    { grade: "D", points: 1.0 },
    { grade: "F", points: 0.0 }
  ],
  "10.0": [
    { grade: "O", points: 10.0 },
    { grade: "A+", points: 9.0 },
    { grade: "A", points: 8.0 },
    { grade: "B+", points: 7.0 },
    { grade: "B", points: 6.0 },
    { grade: "C", points: 5.0 },
    { grade: "P", points: 4.0 },
    { grade: "F", points: 0.0 }
  ]
};

const GRADE_COLORS = {
  "A+": "#a855f7", "A": "#818cf8", "A-": "#6366f1",
  "B+": "#3b82f6", "B": "#60a5fa", "B-": "#93c5fd",
  "C+": "#f59e0b", "C": "#fbbf24", "C-": "#fde047",
  "D+": "#f97316", "D": "#fb923c",
  "O": "#a855f7", "P": "#fb923c",
  "F": "#ef4444",
  "Default": "#64748b"
};

let state = {
  semesters: [],
  activeScale: "4.0",
  customScales: {},
  theme: "dark"
};

document.addEventListener("DOMContentLoaded", () => {
  loadState();
  initTheme();
  setupEventListeners();
  renderApp();
});

function loadState() {
  const savedState = localStorage.getItem("aerograde_state");
  if (savedState) {
    try {
      state = JSON.parse(savedState);
      if (!state.customScales) state.customScales = {};
      if (!state.semesters) state.semesters = [];
      if (!state.activeScale) state.activeScale = "4.0";
      if (!state.theme) state.theme = "dark";
    } catch (e) {
      console.error(e);
      resetStateToDefault();
    }
  } else {
    resetStateToDefault();
  }
}

function resetStateToDefault() {
  state = {
    semesters: [
      {
        id: "sem-" + Date.now(),
        name: "Semester 1",
        collapsed: false,
        courses: [
          { id: "c-1", name: "Mathematics I", grade: "A", credits: 4, exclude: false },
          { id: "c-2", name: "Physics Lab", grade: "B+", credits: 3, exclude: false },
          { id: "c-3", name: "Computer Programming", grade: "A-", credits: 4, exclude: false }
        ]
      }
    ],
    activeScale: "4.0",
    customScales: {},
    theme: "dark"
  };
}

function saveState() {
  localStorage.setItem("aerograde_state", JSON.stringify(state));
}

function initTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", state.theme);
  saveState();
}

function getActiveGrades() {
  if (state.activeScale === "percent") return null;
  if (DEFAULT_SCALES[state.activeScale]) {
    return DEFAULT_SCALES[state.activeScale];
  }
  if (state.customScales[state.activeScale]) {
    return state.customScales[state.activeScale];
  }
  return DEFAULT_SCALES["4.0"];
}

function getMaxGradePoints() {
  if (state.activeScale === "percent") return 100;
  const grades = getActiveGrades();
  if (!grades || grades.length === 0) return 4.0;
  return Math.max(...grades.map(g => g.points));
}

function gradeToPoints(gradeVal) {
  if (state.activeScale === "percent") {
    const parsed = parseFloat(gradeVal);
    return isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed));
  }
  const grades = getActiveGrades();
  const found = grades.find(g => g.grade === gradeVal);
  return found ? found.points : 0;
}

function calculateSemesterStats(semester) {
  let totalCredits = 0;
  let totalPoints = 0;
  
  semester.courses.forEach(course => {
    if (course.exclude) return;
    
    const credits = parseFloat(course.credits);
    if (isNaN(credits) || credits <= 0) return;
    
    const points = gradeToPoints(course.grade);
    
    totalCredits += credits;
    totalPoints += (points * credits);
  });
  
  const gpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;
  return {
    gpa: parseFloat(gpa.toFixed(2)),
    totalCredits,
    totalPoints
  };
}

function calculateOverallStats() {
  let totalCredits = 0;
  let totalPoints = 0;
  let totalCourses = 0;
  const semesterStats = [];
  
  state.semesters.forEach(sem => {
    const stats = calculateSemesterStats(sem);
    semesterStats.push({
      id: sem.id,
      name: sem.name,
      gpa: stats.gpa,
      credits: stats.totalCredits
    });
    
    totalCredits += stats.totalCredits;
    totalPoints += stats.totalPoints;
    totalCourses += sem.courses.length;
  });
  
  const cgpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;
  return {
    cgpa: parseFloat(cgpa.toFixed(2)),
    totalCredits,
    totalCourses,
    semesterStats
  };
}

function setupEventListeners() {
  document.getElementById("themeToggleBtn").addEventListener("click", toggleTheme);
  
  const scaleSelect = document.getElementById("gradingScaleSelect");
  scaleSelect.addEventListener("change", (e) => {
    state.activeScale = e.target.value;
    remapStateGrades();
    saveState();
    renderApp();
  });
  
  document.getElementById("addSemesterBtn").addEventListener("click", addNewSemester);
  document.getElementById("addSemesterHeaderBtn").addEventListener("click", addNewSemester);
  document.getElementById("emptyStateAddBtn").addEventListener("click", addNewSemester);
  
  document.getElementById("manageScalesBtn").addEventListener("click", openCustomScalesModal);
  document.getElementById("closeScalesModalBtn").addEventListener("click", closeCustomScalesModal);
  document.getElementById("cancelScaleBtn").addEventListener("click", closeCustomScalesModal);
  document.getElementById("addMappingRowBtn").addEventListener("click", () => addCustomScaleMappingRow("", ""));
  document.getElementById("saveScaleBtn").addEventListener("click", saveCustomScale);
  document.getElementById("deleteCustomScalesBtn").addEventListener("click", deleteCustomScale);
  
  document.getElementById("calculateGoalBtn").addEventListener("click", calculateGoalGpa);
  
  document.getElementById("printBtn").addEventListener("click", () => window.print());
  document.getElementById("exportBtn").addEventListener("click", exportBackup);
  document.getElementById("importBtn").addEventListener("click", () => {
    document.getElementById("importFileInput").click();
  });
  document.getElementById("importFileInput").addEventListener("change", importBackup);
  document.getElementById("resetAllBtn").addEventListener("click", resetAllData);
}

function remapStateGrades() {
  const grades = getActiveGrades();
  state.semesters.forEach(sem => {
    sem.courses.forEach(course => {
      if (state.activeScale === "percent") {
        const numeric = parseFloat(course.grade);
        course.grade = isNaN(numeric) ? "85" : Math.max(0, Math.min(100, numeric)).toString();
      } else {
        const found = grades.find(g => g.grade === course.grade);
        if (!found) {
          course.grade = grades[0] ? grades[0].grade : "";
        }
      }
    });
  });
}

// UI Rendering Controller
function renderApp() {
  populateScaleOptions();
  renderSemesters();
  updateDashboardOverview();
  updatePrintSummary();
}

function populateScaleOptions() {
  const scaleSelect = document.getElementById("gradingScaleSelect");
  
  scaleSelect.innerHTML = `
    <option value="4.0">Standard 4.0 Scale (A, B, C...)</option>
    <option value="10.0">Standard 10.0 Scale (O, A+, A...)</option>
    <option value="percent">Percentage Scale (0 - 100%)</option>
  `;
  
  Object.keys(state.customScales).forEach(scaleName => {
    const option = document.createElement("option");
    option.value = scaleName;
    option.textContent = scaleName;
    scaleSelect.appendChild(option);
  });
  
  scaleSelect.value = state.activeScale;
}

function updateDashboardOverview() {
  const stats = calculateOverallStats();
  
  const cgpaValEl = document.getElementById("cgpaValue");
  const cgpaStatusEl = document.getElementById("cgpaStatus");
  
  cgpaValEl.textContent = stats.cgpa.toFixed(2);
  
  const maxPoints = getMaxGradePoints();
  const percentage = maxPoints > 0 ? (stats.cgpa / maxPoints) * 100 : 0;
  
  if (stats.totalCredits === 0) {
    cgpaStatusEl.textContent = "Add courses to calculate";
    cgpaStatusEl.style.background = "rgba(255, 255, 255, 0.2)";
  } else if (percentage >= 90) {
    cgpaStatusEl.textContent = "Outstanding Performance";
    cgpaStatusEl.style.background = "rgba(16, 185, 129, 0.3)";
  } else if (percentage >= 80) {
    cgpaStatusEl.textContent = "Excellent standing";
    cgpaStatusEl.style.background = "rgba(99, 102, 241, 0.3)";
  } else if (percentage >= 65) {
    cgpaStatusEl.textContent = "Good Standing";
    cgpaStatusEl.style.background = "rgba(59, 130, 246, 0.3)";
  } else if (percentage >= 50) {
    cgpaStatusEl.textContent = "Satisfactory";
    cgpaStatusEl.style.background = "rgba(245, 158, 11, 0.3)";
  } else {
    cgpaStatusEl.textContent = "Needs Improvement";
    cgpaStatusEl.style.background = "rgba(239, 68, 68, 0.3)";
  }
  
  document.getElementById("totalCredits").textContent = stats.totalCredits;
  document.getElementById("totalCourses").textContent = stats.totalCourses;
  
  drawTrendChart(stats.semesterStats);
  drawDonutChart();
}

function updatePrintSummary() {
  const stats = calculateOverallStats();
  document.getElementById("printCgpa").textContent = stats.cgpa.toFixed(2);
  document.getElementById("printCredits").textContent = stats.totalCredits;
  document.getElementById("printSemesters").textContent = state.semesters.length;
}

function renderSemesters() {
  const container = document.getElementById("semestersContainer");
  const emptyState = document.getElementById("emptyState");
  
  const emptyStateClone = emptyState.cloneNode(true);
  emptyStateClone.style.display = state.semesters.length === 0 ? "flex" : "none";
  container.innerHTML = "";
  container.appendChild(emptyStateClone);
  
  container.querySelector("#emptyStateAddBtn").addEventListener("click", addNewSemester);
  
  if (state.semesters.length === 0) return;
  
  state.semesters.forEach((sem, index) => {
    const semStats = calculateSemesterStats(sem);
    const semCard = document.createElement("div");
    semCard.className = `card semester-card ${sem.collapsed ? 'collapsed' : ''}`;
    semCard.dataset.id = sem.id;
    
    const header = document.createElement("div");
    header.className = "semester-header";
    header.addEventListener("click", (e) => {
      if (e.target.tagName === "INPUT" || e.target.closest("button") || e.target.closest(".quick-generator")) return;
      toggleSemesterCollapse(sem.id);
    });
    
    const titleGroup = document.createElement("div");
    titleGroup.className = "semester-title-group";
    
    const chevron = document.createElement("span");
    chevron.innerHTML = `<svg class="chevron-icon" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5H7z"/></svg>`;
    
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "semester-name-input";
    nameInput.value = sem.name;
    nameInput.addEventListener("change", (e) => {
      sem.name = e.target.value;
      saveState();
      updatePrintSummary();
    });
    
    const gpaBadge = document.createElement("span");
    gpaBadge.className = "semester-gpa-badge";
    gpaBadge.textContent = `GPA: ${semStats.gpa.toFixed(2)}`;
    
    titleGroup.appendChild(chevron);
    titleGroup.appendChild(nameInput);
    titleGroup.appendChild(gpaBadge);
    
    const controls = document.createElement("div");
    controls.className = "semester-controls";
    
    const deleteSemBtn = document.createElement("button");
    deleteSemBtn.type = "button";
    deleteSemBtn.className = "btn btn-danger btn-icon-only";
    deleteSemBtn.setAttribute("aria-label", "Delete Semester");
    deleteSemBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
    `;
    deleteSemBtn.addEventListener("click", () => deleteSemester(sem.id));
    
    controls.appendChild(deleteSemBtn);
    header.appendChild(titleGroup);
    header.appendChild(controls);
    
    const body = document.createElement("div");
    body.className = "semester-body";
    
    const coursesList = document.createElement("div");
    coursesList.className = "courses-list";
    
    sem.courses.forEach((course, courseIndex) => {
      const courseRow = document.createElement("div");
      courseRow.className = "course-row";
      courseRow.dataset.courseId = course.id;
      
      const indexIndicator = document.createElement("div");
      indexIndicator.className = "course-index";
      indexIndicator.textContent = courseIndex + 1;
      
      const nameCol = document.createElement("div");
      nameCol.className = "course-input-group";
      const nameLabel = document.createElement("label");
      nameLabel.className = "course-label";
      nameLabel.textContent = "Course Title";
      const nameInp = document.createElement("input");
      nameInp.type = "text";
      nameInp.className = "text-input";
      nameInp.value = course.name;
      nameInp.placeholder = `Course ${courseIndex + 1}`;
      nameInp.addEventListener("change", (e) => {
        course.name = e.target.value;
        saveState();
      });
      nameCol.appendChild(nameLabel);
      nameCol.appendChild(nameInp);
      
      const gradeCol = document.createElement("div");
      gradeCol.className = "course-input-group";
      const gradeLabel = document.createElement("label");
      gradeLabel.className = "course-label";
      gradeLabel.textContent = "Grade";
      
      let gradeInp;
      if (state.activeScale === "percent") {
        gradeInp = document.createElement("input");
        gradeInp.type = "number";
        gradeInp.min = "0";
        gradeInp.max = "100";
        gradeInp.className = "text-input";
        gradeInp.value = course.grade;
        gradeInp.placeholder = "0-100";
      } else {
        gradeInp = document.createElement("select");
        gradeInp.className = "select-input";
        
        const grades = getActiveGrades();
        grades.forEach(g => {
          const opt = document.createElement("option");
          opt.value = g.grade;
          opt.textContent = `${g.grade} (${g.points.toFixed(1)})`;
          gradeInp.appendChild(opt);
        });
        gradeInp.value = course.grade;
      }
      
      gradeInp.addEventListener("change", (e) => {
        course.grade = e.target.value;
        saveState();
        updateSemesterSummary(sem.id);
        updateDashboardOverview();
      });
      
      gradeCol.appendChild(gradeLabel);
      gradeCol.appendChild(gradeInp);
      
      const creditsCol = document.createElement("div");
      creditsCol.className = "course-input-group";
      const creditsLabel = document.createElement("label");
      creditsLabel.className = "course-label";
      creditsLabel.textContent = "Credits";
      const creditsInp = document.createElement("input");
      creditsInp.type = "number";
      creditsInp.step = "0.5";
      creditsInp.min = "0.5";
      creditsInp.className = "text-input";
      creditsInp.value = course.credits;
      creditsInp.addEventListener("change", (e) => {
        const val = parseFloat(e.target.value);
        course.credits = isNaN(val) ? 0 : val;
        saveState();
        updateSemesterSummary(sem.id);
        updateDashboardOverview();
      });
      creditsCol.appendChild(creditsLabel);
      creditsCol.appendChild(creditsInp);
      
      const deleteCol = document.createElement("button");
      deleteCol.type = "button";
      deleteCol.className = "delete-course-btn";
      deleteCol.setAttribute("aria-label", "Remove Course");
      deleteCol.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      deleteCol.addEventListener("click", () => deleteCourse(sem.id, course.id));
      
      courseRow.appendChild(indexIndicator);
      courseRow.appendChild(nameCol);
      courseRow.appendChild(gradeCol);
      courseRow.appendChild(creditsCol);
      courseRow.appendChild(deleteCol);
      
      coursesList.appendChild(courseRow);
    });
    
    body.appendChild(coursesList);
    
    const footer = document.createElement("div");
    footer.className = "semester-footer";
    
    const leftFooter = document.createElement("div");
    leftFooter.style.display = "flex";
    leftFooter.style.gap = "1rem";
    
    const addCourseBtn = document.createElement("button");
    addCourseBtn.type = "button";
    addCourseBtn.className = "btn btn-secondary";
    addCourseBtn.innerHTML = `+ Add Course`;
    addCourseBtn.addEventListener("click", () => addNewCourse(sem.id));
    
    const quickGen = document.createElement("div");
    quickGen.className = "quick-generator";
    
    const genInp = document.createElement("input");
    genInp.type = "number";
    genInp.min = "1";
    genInp.max = "15";
    genInp.value = "3";
    genInp.className = "text-input";
    
    const genBtn = document.createElement("button");
    genBtn.type = "button";
    genBtn.className = "btn btn-secondary";
    genBtn.textContent = "Generate Rows";
    genBtn.addEventListener("click", () => {
      const val = parseInt(genInp.value);
      if (!isNaN(val) && val > 0) {
        generateCourseRows(sem.id, val);
      }
    });
    
    quickGen.appendChild(genInp);
    quickGen.appendChild(genBtn);
    
    leftFooter.appendChild(addCourseBtn);
    leftFooter.appendChild(quickGen);
    
    const statsDiv = document.createElement("div");
    statsDiv.className = "semester-summary-stats";
    statsDiv.id = `sem-stats-${sem.id}`;
    
    const credSpan = document.createElement("span");
    credSpan.className = "semester-stat-item";
    credSpan.innerHTML = `Semester Credits: <strong class="sem-credits-val">${semStats.totalCredits}</strong>`;
    
    const pointsSpan = document.createElement("span");
    pointsSpan.className = "semester-stat-item";
    pointsSpan.innerHTML = `Grade Points: <strong class="sem-points-val">${semStats.totalPoints.toFixed(1)}</strong>`;
    
    statsDiv.appendChild(credSpan);
    statsDiv.appendChild(pointsSpan);
    
    footer.appendChild(leftFooter);
    footer.appendChild(statsDiv);
    body.appendChild(footer);
    
    semCard.appendChild(header);
    semCard.appendChild(body);
    
    container.appendChild(semCard);
  });
}

function updateSemesterSummary(semesterId) {
  const sem = state.semesters.find(s => s.id === semesterId);
  if (!sem) return;
  
  const stats = calculateSemesterStats(sem);
  const card = document.querySelector(`.semester-card[data-id="${semesterId}"]`);
  if (!card) return;
  
  const gpaBadge = card.querySelector(".semester-gpa-badge");
  if (gpaBadge) gpaBadge.textContent = `GPA: ${stats.gpa.toFixed(2)}`;
  
  const statsDiv = document.getElementById(`sem-stats-${semesterId}`);
  if (statsDiv) {
    statsDiv.querySelector(".sem-credits-val").textContent = stats.totalCredits;
    statsDiv.querySelector(".sem-points-val").textContent = stats.totalPoints.toFixed(1);
  }
}

function addNewSemester() {
  const newNum = state.semesters.length + 1;
  const newSem = {
    id: "sem-" + Date.now(),
    name: `Semester ${newNum}`,
    collapsed: false,
    courses: [
      { id: "c-" + Date.now() + "-1", name: "", grade: getDefaultGrade(), credits: 3, exclude: false },
      { id: "c-" + Date.now() + "-2", name: "", grade: getDefaultGrade(), credits: 3, exclude: false },
      { id: "c-" + Date.now() + "-3", name: "", grade: getDefaultGrade(), credits: 3, exclude: false }
    ]
  };
  
  state.semesters.push(newSem);
  saveState();
  renderApp();
  
  setTimeout(() => {
    const cardEl = document.querySelector(`.semester-card[data-id="${newSem.id}"]`);
    if (cardEl) cardEl.scrollIntoView({ behavior: "smooth" });
  }, 100);
}

function toggleSemesterCollapse(semesterId) {
  const sem = state.semesters.find(s => s.id === semesterId);
  if (sem) {
    sem.collapsed = !sem.collapsed;
    saveState();
    const card = document.querySelector(`.semester-card[data-id="${semesterId}"]`);
    if (card) {
      if (sem.collapsed) {
        card.classList.add("collapsed");
      } else {
        card.classList.remove("collapsed");
      }
    }
  }
}

function deleteSemester(semesterId) {
  if (confirm("Are you sure you want to delete this entire semester?")) {
    const card = document.querySelector(`.semester-card[data-id="${semesterId}"]`);
    if (card) {
      card.classList.add("slide-out");
      card.addEventListener("animationend", () => {
        state.semesters = state.semesters.filter(s => s.id !== semesterId);
        saveState();
        renderApp();
      });
    } else {
      state.semesters = state.semesters.filter(s => s.id !== semesterId);
      saveState();
      renderApp();
    }
  }
}

function getDefaultGrade() {
  if (state.activeScale === "percent") return "85";
  const grades = getActiveGrades();
  return grades[0] ? grades[0].grade : "";
}

function addNewCourse(semesterId) {
  const sem = state.semesters.find(s => s.id === semesterId);
  if (!sem) return;
  
  sem.courses.push({
    id: "c-" + Date.now(),
    name: "",
    grade: getDefaultGrade(),
    credits: 3,
    exclude: false
  });
  
  saveState();
  renderSemesters();
  updateDashboardOverview();
}

function generateCourseRows(semesterId, count) {
  const sem = state.semesters.find(s => s.id === semesterId);
  if (!sem) return;
  
  for (let i = 0; i < count; i++) {
    sem.courses.push({
      id: "c-" + Date.now() + "-" + i,
      name: "",
      grade: getDefaultGrade(),
      credits: 3,
      exclude: false
    });
  }
  
  saveState();
  renderSemesters();
  updateDashboardOverview();
}

function deleteCourse(semesterId, courseId) {
  const row = document.querySelector(`.semester-card[data-id="${semesterId}"] .course-row[data-course-id="${courseId}"]`);
  if (row) {
    row.classList.add("slide-out");
    row.addEventListener("animationend", () => {
      const sem = state.semesters.find(s => s.id === semesterId);
      if (sem) {
        sem.courses = sem.courses.filter(c => c.id !== courseId);
        saveState();
        renderSemesters();
        updateDashboardOverview();
      }
    });
  } else {
    const sem = state.semesters.find(s => s.id === semesterId);
    if (sem) {
      sem.courses = sem.courses.filter(c => c.id !== courseId);
      saveState();
      renderSemesters();
      updateDashboardOverview();
    }
  }
}

function drawTrendChart(semesterStats) {
  const svg = document.getElementById("gpaTrendSvg");
  svg.innerHTML = "";
  
  if (semesterStats.length === 0) {
    svg.innerHTML = `<text x="50" y="50" fill="var(--text-muted)" text-anchor="middle" font-size="10">No Semester Data</text>`;
    return;
  }
  
  const width = 100;
  const height = 100;
  const paddingX = 15;
  const paddingY = 15;
  const maxGpa = getMaxGradePoints();
  
  const points = [];
  if (semesterStats.length === 1) {
    const gpaPercent = semesterStats[0].gpa / maxGpa;
    const yCoord = height - paddingY - (gpaPercent * (height - 2 * paddingY));
    points.push({ x: width / 2, y: yCoord, name: semesterStats[0].name, gpa: semesterStats[0].gpa });
  } else {
    semesterStats.forEach((sem, idx) => {
      const xCoord = paddingX + (idx / (semesterStats.length - 1)) * (width - 2 * paddingX);
      const gpaPercent = sem.gpa / maxGpa;
      const yCoord = height - paddingY - (gpaPercent * (height - 2 * paddingY));
      points.push({ x: xCoord, y: yCoord, name: sem.name, gpa: sem.gpa });
    });
  }
  
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  
  const lineGrad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  lineGrad.setAttribute("id", "lineGradient");
  lineGrad.setAttribute("x1", "0%");
  lineGrad.setAttribute("y1", "0%");
  lineGrad.setAttribute("x2", "100%");
  lineGrad.setAttribute("y2", "0%");
  lineGrad.innerHTML = `<stop offset="0%" stop-color="#6366f1" /><stop offset="100%" stop-color="#a855f7" />`;
  
  const areaGrad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  areaGrad.setAttribute("id", "areaGradient");
  areaGrad.setAttribute("x1", "0%");
  areaGrad.setAttribute("y1", "0%");
  areaGrad.setAttribute("x2", "0%");
  areaGrad.setAttribute("y2", "100%");
  areaGrad.innerHTML = `<stop offset="0%" stop-color="#6366f1" stop-opacity="0.25" /><stop offset="100%" stop-color="#6366f1" stop-opacity="0" />`;
  
  defs.appendChild(lineGrad);
  defs.appendChild(areaGrad);
  svg.appendChild(defs);
  
  const lines = [0.25, 0.5, 0.75, 1.0];
  lines.forEach(lineRatio => {
    const yVal = height - paddingY - (lineRatio * (height - 2 * paddingY));
    const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    gridLine.setAttribute("x1", "5");
    gridLine.setAttribute("y1", yVal.toString());
    gridLine.setAttribute("x2", "95");
    gridLine.setAttribute("y2", yVal.toString());
    gridLine.setAttribute("stroke", "var(--border-card)");
    gridLine.setAttribute("stroke-width", "0.5");
    gridLine.setAttribute("stroke-dasharray", "2,2");
    svg.appendChild(gridLine);
  });
  
  if (points.length > 1) {
    let dLine = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cpX1 = points[i-1].x + (points[i].x - points[i-1].x) / 2;
      const cpY1 = points[i-1].y;
      const cpX2 = points[i-1].x + (points[i].x - points[i-1].x) / 2;
      const cpY2 = points[i].y;
      dLine += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
    }
    
    const pathLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathLine.setAttribute("d", dLine);
    pathLine.setAttribute("stroke", "url(#lineGradient)");
    pathLine.setAttribute("stroke-width", "2.5");
    pathLine.setAttribute("fill", "none");
    pathLine.setAttribute("stroke-linecap", "round");
    svg.appendChild(pathLine);
    
    const dArea = `${dLine} L ${points[points.length-1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;
    const pathArea = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathArea.setAttribute("d", dArea);
    pathArea.setAttribute("fill", "url(#areaGradient)");
    svg.appendChild(pathArea);
  }
  
  const tooltip = document.getElementById("trendTooltip");
  points.forEach(pt => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", pt.x.toString());
    circle.setAttribute("cy", pt.y.toString());
    circle.setAttribute("r", "3.5");
    circle.setAttribute("fill", "var(--bg-page)");
    circle.setAttribute("stroke", "#818cf8");
    circle.setAttribute("stroke-width", "2");
    circle.style.cursor = "pointer";
    circle.style.transition = "r 0.15s ease, fill 0.15s ease";
    
    circle.addEventListener("mouseenter", (e) => {
      circle.setAttribute("r", "5");
      circle.setAttribute("fill", "#6366f1");
      
      const containerRect = svg.parentElement.getBoundingClientRect();
      const pctX = (pt.x / width) * containerRect.width;
      const pctY = (pt.y / height) * containerRect.height;
      
      tooltip.style.left = `${pctX}px`;
      tooltip.style.top = `${pctY - 40}px`;
      tooltip.innerHTML = `<strong>${pt.name}</strong><br>GPA: ${pt.gpa.toFixed(2)}`;
      tooltip.style.opacity = "1";
    });
    
    circle.addEventListener("mouseleave", () => {
      circle.setAttribute("r", "3.5");
      circle.setAttribute("fill", "var(--bg-page)");
      tooltip.style.opacity = "0";
    });
    
    svg.appendChild(circle);
  });
}

function drawDonutChart() {
  const svg = document.getElementById("gradeDonutSvg");
  const legendContainer = document.getElementById("donutLabels");
  legendContainer.innerHTML = "";
  
  const slices = svg.querySelectorAll(".donut-slice");
  slices.forEach(s => s.remove());
  
  const gradeCounts = {};
  let totalCourses = 0;
  
  state.semesters.forEach(sem => {
    sem.courses.forEach(course => {
      if (course.exclude) return;
      let gradeLabel = course.grade;
      if (state.activeScale === "percent") {
        const num = parseFloat(course.grade);
        if (isNaN(num)) return;
        if (num >= 90) gradeLabel = "A+";
        else if (num >= 80) gradeLabel = "A";
        else if (num >= 70) gradeLabel = "B";
        else if (num >= 50) gradeLabel = "C";
        else gradeLabel = "F";
      }
      
      if (!gradeLabel) return;
      
      gradeCounts[gradeLabel] = (gradeCounts[gradeLabel] || 0) + 1;
      totalCourses++;
    });
  });
  
  if (totalCourses === 0) {
    legendContainer.innerHTML = `<span style="color: var(--text-muted);">No courses logged</span>`;
    return;
  }
  
  let cumulativePercent = 0;
  
  Object.keys(gradeCounts).sort().forEach(grade => {
    const count = gradeCounts[grade];
    const percentage = (count / totalCourses) * 100;
    const color = GRADE_COLORS[grade] || GRADE_COLORS["Default"];
    
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.className = "donut-slice";
    circle.setAttribute("cx", "21");
    circle.setAttribute("cy", "21");
    circle.setAttribute("r", "15.91549430918954");
    circle.setAttribute("fill", "transparent");
    circle.setAttribute("stroke", color);
    circle.setAttribute("stroke-width", "3");
    circle.setAttribute("stroke-dasharray", `${percentage} ${100 - percentage}`);
    
    const offset = 100 - cumulativePercent + 25;
    circle.setAttribute("stroke-dashoffset", offset.toString());
    
    svg.appendChild(circle);
    cumulativePercent += percentage;
    
    const legendItem = document.createElement("div");
    legendItem.style.display = "flex";
    legendItem.style.alignItems = "center";
    legendItem.style.gap = "0.5rem";
    legendItem.innerHTML = `
      <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; display: inline-block;"></span>
      <span>${grade}: <strong>${count}</strong> (${percentage.toFixed(0)}%)</span>
    `;
    legendContainer.appendChild(legendItem);
  });
}

function calculateGoalGpa() {
  const targetCgpaInput = document.getElementById("targetCgpaInput");
  const remainingCreditsInput = document.getElementById("remainingCreditsInput");
  const resultDiv = document.getElementById("goalResult");
  
  const targetCgpa = parseFloat(targetCgpaInput.value);
  const remainingCredits = parseFloat(remainingCreditsInput.value);
  
  if (isNaN(targetCgpa) || isNaN(remainingCredits) || remainingCredits <= 0) {
    alert("Please enter valid positive numbers for Target CGPA and Remaining Credits.");
    return;
  }
  
  const stats = calculateOverallStats();
  const currentCredits = stats.totalCredits;
  const currentCgpa = stats.cgpa;
  const maxScaleVal = getMaxGradePoints();
  
  resultDiv.style.display = "block";
  resultDiv.innerHTML = "";
  
  if (targetCgpa > maxScaleVal) {
    resultDiv.innerHTML = `
      <div class="goal-results-box goal-danger">
        <div class="goal-status-indicator">&times;</div>
        <div class="goal-results-content">
          <div class="goal-results-title">Impossible Target</div>
          <div class="goal-results-description">The requested target CGPA (${targetCgpa}) exceeds the maximum possible value of the active grading scale (${maxScaleVal}).</div>
        </div>
      </div>
    `;
    return;
  }
  
  const totalCredits = currentCredits + remainingCredits;
  const requiredTotalPoints = targetCgpa * totalCredits;
  const currentTotalPoints = currentCgpa * currentCredits;
  const requiredRemainingPoints = requiredTotalPoints - currentTotalPoints;
  const requiredGpa = requiredRemainingPoints / remainingCredits;
  
  let statusClass = "goal-success";
  let statusSymbol = `
    <svg viewBox="0 0 24 24">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
  `;
  let title = "Target Achievable!";
  let desc = `You need to maintain an average GPA of <strong>${requiredGpa.toFixed(2)}</strong> over your remaining ${remainingCredits} credits to graduate with a CGPA of ${targetCgpa.toFixed(2)}.`;
  
  if (requiredGpa > maxScaleVal) {
    statusClass = "goal-danger";
    statusSymbol = `
      <svg viewBox="0 0 24 24">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    `;
    title = "Impossible Target";
    desc = `To hit a CGPA of ${targetCgpa.toFixed(2)}, you would need a future average GPA of <strong>${requiredGpa.toFixed(2)}</strong>, which exceeds the scale limit of ${maxScaleVal}. Try lowering your target or taking more credits.`;
  } else if (requiredGpa <= 0) {
    title = "Target Already Met!";
    desc = `Congratulations! Based on your current CGPA of ${currentCgpa.toFixed(2)}, you have already secured your target CGPA. You can score 0.00 in all future remaining courses and still graduate with at least ${targetCgpa.toFixed(2)}.`;
  } else if (requiredGpa > (maxScaleVal * 0.9)) {
    statusClass = "goal-warning";
    statusSymbol = `
      <svg viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
      </svg>
    `;
    title = "Highly Challenging Target";
    desc = `To graduate with a ${targetCgpa.toFixed(2)} CGPA, you must maintain a highly demanding GPA of <strong>${requiredGpa.toFixed(2)}</strong> over your remaining ${remainingCredits} credits. This requires consistent top marks.`;
  }
  
  resultDiv.innerHTML = `
    <div class="goal-results-box ${statusClass}">
      <div class="goal-status-indicator">${statusSymbol}</div>
      <div class="goal-results-content">
        <div class="goal-results-title">${title}</div>
        <div class="goal-results-description">${desc}</div>
      </div>
    </div>
  `;
}

let editingCustomScaleName = null;
let currentModalMappings = [];

function openCustomScalesModal() {
  const modal = document.getElementById("scalesModal");
  const nameInp = document.getElementById("newScaleName");
  const delBtn = document.getElementById("deleteCustomScalesBtn");
  
  nameInp.value = "";
  delBtn.style.display = "none";
  editingCustomScaleName = null;
  currentModalMappings = [];
  
  if (state.activeScale !== "4.0" && state.activeScale !== "10.0" && state.activeScale !== "percent") {
    editingCustomScaleName = state.activeScale;
    nameInp.value = editingCustomScaleName;
    delBtn.style.display = "inline-flex";
    currentModalMappings = [...state.customScales[editingCustomScaleName]];
  } else {
    currentModalMappings = [
      { grade: "A", points: 4.0 },
      { grade: "B", points: 3.0 },
      { grade: "C", points: 2.0 },
      { grade: "D", points: 1.0 },
      { grade: "F", points: 0.0 }
    ];
  }
  
  renderModalMappings();
  modal.classList.add("active");
}

function closeCustomScalesModal() {
  document.getElementById("scalesModal").classList.remove("active");
}

function renderModalMappings() {
  const container = document.getElementById("scaleMappingsList");
  container.innerHTML = "";
  
  currentModalMappings.forEach((map, idx) => {
    const row = document.createElement("div");
    row.className = "scale-mapping-row";
    
    const letterInp = document.createElement("input");
    letterInp.type = "text";
    letterInp.className = "text-input";
    letterInp.placeholder = "e.g. A+";
    letterInp.value = map.grade;
    letterInp.addEventListener("change", (e) => {
      map.grade = e.target.value.trim().toUpperCase();
    });
    
    const valInp = document.createElement("input");
    valInp.type = "number";
    valInp.step = "0.1";
    valInp.min = "0";
    valInp.className = "text-input";
    valInp.placeholder = "Points";
    valInp.value = map.points;
    valInp.addEventListener("change", (e) => {
      const val = parseFloat(e.target.value);
      map.points = isNaN(val) ? 0 : val;
    });
    
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "delete-course-btn";
    delBtn.innerHTML = "&times;";
    delBtn.addEventListener("click", () => {
      currentModalMappings.splice(idx, 1);
      renderModalMappings();
    });
    
    row.appendChild(letterInp);
    row.appendChild(valInp);
    row.appendChild(delBtn);
    
    container.appendChild(row);
  });
}

function addCustomScaleMappingRow(grade, points) {
  currentModalMappings.push({ grade, points: parseFloat(points) || 0 });
  renderModalMappings();
}

function saveCustomScale() {
  const nameInp = document.getElementById("newScaleName");
  const name = nameInp.value.trim();
  
  if (!name) {
    alert("Please enter a name for your custom scale.");
    return;
  }
  if (name === "4.0" || name === "10.0" || name === "percent") {
    alert("Cannot use reserved scale identifiers.");
    return;
  }
  
  const cleanMappings = currentModalMappings.filter(m => m.grade !== "");
  if (cleanMappings.length === 0) {
    alert("Please add at least one grade mapping row.");
    return;
  }
  
  if (editingCustomScaleName && editingCustomScaleName !== name) {
    delete state.customScales[editingCustomScaleName];
  }
  
  state.customScales[name] = cleanMappings;
  state.activeScale = name;
  saveState();
  closeCustomScalesModal();
  renderApp();
}

function deleteCustomScale() {
  if (editingCustomScaleName && confirm(`Delete the custom scale "${editingCustomScaleName}"?`)) {
    delete state.customScales[editingCustomScaleName];
    state.activeScale = "4.0";
    saveState();
    closeCustomScalesModal();
    renderApp();
  }
}

function exportBackup() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `AeroGrade_Backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importBackup(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const parsed = JSON.parse(evt.target.result);
      
      if (parsed.semesters && Array.isArray(parsed.semesters)) {
        state = parsed;
        saveState();
        renderApp();
        alert("Backup imported successfully!");
      } else {
        alert("Invalid backup file format.");
      }
    } catch (err) {
      alert("Failed to parse backup JSON file.");
      console.error(err);
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

function resetAllData() {
  if (confirm("Warning! This will erase all semesters, courses, and custom scales. Do you want to proceed?")) {
    resetStateToDefault();
    saveState();
    renderApp();
  }
}
