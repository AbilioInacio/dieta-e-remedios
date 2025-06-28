document.addEventListener("DOMContentLoaded", () => {
  const pages = document.querySelectorAll(".page");
  const navButtons = document.querySelectorAll(".nav-btn");
  const { jsPDF } = window.jspdf;

  // Estrutura de dados inicial
  let appData = {
    medications: [],
    diet: [],
    workouts: [],
    progress: {
      settings: {
        weight: true,
        bodyFat: false,
        glucose: false,
        cholesterol: false,
        waist: false,
        hips: false,
        skinfolds: 0,
      },
      history: [],
    },
    lastUpdateCheck: null,
  };

  // --- FUNÇÕES DE DADOS (CARREGAR E SALVAR) ---
  function saveData() {
    localStorage.setItem("healthTrackerData", JSON.stringify(appData));
  }

  function loadData() {
    const data = localStorage.getItem("healthTrackerData");
    if (data) {
      appData = JSON.parse(data);
    }
  }

  // --- LÓGICA DE NAVEGAÇÃO ---
  function showPage(pageId) {
    pages.forEach((page) => {
      page.classList.remove("active");
      if (page.id === pageId) {
        page.classList.add("active");
      }
    });
    navButtons.forEach((btn) => {
      btn.classList.remove("active");
      if (btn.dataset.page === pageId.replace("-page", "")) {
        btn.classList.add("active");
      }
    });
  }

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const pageId = button.dataset.page + "-page";
      showPage(pageId);
    });
  });

  // --- POPULAR ELEMENTOS DINÂMICOS ---
  function populateTimeSelect() {
    const select = document.getElementById("med-time");
    if (!select) return;
    select.innerHTML = "";
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour = h.toString().padStart(2, "0");
        const minute = m.toString().padStart(2, "0");
        const time = `${hour}:${minute}`;
        const option = document.createElement("option");
        option.value = time;
        option.textContent = time;
        select.appendChild(option);
      }
    }
  }

  // --- SEÇÃO DE MEDICAÇÕES ---
  const medForm = document.getElementById("med-form");
  const medList = document.getElementById("med-list");

  function renderMedications() {
    medList.innerHTML = "";
    const today = new Date().toISOString().slice(0, 10);
    appData.medications.forEach((med) => {
      const medCard = document.createElement("div");
      medCard.className = "item-card";

      const confirmedToday =
        med.history && med.history.some((h) => h.date === today && h.confirmed);
      if (confirmedToday) {
        medCard.classList.add("confirmed");
      }

      medCard.innerHTML = `
                <h3>${med.name} (${med.quantity})</h3>
                <p><strong>Horário:</strong> ${med.time}</p>
                <p><strong>Periodicidade:</strong> ${med.period}</p>
                <p><strong>Marcas/Testes:</strong> ${med.brands}</p>
                <p><strong>Observações:</strong> ${med.obs}</p>
                <div class="actions">
                    <button class="confirm-btn" data-id="${med.id}" ${
        confirmedToday ? "disabled" : ""
      }>Confirmar Dose de Hoje</button>
                    <button class="delete-btn" data-id="${
                      med.id
                    }">Remover</button>
                </div>
            `;
      medList.appendChild(medCard);
    });
  }

  medForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newMed = {
      id: Date.now(),
      name: document.getElementById("med-name").value,
      quantity: document.getElementById("med-quantity").value,
      brands: document.getElementById("med-brands").value,
      time: document.getElementById("med-time").value,
      period: document.getElementById("med-period").value,
      obs: document.getElementById("med-obs").value,
      history: [],
    };
    appData.medications.push(newMed);
    saveData();
    renderMedications();
    medForm.reset();
  });

  medList.addEventListener("click", (e) => {
    const id = parseInt(e.target.dataset.id);
    if (e.target.classList.contains("delete-btn")) {
      appData.medications = appData.medications.filter((med) => med.id !== id);
    }
    if (e.target.classList.contains("confirm-btn")) {
      const med = appData.medications.find((m) => m.id === id);
      const today = new Date().toISOString().slice(0, 10);
      if (med) {
        if (!med.history) med.history = [];
        med.history.push({ date: today, confirmed: true });
      }
    }
    saveData();
    renderMedications();
    renderDashboard();
  });

  // --- LÓGICA DAS OUTRAS SEÇÕES (Dieta, Treino) ---
  // Seguem um padrão similar a Medicações: form, list, render, event listeners
  // Para abreviar, aqui está a estrutura básica.

  // DIETA
  const dietForm = document.getElementById("diet-form");
  const dietList = document.getElementById("diet-list");

  function renderDiet() {
    dietList.innerHTML = "";
    appData.diet.forEach((meal) => {
      const mealCard = document.createElement("div");
      mealCard.className = "item-card";
      mealCard.innerHTML = `
                <h3>${meal.name}</h3>
                <p>${meal.items}</p>
                <div class="actions">
                    <button class="delete-btn" data-id="${meal.id}">Remover</button>
                </div>
            `;
      dietList.appendChild(mealCard);
    });
  }
  dietForm.addEventListener("submit", (e) => {
    /* ... adicionar item ... */ e.preventDefault();
    appData.diet.push({
      id: Date.now(),
      name: document.getElementById("meal-name").value,
      items: document.getElementById("meal-items").value,
    });
    saveData();
    renderDiet();
    dietForm.reset();
  });
  dietList.addEventListener("click", (e) => {
    /* ... remover item ... */ if (e.target.classList.contains("delete-btn")) {
      appData.diet = appData.diet.filter(
        (d) => d.id !== parseInt(e.target.dataset.id)
      );
      saveData();
      renderDiet();
    }
  });

  // TREINO
  const workoutForm = document.getElementById("workout-form");
  const workoutList = document.getElementById("workout-list");
  function renderWorkouts() {
    workoutList.innerHTML = "";
    // Ordenar por dia da semana
    const weekOrder = [
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
      "Domingo",
    ];
    const sortedWorkouts = [...appData.workouts].sort(
      (a, b) => weekOrder.indexOf(a.day) - weekOrder.indexOf(b.day)
    );

    sortedWorkouts.forEach((workout) => {
      const workoutCard = document.createElement("div");
      workoutCard.className = "item-card";
      workoutCard.innerHTML = `
                <h3>${workout.day} - ${workout.group}</h3>
                <p>${workout.exercises}</p>
                <div class="actions">
                    <button class="delete-btn" data-id="${workout.id}">Remover</button>
                </div>
            `;
      workoutList.appendChild(workoutCard);
    });
  }
  workoutForm.addEventListener("submit", (e) => {
    /* ... */ e.preventDefault();
    appData.workouts.push({
      id: Date.now(),
      day: document.getElementById("workout-day").value,
      group: document.getElementById("muscle-group").value,
      exercises: document.getElementById("exercises").value,
    });
    saveData();
    renderWorkouts();
    workoutForm.reset();
  });
  workoutList.addEventListener("click", (e) => {
    /* ... */ if (e.target.classList.contains("delete-btn")) {
      appData.workouts = appData.workouts.filter(
        (w) => w.id !== parseInt(e.target.dataset.id)
      );
      saveData();
      renderWorkouts();
    }
  });

  // --- SEÇÃO DE PROGRESSO ---
  const trackingSettings = document.getElementById("tracking-settings");
  const saveSettingsBtn = document.getElementById("save-tracking-settings");
  const progressForm = document.getElementById("progress-form");
  const progressInputs = document.getElementById("progress-inputs");
  const progressHistory = document.getElementById("progress-history");

  function renderProgressSettings() {
    const settings = appData.progress.settings;
    for (const key in settings) {
      if (key === "skinfolds") {
        document.getElementById("skinfolds-number").value = settings[key];
      } else {
        const checkbox = trackingSettings.querySelector(
          `[data-metric="${key}"]`
        );
        if (checkbox) checkbox.checked = settings[key];
      }
    }
    renderProgressInputs();
  }

  function renderProgressInputs() {
    progressInputs.innerHTML = "";
    const settings = appData.progress.settings;
    for (const metric in settings) {
      if (settings[metric] && metric !== "skinfolds") {
        progressInputs.innerHTML += `
                    <label>${metric.charAt(0).toUpperCase() + metric.slice(1)}:
                        <input type="number" step="0.1" name="${metric}" placeholder="${metric}">
                    </label>
                `;
      }
    }
    if (settings.skinfolds > 0) {
      for (let i = 1; i <= settings.skinfolds; i++) {
        progressInputs.innerHTML += `
                     <label>Dobra Cutânea ${i}:
                        <input type="number" step="0.1" name="skinfold_${i}" placeholder="Dobra ${i} (mm)">
                    </label>
                `;
      }
    }
  }

  function renderProgressHistory() {
    progressHistory.innerHTML = "";
    [...appData.progress.history].reverse().forEach((entry) => {
      const entryCard = document.createElement("div");
      entryCard.className = "item-card";
      let content = `<h3>Registro de ${new Date(
        entry.date + "T00:00:00"
      ).toLocaleDateString()}</h3>`;
      for (const key in entry.metrics) {
        content += `<p><strong>${key.replace("_", " ")}:</strong> ${
          entry.metrics[key]
        }</p>`;
      }
      content += `<div class="actions"><button class="delete-btn" data-id="${entry.id}">Remover</button></div>`;
      entryCard.innerHTML = content;
      progressHistory.appendChild(entryCard);
    });
  }

  saveSettingsBtn.addEventListener("click", () => {
    const checkboxes = trackingSettings.querySelectorAll(
      'input[type="checkbox"]'
    );
    checkboxes.forEach((cb) => {
      appData.progress.settings[cb.dataset.metric] = cb.checked;
    });
    appData.progress.settings.skinfolds =
      parseInt(document.getElementById("skinfolds-number").value) || 0;
    saveData();
    renderProgressInputs();
    alert("Configurações salvas!");
  });

  progressForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newEntry = {
      id: Date.now(),
      date: document.getElementById("progress-date").value,
      metrics: {},
    };
    const inputs = progressInputs.querySelectorAll("input");
    inputs.forEach((input) => {
      if (input.value) {
        newEntry.metrics[input.name] = input.value;
      }
    });
    appData.progress.history.push(newEntry);
    saveData();
    renderProgressHistory();
    renderDashboard();
    progressForm.reset();
  });

  progressHistory.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
      const id = parseInt(e.target.dataset.id);
      appData.progress.history = appData.progress.history.filter(
        (h) => h.id !== id
      );
      saveData();
      renderProgressHistory();
    }
  });

  // --- SEÇÃO DE DASHBOARD ---
  function renderDashboard() {
    const summary = document.getElementById("dashboard-summary");
    const today = new Date();
    const dayOfWeek = today.toLocaleString("pt-BR", { weekday: "long" });

    // Medicações do dia
    let medHtml = '<h4><i class="fas fa-pills"></i> Medicações para Hoje</h4>';
    const todayMeds = appData.medications
      .filter((med) => {
        // Lógica de periodicidade pode ser mais complexa. Por simplicidade, mostramos todas.
        return true;
      })
      .sort((a, b) => a.time.localeCompare(b.time));

    if (todayMeds.length > 0) {
      medHtml += "<ul>";
      todayMeds.forEach((med) => {
        const confirmedToday =
          med.history &&
          med.history.some(
            (h) => h.date === today.toISOString().slice(0, 10) && h.confirmed
          );
        medHtml += `<li class="${confirmedToday ? "confirmed" : ""}">${
          med.time
        } - ${med.name} ${confirmedToday ? "(Confirmado ✓)" : ""}</li>`;
      });
      medHtml += "</ul>";
    } else {
      medHtml += "<p>Nenhuma medicação programada.</p>";
    }

    // Treino do dia
    let workoutHtml = `<h4><i class="fas fa-dumbbell"></i> Treino de Hoje (${dayOfWeek})</h4>`;
    const todayWorkout = appData.workouts.find(
      (w) => w.day.toLowerCase() === dayOfWeek.toLowerCase()
    );
    if (todayWorkout) {
      workoutHtml += `<p><strong>${todayWorkout.group}:</strong> ${todayWorkout.exercises}</p>`;
    } else {
      workoutHtml += "<p>Dia de descanso!</p>";
    }

    // Último progresso
    let progressHtml =
      '<h4><i class="fas fa-chart-line"></i> Último Progresso Registrado</h4>';
    const lastProgress =
      appData.progress.history.length > 0
        ? appData.progress.history[appData.progress.history.length - 1]
        : null;
    if (lastProgress) {
      progressHtml += `<p>Data: ${new Date(
        lastProgress.date + "T00:00:00"
      ).toLocaleDateString()}</p>`;
      for (const key in lastProgress.metrics) {
        progressHtml += `<p><strong>${key.replace("_", " ")}:</strong> ${
          lastProgress.metrics[key]
        }</p>`;
      }
    } else {
      progressHtml += "<p>Nenhum registro de progresso ainda.</p>";
    }

    summary.innerHTML = `<div class="item-card">${medHtml}</div><div class="item-card">${workoutHtml}</div><div class="item-card">${progressHtml}</div>`;
  }

  // --- GERAÇÃO DE PDF ---
  document.getElementById("generate-med-pdf").addEventListener("click", () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Rotina de Medicações", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    let y = 30;
    appData.medications.forEach((med) => {
      if (y > 280) {
        // Nova página
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(12);
      doc.text(`${med.name} (${med.quantity})`, 14, (y += 10));
      doc.setFontSize(10);
      doc.text(
        `- Horário: ${med.time} | Periodicidade: ${med.period}`,
        16,
        (y += 6)
      );
      doc.text(
        `- Marcas e Testes: ${doc.splitTextToSize(med.brands, 170)}`,
        16,
        (y += 6)
      );
      y += (doc.splitTextToSize(med.brands, 170).length - 1) * 5;
      doc.text(
        `- Observações: ${doc.splitTextToSize(med.obs, 170)}`,
        16,
        (y += 6)
      );
      y += (doc.splitTextToSize(med.obs, 170).length - 1) * 5;
      y += 5;
    });

    doc.save("rotina_medicacoes.pdf");
  });

  document
    .getElementById("generate-progress-pdf")
    .addEventListener("click", () => {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Resumo de Progresso e Medicações", 14, 22);

      let y = 30;
      // Resumo de medicações
      doc.setFontSize(14);
      doc.text("Introdução de Medicações", 14, (y += 10));
      doc.setFontSize(10);
      appData.medications.forEach((med) => {
        doc.text(`- ${med.name}`, 16, (y += 6));
      });

      // Histórico de progresso
      y += 15;
      doc.setFontSize(14);
      doc.text("Histórico de Métricas Corporais", 14, y);
      doc.setFontSize(10);
      appData.progress.history.forEach((entry) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setLineWidth(0.1);
        doc.line(14, y + 2, 200, y + 2);
        doc.setFontSize(11);
        doc.text(
          `Data: ${new Date(entry.date + "T00:00:00").toLocaleDateString()}`,
          14,
          (y += 8)
        );
        doc.setFontSize(10);
        let metricsText = "";
        for (const key in entry.metrics) {
          metricsText += `${key.replace("_", " ")}: ${entry.metrics[key]} | `;
        }
        doc.text(doc.splitTextToSize(metricsText, 180), 16, (y += 6));
        y += doc.splitTextToSize(metricsText, 180).length * 5;
      });

      doc.save("resumo_progresso.pdf");
    });

  // --- LEMBRETE SEMANAL ---
  const reminderModal = document.getElementById("reminder-modal");
  const closeBtn = document.querySelector(".close-button");
  const goToProgressBtn = document.getElementById("go-to-progress-btn");

  function checkWeeklyReminder() {
    const lastCheck = appData.lastUpdateCheck
      ? new Date(appData.lastUpdateCheck)
      : null;
    if (!lastCheck) {
      // Primeira vez, não mostra
      appData.lastUpdateCheck = new Date().toISOString();
      saveData();
      return;
    }

    const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
    const now = new Date();

    if (now.getTime() - lastCheck.getTime() > oneWeekInMs) {
      reminderModal.style.display = "block";
    }
  }

  closeBtn.onclick = () => {
    reminderModal.style.display = "none";
    appData.lastUpdateCheck = new Date().toISOString();
    saveData();
  };
  goToProgressBtn.onclick = () => {
    showPage("progress-page");
    reminderModal.style.display = "none";
    appData.lastUpdateCheck = new Date().toISOString();
    saveData();
  };
  window.onclick = (event) => {
    if (event.target == reminderModal) {
      reminderModal.style.display = "none";
      appData.lastUpdateCheck = new Date().toISOString();
      saveData();
    }
  };

  // --- INICIALIZAÇÃO DO APP ---
  function initializeApp() {
    loadData();
    populateTimeSelect();

    // Renderizar todas as seções
    renderMedications();
    renderDiet();
    renderWorkouts();
    renderProgressSettings();
    renderProgressHistory();
    renderDashboard();

    showPage("dashboard-page"); // Começa no dashboard
    checkWeeklyReminder();
  }

  initializeApp();
});
