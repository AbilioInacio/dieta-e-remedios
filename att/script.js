document.addEventListener("DOMContentLoaded", () => {
  // --- ELEMENTOS DO DOM ---
  const navButtons = document.querySelectorAll(".nav-btn");
  const contentSections = document.querySelectorAll(".content-section");
  const addMedBtn = document.getElementById("add-med-btn");
  const medModal = document.getElementById("med-modal");
  const medForm = document.getElementById("med-form");
  const medList = document.getElementById("med-list");
  const closeModalBtns = document.querySelectorAll(".close-btn");

  const saveDietBtn = document.getElementById("save-diet-btn");
  const dietInputs = {
    breakfast: document.getElementById("diet-breakfast"),
    lunch: document.getElementById("diet-lunch"),
    dinner: document.getElementById("diet-dinner"),
    snacks: document.getElementById("diet-snacks"),
  };

  const addMetricBtn = document.getElementById("add-metric-btn");
  const metricModal = document.getElementById("metric-modal");
  const metricForm = document.getElementById("metric-form");
  const metricsList = document.getElementById("metrics-list");

  const todayMedsContainer = document.getElementById("today-meds");

  const exportMedsPdfBtn = document.getElementById("export-meds-pdf");
  const exportSummaryPdfBtn = document.getElementById("export-summary-pdf");

  // --- ESTADO DO APP ---
  let state = {
    medications: [],
    diet: { breakfast: "", lunch: "", dinner: "", snacks: "" },
    metrics: [],
  };

  // --- FUNÇÕES DE DADOS (LOCAL STORAGE) ---
  const saveData = () => {
    localStorage.setItem("healthAppData", JSON.stringify(state));
  };

  const loadData = () => {
    const data = localStorage.getItem("healthAppData");
    if (data) {
      state = JSON.parse(data);
    }
  };

  // --- FUNÇÕES DE RENDERIZAÇÃO ---
  const renderMeds = () => {
    medList.innerHTML = "";
    if (state.medications.length === 0) {
      medList.innerHTML = "<p>Nenhuma medicação adicionada ainda.</p>";
      return;
    }

    state.medications.forEach((med) => {
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.id = med.id;

      card.innerHTML = `
                <h3>${med.name}</h3>
                <p><strong>Quantidade:</strong> ${med.quantity}</p>
                <div class="timings"><strong>Horários:</strong> ${med.timings
                  .map((t) => `<span>${t}</span>`)
                  .join(" ")}</div>
                <p><strong>Marcas/Testes:</strong> ${med.brands.replace(
                  /\n/g,
                  "<br>"
                )}</p>
                <p><strong>Recomendações:</strong> ${med.recommendations.replace(
                  /\n/g,
                  "<br>"
                )}</p>
                <div class="card-actions">
                    <button class="action-btn confirm" data-id="${
                      med.id
                    }"><i class="fa-solid fa-check"></i> Confirmar Dose</button>
                    <button class="action-btn edit" data-id="${
                      med.id
                    }"><i class="fa-solid fa-pen"></i> Editar</button>
                    <button class="action-btn delete" data-id="${
                      med.id
                    }"><i class="fa-solid fa-trash"></i> Excluir</button>
                </div>
                <div class="taken-log">
                    <p><strong>Histórico de consumo:</strong></p>
                    <ul>${(med.takenLog || [])
                      .map(
                        (log) =>
                          `<li>Tomado em: ${new Date(log).toLocaleString(
                            "pt-BR"
                          )}</li>`
                      )
                      .join("")}</ul>
                </div>
            `;
      medList.appendChild(card);
    });
  };

  const renderTodayDashboard = () => {
    todayMedsContainer.innerHTML = "";
    const today = new Date();
    const now = today.getHours() * 60 + today.getMinutes(); // Tempo em minutos

    const todayMeds = state.medications.filter((med) => {
      // Lógica simples: mostra todos os medicamentos do dia no dashboard
      return med.timings.length > 0;
    });

    if (todayMeds.length === 0) {
      todayMedsContainer.innerHTML =
        "<p>Você não tem medicações agendadas.</p>";
      return;
    }

    todayMeds.forEach((med) => {
      const lastTaken =
        med.takenLog && med.takenLog.length > 0
          ? new Date(med.takenLog[med.takenLog.length - 1])
          : null;
      let takenToday = false;
      if (lastTaken && lastTaken.toDateString() === today.toDateString()) {
        takenToday = true;
      }

      const card = document.createElement("div");
      card.className = `card ${takenToday ? "taken" : ""}`;
      card.innerHTML = `
                <h3>${med.name}</h3>
                <div class="timings"><strong>Próximos horários:</strong> ${med.timings
                  .map((t) => `<span>${t}</span>`)
                  .join(" ")}</div>
                <p>${
                  takenToday
                    ? "✅ Dose de hoje já confirmada."
                    : "🔴 Pendente de confirmação."
                }</p>
                <div class="card-actions">
                    <button class="action-btn confirm" data-id="${
                      med.id
                    }"><i class="fa-solid fa-check"></i> Confirmar Dose de Hoje</button>
                </div>
            `;
      todayMedsContainer.appendChild(card);
    });
  };

  const renderDiet = () => {
    for (const key in dietInputs) {
      dietInputs[key].value = state.diet[key] || "";
    }
  };

  const renderMetrics = () => {
    metricsList.innerHTML = "";
    if (state.metrics.length === 0) {
      metricsList.innerHTML = "<p>Nenhuma métrica adicionada.</p>";
      return;
    }
    // Ordena do mais recente para o mais antigo
    const sortedMetrics = [...state.metrics].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    sortedMetrics.forEach((metric) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
                <h3>${new Date(metric.date + "T00:00:00").toLocaleDateString(
                  "pt-BR"
                )}</h3>
                ${
                  metric.weight
                    ? `<p><strong>Peso:</strong> ${metric.weight} kg</p>`
                    : ""
                }
                ${
                  metric.glucose
                    ? `<p><strong>Glicemia:</strong> ${metric.glucose} mg/dL</p>`
                    : ""
                }
                ${
                  metric.cholesterol
                    ? `<p><strong>Colesterol:</strong> ${metric.cholesterol} mg/dL</p>`
                    : ""
                }
                <p><strong>Observações:</strong> ${metric.notes.replace(
                  /\n/g,
                  "<br>"
                )}</p>
                <div class="card-actions">
                     <button class="action-btn delete-metric" data-id="${
                       metric.id
                     }"><i class="fa-solid fa-trash"></i> Excluir</button>
                </div>
            `;
      metricsList.appendChild(card);
    });
  };

  const renderAll = () => {
    renderMeds();
    renderDiet();
    renderMetrics();
    renderTodayDashboard();
  };

  // --- EVENT LISTENERS ---

  // Navegação entre seções
  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.id.replace("nav-", "") + "-section";

      navButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      contentSections.forEach((section) => {
        section.style.display = "none"; // Primeiro esconde todas
        section.classList.remove("active");
      });

      const activeSection = document.getElementById(targetId);
      activeSection.style.display = "block";
      activeSection.classList.add("active");

      if (targetId === "dashboard-section") {
        renderTodayDashboard();
      }
    });
  });

  // Abrir/Fechar Modais
  addMedBtn.addEventListener("click", () => {
    medForm.reset();
    medForm.querySelector("#med-id").value = "";
    medModal.querySelector("#modal-title").textContent = "Adicionar Medicação";
    medModal.style.display = "block";
  });

  addMetricBtn.addEventListener("click", () => {
    metricForm.reset();
    metricForm.querySelector("#metric-id").value = "";
    metricForm.querySelector("#metric-date").valueAsDate = new Date();
    metricModal.style.display = "block";
  });

  closeModalBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      medModal.style.display = "none";
      metricModal.style.display = "none";
    })
  );

  window.addEventListener("click", (e) => {
    if (e.target == medModal || e.target == metricModal) {
      medModal.style.display = "none";
      metricModal.style.display = "none";
    }
  });

  // Salvar Medicação (Adicionar/Editar)
  medForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("med-id").value;
    const medData = {
      id: id || Date.now().toString(),
      name: document.getElementById("med-name").value,
      quantity: document.getElementById("med-quantity").value,
      brands: document.getElementById("med-brands").value,
      timings: document
        .getElementById("med-timings")
        .value.split(",")
        .map((t) => t.trim()),
      recommendations: document.getElementById("med-recommendations").value,
      takenLog: id ? state.medications.find((m) => m.id === id).takenLog : [],
    };

    if (id) {
      // Editando
      const index = state.medications.findIndex((m) => m.id === id);
      state.medications[index] = medData;
    } else {
      // Adicionando
      state.medications.push(medData);
    }

    saveData();
    renderAll();
    medModal.style.display = "none";
  });

  // Ações nos Cards de Medicação (Confirmar, Editar, Excluir)
  medList.addEventListener("click", (e) => {
    const target = e.target.closest("button");
    if (!target) return;

    const id = target.dataset.id;
    if (target.classList.contains("delete")) {
      if (confirm("Tem certeza que deseja excluir esta medicação?")) {
        state.medications = state.medications.filter((m) => m.id !== id);
        saveData();
        renderAll();
      }
    } else if (target.classList.contains("edit")) {
      const med = state.medications.find((m) => m.id === id);
      document.getElementById("med-id").value = med.id;
      document.getElementById("med-name").value = med.name;
      document.getElementById("med-quantity").value = med.quantity;
      document.getElementById("med-brands").value = med.brands;
      document.getElementById("med-timings").value = med.timings.join(", ");
      document.getElementById("med-recommendations").value =
        med.recommendations;
      medModal.querySelector("#modal-title").textContent = "Editar Medicação";
      medModal.style.display = "block";
    } else if (target.classList.contains("confirm")) {
      confirmMed(id);
    }
  });

  todayMedsContainer.addEventListener("click", (e) => {
    const target = e.target.closest("button.confirm");
    if (target) {
      confirmMed(target.dataset.id);
    }
  });

  function confirmMed(id) {
    const med = state.medications.find((m) => m.id === id);
    if (!med.takenLog) {
      med.takenLog = [];
    }
    med.takenLog.push(new Date().toISOString());
    alert(`${med.name} confirmado como tomado!`);
    saveData();
    renderAll();
  }

  // Salvar Dieta
  saveDietBtn.addEventListener("click", () => {
    state.diet.breakfast = dietInputs.breakfast.value;
    state.diet.lunch = dietInputs.lunch.value;
    state.diet.dinner = dietInputs.dinner.value;
    state.diet.snacks = dietInputs.snacks.value;
    saveData();
    alert("Plano de dieta salvo!");
  });

  // Salvar Métrica
  metricForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const metricData = {
      id: Date.now().toString(),
      date: document.getElementById("metric-date").value,
      weight: document.getElementById("metric-weight").value,
      glucose: document.getElementById("metric-glucose").value,
      cholesterol: document.getElementById("metric-cholesterol").value,
      notes: document.getElementById("metric-notes").value,
    };
    state.metrics.push(metricData);
    saveData();
    renderMetrics();
    metricModal.style.display = "none";
  });

  metricsList.addEventListener("click", (e) => {
    const target = e.target.closest("button.delete-metric");
    if (target) {
      if (confirm("Tem certeza que deseja excluir esta métrica?")) {
        state.metrics = state.metrics.filter((m) => m.id !== target.dataset.id);
        saveData();
        renderMetrics();
      }
    }
  });

  // --- FUNÇÕES DE GERAÇÃO DE PDF ---
  exportMedsPdfBtn.addEventListener("click", () => {
    let content = `<h1>Relatório de Rotina de Medicações</h1>`;
    state.medications.forEach((med) => {
      content += `
                <div class="card">
                    <h3>${med.name}</h3>
                    <p><strong>Quantidade:</strong> ${med.quantity}</p>
                    <p><strong>Horários:</strong> ${med.timings.join(", ")}</p>
                    <p><strong>Recomendações:</strong> ${
                      med.recommendations
                    }</p>
                    <p><strong>Marcas/Testes:</strong> ${med.brands}</p>
                </div>
            `;
    });

    // Adiciona um pouco de estilo para o PDF ficar melhor
    const styledContent = `
            <style>
                body { font-family: sans-serif; }
                .card { border: 1px solid #ccc; border-radius: 5px; padding: 10px; margin-bottom: 10px; page-break-inside: avoid; }
                h1, h3 { color: #007bff; }
            </style>
            ${content}
        `;

    html2pdf().from(styledContent).save("rotina_medicacoes.pdf");
  });

  exportSummaryPdfBtn.addEventListener("click", () => {
    const sortedMetrics = [...state.metrics].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    let content = `<h1>Resumo de Progresso e Consumo</h1>`;

    content += `<h2>Progresso das Métricas de Saúde</h2>`;
    if (sortedMetrics.length > 0) {
      content += `<div class="card">`;
      sortedMetrics.forEach((m) => {
        content += `<p><strong>${new Date(
          m.date + "T00:00:00"
        ).toLocaleDateString("pt-BR")}:</strong> `;
        let details = [];
        if (m.weight) details.push(`Peso: ${m.weight}kg`);
        if (m.glucose) details.push(`Glicemia: ${m.glucose}mg/dL`);
        if (m.cholesterol) details.push(`Colesterol: ${m.cholesterol}mg/dL`);
        content += details.join(" | ");
        content += `<br><em>Notas: ${m.notes}</em></p>`;
      });
      content += `</div>`;
    } else {
      content += `<p>Nenhuma métrica registrada.</p>`;
    }

    content += `<h2>Resumo de Consumo de Medicações</h2>`;
    state.medications.forEach((med) => {
      content += `<div class="card">`;
      content += `<h3>${med.name}</h3>`;
      const totalTaken = med.takenLog ? med.takenLog.length : 0;
      content += `<p>Total de doses confirmadas: <strong>${totalTaken}</strong></p>`;
      if (totalTaken > 0) {
        content += "<ul>";
        med.takenLog.forEach((log) => {
          content += `<li>${new Date(log).toLocaleString("pt-BR")}</li>`;
        });
        content += "</ul>";
      }
      content += `</div>`;
    });

    const styledContent = `
            <style>
                body { font-family: sans-serif; }
                .card { border: 1px solid #ccc; border-radius: 5px; padding: 10px; margin-bottom: 10px; page-break-inside: avoid; }
                h1, h2, h3 { color: #007bff; }
            </style>
            ${content}
        `;

    html2pdf().from(styledContent).save("resumo_progresso.pdf");
  });

  // --- INICIALIZAÇÃO ---
  loadData();
  renderAll();
});
