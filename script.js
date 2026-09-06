const STORAGE_KEY = "college-attendance-subjects";
const demoSubjects = [
  { name: "Mathematics", code: "MATH 201", present: 41, absent: 9 },
  { name: "Data Structures", code: "CS 204", present: 34, absent: 14 },
  { name: "Database Management", code: "CS 306", present: 38, absent: 7 },
  { name: "Operating Systems", code: "CS 305", present: 29, absent: 11 },
  { name: "Programming Lab", code: "CS 220L", present: 18, absent: 2 }
];

let subjects = [];
let subjectToDelete = null;
const elements = {};

function loadData() {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    subjects = storedData ? JSON.parse(storedData) : demoSubjects.map((subject) => ({ ...subject, id: crypto.randomUUID() }));
  } catch (error) {
    subjects = demoSubjects.map((subject) => ({ ...subject, id: `${Date.now()}-${Math.random()}` }));
  }
  subjects = subjects.filter((subject) => subject && typeof subject.name === "string").map((subject) => ({
    id: subject.id || `${Date.now()}-${Math.random()}`,
    name: subject.name,
    code: subject.code || "",
    present: Math.max(0, Number(subject.present) || 0),
    absent: Math.max(0, Number(subject.absent) || 0)
  }));
  saveData();
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
}

function calculateAttendance(subject) {
  const total = subject.present + subject.absent;
  const percentage = total ? (subject.present / total) * 100 : 0;
  return { ...subject, total, percentage };
}

function calculateOverallAttendance() {
  const totals = subjects.reduce((result, subject) => {
    result.present += subject.present;
    result.absent += subject.absent;
    return result;
  }, { present: 0, absent: 0 });
  const total = totals.present + totals.absent;
  return { ...totals, total, percentage: total ? (totals.present / total) * 100 : 0 };
}

function getStatus(percentage) {
  if (percentage >= 75) return { label: "Safe", className: "safe", message: "You're in a healthy attendance range.", color: "var(--green)" };
  if (percentage >= 65) return { label: "Low attendance", className: "low", message: "A little consistency will bring this back up.", color: "var(--yellow)" };
  return { label: "Critical", className: "critical", message: "Prioritize upcoming classes to recover.", color: "var(--red)" };
}

function getPlannerText(subject) {
  const { present, absent, percentage } = calculateAttendance(subject);
  if (percentage >= 75) {
    let missed = 0;
    while ((present / (present + absent + missed + 1)) * 100 >= 75) missed++;
    return missed ? `<strong>${missed} class${missed === 1 ? "" : "es"}</strong> you can miss while staying at 75%` : "Attend the next class to stay at 75%";
  }
  let needed = 0;
  while ((present + needed) / (present + absent + needed) * 100 < 75 && needed < 10000) needed++;
  return `<strong>${needed} class${needed === 1 ? "" : "es"}</strong> needed to reach 75%`;
}

function renderSubjects() {
  if (!subjects.length) {
    elements.subjectsGrid.innerHTML = `<div class="empty-state"><div class="empty-icon">＋</div><h3>No subjects added yet</h3><p>Add your first subject to start tracking attendance.</p><button class="button button-primary" type="button" data-action="add-empty">＋ Add Subject</button></div>`;
    return;
  }
  elements.subjectsGrid.innerHTML = subjects.map((subject, index) => {
    const details = calculateAttendance(subject);
    const status = getStatus(details.percentage);
    const initial = subject.name.trim().charAt(0).toUpperCase() || "S";
    return `<article class="subject-card glass-card" data-index="${index}">
      <div class="subject-top"><div class="subject-title-wrap"><span class="subject-icon">${initial}</span><div><div class="subject-name" title="${escapeHtml(subject.name)}">${escapeHtml(subject.name)}</div><div class="subject-code">${escapeHtml(subject.code || "No code added")}</div></div></div><strong class="subject-percent ${status.className}">${formatPercentage(details.percentage)}%</strong></div>
      <div class="subject-meta"><span><strong>${details.present}</strong> present / <strong>${details.absent}</strong> absent</span><span>${details.total} total</span></div>
      <div class="bar-track"><div class="bar-fill" data-progress="${details.percentage}" data-color="${status.color}"></div></div>
      <div class="planner"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v3M18 3v3M4 9h16M6 13h3M6 17h3M14 13h4M14 17h4M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Attendance planner: ${getPlannerText(subject)}</span></div>
      <div class="card-actions"><button class="action-button primary-action" type="button" data-action="present" data-id="${subject.id}">＋ Present</button><button class="action-button primary-action" type="button" data-action="absent" data-id="${subject.id}">＋ Absent</button><button class="action-button icon-action" type="button" data-action="edit" data-id="${subject.id}" aria-label="Edit ${escapeHtml(subject.name)}" title="Edit subject">✎</button><button class="action-button icon-action delete" type="button" data-action="delete" data-id="${subject.id}" aria-label="Delete ${escapeHtml(subject.name)}" title="Delete subject">⌫</button></div>
    </article>`;
  }).join("");
}

