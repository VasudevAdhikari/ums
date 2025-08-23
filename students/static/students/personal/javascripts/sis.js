document.addEventListener("DOMContentLoaded", function () {
  let currentStep = 1;
  const totalSteps = 4;
  const steps = [];
  for (let i = 1; i <= totalSteps; i++) {
    steps.push(document.getElementById(`step-${i}`));
  }
  const backBtn = document.getElementById("backBtn");
  const nextBtn = document.getElementById("nextBtn");
  const submitBtn = document.getElementById("submitBtn");
  const circles = [];
  for (let i = 1; i <= totalSteps; i++) {
    circles.push(document.getElementById(`circle-${i}`));
  }

  function showStep(step) {
    steps.forEach((el, idx) => {
      el.classList.toggle("d-none", idx !== step - 1);
    });
    circles.forEach((el, idx) => {
      el.classList.toggle("active", idx === step - 1);
    });
    backBtn.style.display = step === 1 ? "none" : "";
    if (step === totalSteps) {
      nextBtn.style.display = "none";
      submitBtn.style.display = "";
      submitBtn.disabled = false;
    } else {
      nextBtn.style.display = "";
      nextBtn.disabled = false;
      submitBtn.style.display = "none";
      submitBtn.disabled = true;
    }
  }

  nextBtn.addEventListener("click", function () {
    if (currentStep < totalSteps) {
      currentStep++;
      showStep(currentStep);
    }
  });

  backBtn.addEventListener("click", function () {
    if (currentStep > 1) {
      currentStep--;
      showStep(currentStep);
    }
  });

  circles.forEach((circle, idx) => {
    circle.addEventListener("click", function () {
      currentStep = idx + 1;
      showStep(currentStep);
    });
  });

  // Spouse field enable/disable
  const hasSpouse = document.getElementById("has_spouse");
  const spouseName = document.getElementById("spouse_name");
  if (hasSpouse && spouseName) {
    hasSpouse.addEventListener("change", function () {
      spouseName.disabled = !this.checked;
      if (!this.checked) spouseName.value = "";
    });
  }

  // Prevent form submit for demo
  const sisForm = document.getElementById("multiStepForm")
  sisForm.addEventListener("submit", async function (e) {
    e.preventDefault(); // Uncomment to prevent actual submission
    if (!await confirm('Are you sure to submit your sis form?')) return;
    sisForm.submit();
  });

  // Initialize
  showStep(currentStep);
});
