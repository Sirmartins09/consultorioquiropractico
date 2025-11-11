// ==============================
// CONFIGURACIÓN
// ==============================
const URL = "../db/data.json";
const horariosEl = document.getElementById("horarios");
const datosPacienteEl = document.getElementById("datos-paciente");

// guardamos la última fecha seleccionada (si existe en localStorage)
let ultimaFechaSeleccionada = localStorage.getItem("fechaSeleccionada") || null;

// ==============================
// MOSTRAR DATOS DEL PACIENTE
// ==============================
const paciente = JSON.parse(localStorage.getItem("datosPaciente"));

if (!paciente) {
  Swal.fire({
    icon: "info",
    title: "Datos faltantes",
    text: "Completá tus datos antes de elegir un turno.",
    confirmButtonText: "Ir al formulario",
  }).then(() => {
    window.location.href = "./turnos.html";
  });
} else {
  datosPacienteEl.innerHTML = `
    <div class="datos-paciente">
      <h3>Paciente: ${paciente.nombre}</h3>
      <p><b>Email:</b> ${paciente.email}</p>
      <p><b>Teléfono:</b> ${paciente.telefono}</p>
    </div>
  `;
}

// ==============================
// CARGAR DATOS DESDE JSON Y APLICAR TURNOS OCUPADOS
// ==============================
fetch(URL)
  .then(res => res.json())
  .then(data => {
    const doctor = data[0].doctores[0]; // Doctor Daniel Dean
    const diasOriginales = doctor.dias;

    // ✅ Recuperar turnos ocupados desde localStorage
    const turnosOcupados = JSON.parse(localStorage.getItem("turnosOcupados")) || [];

    // ✅ Filtrar los días y horarios disponibles
    let diasDisponibles = filtrarDias(diasOriginales, doctor.nombre, turnosOcupados);
    let fechasDisponibles = diasDisponibles.map(d => d.fecha);

    // ==============================
    // INICIALIZAR CALENDARIO
    // ==============================
    const calendar = new VanillaCalendar("#calendario", {
      settings: {
        lang: "es",
        selection: { day: "single" },
        range: { min: "2025-11-01", max: "2025-12-31" },
      },
      actions: {
        clickDay(event, self) {
          const seleccion = self.selectedDates[0];
          const fechaSeleccionada = seleccion || ultimaFechaSeleccionada;
          if (!fechaSeleccionada) return;

          ultimaFechaSeleccionada = fechaSeleccionada;
          localStorage.setItem("fechaSeleccionada", fechaSeleccionada);

          mostrarHorarios(fechaSeleccionada, diasDisponibles, doctor, turnosOcupados);
          resaltarSeleccionado(fechaSeleccionada);
        },
        changeToMonth() {
          setTimeout(() => {
            marcarDiasDisponibles(fechasDisponibles);
            if (ultimaFechaSeleccionada) {
              resaltarSeleccionado(ultimaFechaSeleccionada);
            }
          }, 150);
        },
      },
    });

    calendar.init();

    // ✅ Marcar los días disponibles al inicio
    setTimeout(() => {
      marcarDiasDisponibles(fechasDisponibles);
      if (ultimaFechaSeleccionada && fechasDisponibles.includes(ultimaFechaSeleccionada)) {
        resaltarSeleccionado(ultimaFechaSeleccionada);
        mostrarHorarios(ultimaFechaSeleccionada, diasDisponibles, doctor, turnosOcupados);
      }
    }, 300);
  })
  .catch(() => {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron cargar los horarios disponibles.",
    });
  });

// ==============================
// FUNCIONES AUXILIARES
// ==============================
function filtrarDias(diasOriginales, nombreDoctor, turnosOcupados) {
  return diasOriginales
    .map(dia => {
      const horariosLibres = dia.horarios.filter(hora => {
        return !turnosOcupados.some(
          turno =>
            turno.doctor === nombreDoctor &&
            turno.fecha === dia.fecha &&
            turno.hora === hora
        );
      });
      return { fecha: dia.fecha, horarios: horariosLibres };
    })
    .filter(d => d.horarios.length > 0);
}

function marcarDiasDisponibles(fechasDisponibles) {
  const celdas = document.querySelectorAll(".vanilla-calendar-day__btn");
  celdas.forEach(celda => {
    const fecha = celda.dataset.calendarDay || celda.dataset.calendarDate;

    if (fechasDisponibles.includes(fecha)) {
      celda.style.backgroundColor = "#007bff";
      celda.style.color = "#fff";
      celda.style.borderRadius = "90%";
      celda.style.fontWeight = "bold";
      celda.style.pointerEvents = "auto";
      celda.style.opacity = "1";
    } else {
      celda.style.opacity = "0.3";
      celda.style.pointerEvents = "none";
      celda.style.backgroundColor = "";
      celda.style.color = "";
      celda.style.borderRadius = "";
      celda.style.fontWeight = "";
    }

    celda.style.outline = "none";
    celda.style.boxShadow = "none";
  });
}