function updateDashboard() {
  const overall = calculateOverallAttendance();
  const status = getStatus(overall.percentage);
  elements.overallPercentage.textContent = `${formatPercentage(overall.percentage)}%`;
  elements.overallRing.style.setProperty("--progress", `${overall.percentage}%`);
  elements.overallRing.style.setProperty("--ring-color", status.color);
  elements.overallStatus.textContent = status.label;
  elements.overallStatus.className = `status-badge ${status.className}`;
  elements.statusMessage.textContent = status.message;
  elements.presentCount.textContent = overall.present;
  elements.absentCount.textContent = overall.absent;
  elements.totalCount.textContent = overall.total;
  elements.subjectCount.textContent = subjects.length;
  renderSubjects();
  elements.subjectsGrid.querySelectorAll(".subject-card").forEach((card) => {
    const index = Number(card.dataset.index) || 0;
    card.style.setProperty("--card-delay", `${index * 55}ms`);
  });
  elements.subjectsGrid.querySelectorAll(".bar-fill").forEach((bar) => {
    bar.style.setProperty("--bar-width", `${bar.dataset.progress}%`);
    bar.style.setProperty("--bar-color", bar.dataset.color);
  });
}

function addSubject(event) {
  event.preventDefault();
  const data = readForm();
  if (!validateForm(data)) return;
  subjects.push({ id: makeId(), ...data });
  saveData(); updateDashboard(); closeModal(elements.subjectModal); showToast("Subject added");
}

function editSubject(id) {
  const subject = subjects.find((item) => item.id === id);
  if (!subject) return;
  elements.subjectId.value = subject.id; elements.subjectName.value = subject.name; elements.subjectCode.value = subject.code;
  elements.subjectPresent.value = subject.present; elements.subjectAbsent.value = subject.absent; elements.modalTitle.textContent = "Edit subject"; elements.submitSubject.textContent = "Save changes"; elements.formError.textContent = "";
  openModal(elements.subjectModal);
}

function saveEditedSubject(event) {
  event.preventDefault();
  const data = readForm();
  if (!validateForm(data)) return;
  const id = elements.subjectId.value;
  const index = subjects.findIndex((subject) => subject.id === id);
  if (index === -1) return;
  subjects[index] = { ...subjects[index], ...data }; saveData(); updateDashboard(); closeModal(elements.subjectModal); showToast("Subject updated");
}

function deleteSubject(id) {
  subjectToDelete = id; openModal(elements.deleteModal);
}

function confirmDelete() {
  const subject = subjects.find((item) => item.id === subjectToDelete);
  subjects = subjects.filter((item) => item.id !== subjectToDelete); saveData(); updateDashboard(); closeModal(elements.deleteModal); subjectToDelete = null;
  if (subject) showToast(`${subject.name} deleted`);
}

