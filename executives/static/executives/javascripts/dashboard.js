// 15 shades of #003366 for pie chart
const pieBgColors = [
  "#003366", // base navy blue
  "#00509e", // strong blue
  "#0074d9", // vivid blue
  "#1a4d80", // muted blue
  "#2986cc", // medium blue
  "#3399ff", // light blue
  "#66b2ff", // sky blue
  "#80c1ff", // pastel blue
  "#b3d1ff", // pale blue
  "#ffd700", // gold (accent)
  "#ffb84d", // warm gold
  "#ffdb99", // light gold
  "#4d79ff", // blue-violet
  "#336699", // steel blue
  "#6699cc", // soft blue
];

// 1. Total Enrollment
new Chart(document.getElementById("enrollmentChart"), {
  type: "bar",
  data: {
    labels: window.enrollmentPerYear.years,
    datasets: [
      {
        label: "Total Enrollment",
        data: window.enrollmentPerYear.enrollments,
        backgroundColor: "#003366",
        borderColor: "#00264d",
        hoverBackgroundColor: "#1a4d80",
        borderWidth: 2,
      },
    ],
  },
  options: {
    plugins: {
      legend: { labels: { color: "#003366" } },
    },
    scales: {
      x: { ticks: { color: "#003366" }, grid: { color: "#FFD700" } },
      y: { ticks: { color: "#003366" }, grid: { color: "#FFD700" } },
      x: {
        ticks: { color: "#003366" },
        grid: { color: "#FFD700" },
        title: { display: true, text: "Year", color: "#003366" },
      },
      y: {
        ticks: { color: "#003366" },
        grid: { color: "#FFD700" },
        title: { display: true, text: "Enrollment", color: "#003366" },
      },
    },
  },
});

// 2. Degree Percentage (Pie)
const degreePieLabels = window.enrollmentPercentByDegree.degrees;
new Chart(document.getElementById("degreePieChart"), {
  type: "pie",
  data: {
    labels: degreePieLabels,
    datasets: [
      {
        data: window.enrollmentPercentByDegree.percentages,
        backgroundColor: pieBgColors.slice(0, degreePieLabels.length),
        borderColor: pieBgColors.slice(0, degreePieLabels.length),
        borderWidth: 2,
      },
    ],
  },
  options: {
    plugins: {
      legend: { labels: { color: "#003366" } },
    },
  },
});

// 3. Course Rate
new Chart(document.getElementById("courseRateChart"), {
  type: "bar",
  data: {
    labels: ["Math", "Physics", "Chemistry", "Biology"],
    datasets: [
      {
        label: "Students per Course",
        data: [40, 35, 30, 25],
        backgroundColor: ["#FFD700", "#003366", "#1a4d80", "#00264d"],
        borderColor: "#003366",
        borderWidth: 2,
      },
    ],
  },
  options: {
    plugins: {
      legend: { labels: { color: "#003366" } },
    },
    scales: {
      x: {
        ticks: { color: "#003366" },
        grid: { color: "#FFD700" },
        title: { display: true, text: "Course", color: "#003366" },
      },
      y: {
        ticks: { color: "#003366" },
        grid: { color: "#FFD700" },
        title: { display: true, text: "Students", color: "#003366" },
      },
    },
  },
});

// 4. Gender Ratio (Dual Axis)
new Chart(document.getElementById("genderRatioChart"), {
  type: "bar",
  data: {
    labels: window.enrollmentGenderRatio.years,
    datasets: [
      {
        label: "Male",
        data: window.enrollmentGenderRatio.males,
        backgroundColor: "#003366",
        borderColor: "#00264d",
        yAxisID: "y",
      },
      {
        label: "Female",
        data: window.enrollmentGenderRatio.females,
        backgroundColor: "#FFD700",
        borderColor: "#FFD700",
        yAxisID: "y",
      },
    ],
  },
  options: {
    plugins: {
      legend: { labels: { color: "#003366" } },
    },
    scales: {
      x: {
        ticks: { color: "#003366" },
        grid: { color: "#FFD700" },
        title: { display: true, text: "Year", color: "#003366" },
      },
      y: {
        beginAtZero: true,
        position: "left",
        title: { display: true, text: "Count", color: "#003366" },
        ticks: { color: "#003366" },
        grid: { color: "#FFD700" },
      },
      y1: {
        beginAtZero: true,
        position: "right",
        title: { display: true, text: "Percentage", color: "#003366" },
        min: 0,
        max: 100,
        ticks: { color: "#003366" },
        grid: { color: "#FFD700" },
      },
    },
  },
});

// 5. Annual Average GPA
new Chart(document.getElementById("gpaChart"), {
  type: "line",
  data: {
    labels: window.averageGPAPerYear.years,
    datasets: [
      {
        label: "Average GPA",
        data: window.averageGPAPerYear.gpas,
        borderColor: "#003366",
        backgroundColor: "rgba(0, 51, 102, 0.15)",
        pointBackgroundColor: "#FFD700",
        pointBorderColor: "#003366",
        fill: true,
        tension: 0.4, // Makes the line curved
      },
    ],
  },
  options: {
    plugins: {
      legend: { labels: { color: "#003366" } },
    },
    scales: {
      x: {
        ticks: { color: "#003366" },
        grid: { color: "#FFD700" },
        title: { display: true, text: "Year", color: "#003366" },
      },
      y: {
        ticks: { color: "#003366" },
        grid: { color: "#FFD700" },
        title: { display: true, text: "GPA", color: "#003366" },
      },
    },
  },
});