function resaltarSeleccionado(fechaSeleccionada) {
  const celdas = document.querySelectorAll(".vanilla-calendar-day__btn");
  celdas.forEach(celda => {
    celda.style.outline = "none";
    celda.style.boxShadow = "none";
  });

  const seleccionado = document.querySelector(
    `.vanilla-calendar-day__btn[data-calendar-date="${fechaSeleccionada}"]`
  );

  if (seleccionado) {
    seleccionado.style.outline = "3px solid #155724";
    seleccionado.style.outlineOffset = "2px";
    seleccionado.style.boxShadow = "0 0 0 2px rgba(21, 87, 36, 0.4)";
  }
}

function mostrarHorarios(fechaSeleccionada, diasDisponibles, doctor, turnosOcupados) {
  horariosEl.innerHTML = "<h2>Horarios disponibles</h2>";

  const diaOriginal = doctor.dias.find(d => d.fecha === fechaSeleccionada);
  if (!diaOriginal) {
    horariosEl.innerHTML += "<p>No hay horarios disponibles.</p>";
    return;
  }

  const contenedor = document.createElement("div");
  contenedor.classList.add("lista-horarios");
  horariosEl.appendChild(contenedor);

  diaOriginal.horarios.forEach(hora => {
    const boton = document.createElement("button");
    boton.textContent = hora;
    boton.classList.add("btn-hora");

    const ocupado = turnosOcupados.some(
      t => t.doctor === doctor.nombre && t.fecha === fechaSeleccionada && t.hora === hora
    );

    if (ocupado) {
      boton.disabled = true;
      boton.classList.add("ocupado");
    } else {
      boton.addEventListener("click", () => {
        Swal.fire({
          title: "¿Desea confirmar el turno?",
          html: `
            <b>Paciente:</b> ${paciente.nombre}<br>
            <b>Email:</b> ${paciente.email}<br>
            <b>Teléfono:</b> ${paciente.telefono}<br><br>
            <b>Profesional:</b> ${doctor.nombre}<br>
            <b>Fecha:</b> ${formatearFecha(fechaSeleccionada)}<br>
            <b>Hora:</b> ${hora}
          `,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Confirmar turno",
          cancelButtonText: "Cancelar",
        }).then((r) => {
          if (r.isConfirmed) {
            guardarTurno(doctor.nombre, fechaSeleccionada, hora);
          }
        });
      });
    }

    contenedor.appendChild(boton);
  });
}

// ==============================
// GUARDAR Y BLOQUEAR TURNOS
// ==============================
function guardarTurno(doctor, fecha, hora) {
  const turno = { 
    doctor, 
    fecha, 
    hora, 
    paciente: paciente.nombre, 
    email: paciente.email, 
    telefono: paciente.telefono 
  };

  const turnosGuardados = JSON.parse(localStorage.getItem("turnosGuardados")) || [];
  const turnosOcupados = JSON.parse(localStorage.getItem("turnosOcupados")) || [];

  turnosGuardados.push(turno);
  turnosOcupados.push(turno);

  localStorage.setItem("turnosGuardados", JSON.stringify(turnosGuardados));
  localStorage.setItem("turnosOcupados", JSON.stringify(turnosOcupados));

  // ✅ Enviar a Google Sheets
  enviarTurnoAGoogleSheets(turno);

  Swal.fire({
    icon: "success",
    title: "¡Gracias, " + paciente.nombre + "!",
    text: `Tu turno fue registrado correctamente para el ${formatearFecha(fecha)} a las ${hora}.`,
    confirmButtonText: "Volver al inicio",
  }).then(() => {
    window.location.href = "../index.html";
  });
}

// ==============================
// FORMATEAR FECHA
// ==============================
function formatearFecha(fecha) {
  const año = fecha.substring(0, 4);
  const mes = fecha.substring(5, 7);
  const dia = fecha.substring(8, 10);
  return `${dia}/${mes}/${año}`;
}

// ==============================
// ENVIAR TURNOS A GOOGLE SHEETS
// ==============================
function enviarTurnoAGoogleSheets(turno) {
  // 👉 pegá acá la URL del Apps Script (la que te dio al implementar)
  const urlScript = "https://script.google.com/macros/s/AKfycbwWxAY6C-5c51LjMe6HaYk6xiRxVkLWR_OAn7l5CR9hOXvwLnvI2V9k-g_JQorYxpJ0hw/exec";

  fetch(urlScript, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(turno),
  })
  .then(() => console.log("✅ Turno enviado a Google Sheets:", turno))
  .catch((error) => console.error("❌ Error al enviar a Google Sheets:", error));

}

// ==============================
// ENVIAR TURNOS A GOOGLE SHEETS
// ==============================
function enviarTurnoAGoogleSheets(turno) {
  https://script.google.com/macros/s/AKfycbw6m93eYupnD_w9g7x7sMdb46907zjo2nrXt9FwrhddNAXSE4dRXDEfjW7BH5FQ4kThsw/exec

  fetch(urlScript, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(turno),
  })
  .then(() => console.log("✅ Turno enviado a Google Sheets:", turno))
  .catch((error) => console.error("❌ Error al enviar a Google Sheets:", error));
}