function markPresent(id) { updateAttendance(id, "present"); showToast("Attendance marked present"); }
function markAbsent(id) { updateAttendance(id, "absent"); showToast("Attendance marked absent"); }
function updateAttendance(id, type) {
  const subject = subjects.find((item) => item.id === id);
  if (!subject) return;
  subject[type]++; saveData(); updateDashboard();
}

function readForm() { return { name: elements.subjectName.value.trim(), code: elements.subjectCode.value.trim(), present: Number(elements.subjectPresent.value), absent: Number(elements.subjectAbsent.value) }; }
function validateForm(data) {
  let error = "";
  if (!data.name) error = "Enter a subject name.";
  else if (!Number.isInteger(data.present) || data.present < 0 || !Number.isInteger(data.absent) || data.absent < 0) error = "Class counts must be zero or a whole number.";
  else if (data.present > 9999 || data.absent > 9999) error = "Class counts must be below 10,000.";
  elements.formError.textContent = error; return !error;
}
function resetForm() { elements.subjectForm.reset(); elements.subjectId.value = ""; elements.subjectPresent.value = 0; elements.subjectAbsent.value = 0; elements.modalTitle.textContent = "Add a subject"; elements.submitSubject.textContent = "Add Subject"; elements.formError.textContent = ""; }
function openModal(modal) { modal.classList.add("open"); modal.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; }
function closeModal(modal) { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; if (modal === elements.subjectModal) resetForm(); }
function showToast(message) { const toast = document.createElement("div"); toast.className = "toast"; toast.textContent = message; elements.toastRegion.appendChild(toast); setTimeout(() => { toast.classList.add("out"); toast.addEventListener("animationend", () => toast.remove(), { once: true }); }, 2500); }
function formatPercentage(value) { return Number.isInteger(value) ? value.toString() : value.toFixed(1); }
function makeId() { return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; }
function escapeHtml(value) { return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character])); }

function initializeApp() {
  Object.assign(elements, { subjectsGrid: document.getElementById("subjectsGrid"), overallPercentage: document.getElementById("overallPercentage"), overallRing: document.getElementById("overallRing"), overallStatus: document.getElementById("overallStatus"), statusMessage: document.getElementById("statusMessage"), presentCount: document.getElementById("presentCount"), absentCount: document.getElementById("absentCount"), totalCount: document.getElementById("totalCount"), subjectCount: document.getElementById("subjectCount"), subjectModal: document.getElementById("subjectModal"), deleteModal: document.getElementById("deleteModal"), subjectForm: document.getElementById("subjectForm"), subjectId: document.getElementById("subjectId"), subjectName: document.getElementById("subjectName"), subjectCode: document.getElementById("subjectCode"), subjectPresent: document.getElementById("subjectPresent"), subjectAbsent: document.getElementById("subjectAbsent"), modalTitle: document.getElementById("modalTitle"), submitSubject: document.getElementById("submitSubject"), formError: document.getElementById("formError"), confirmDelete: document.getElementById("confirmDelete"), toastRegion: document.getElementById("toastRegion") });
  loadData(); updateDashboard();
  document.getElementById("openAddButton").addEventListener("click", () => openModal(elements.subjectModal));
  elements.subjectForm.addEventListener("submit", (event) => elements.subjectId.value ? saveEditedSubject(event) : addSubject(event));
  elements.confirmDelete.addEventListener("click", confirmDelete);
  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]");
    if (action) { const { id } = action.dataset; if (action.dataset.action === "present") markPresent(id); if (action.dataset.action === "absent") markAbsent(id); if (action.dataset.action === "edit") editSubject(id); if (action.dataset.action === "delete") deleteSubject(id); if (action.dataset.action === "add-empty") openModal(elements.subjectModal); }
    if (event.target.matches("[data-close-modal]")) closeModal(event.target.closest(".modal-backdrop"));
    if (event.target.classList.contains("modal-backdrop")) closeModal(event.target);
  });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") document.querySelectorAll(".modal-backdrop.open").forEach(closeModal); });
}

document.addEventListener("DOMContentLoaded", initializeApp);
