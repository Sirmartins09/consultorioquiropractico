// ==============================
// CONFIGURACIÓN
// ==============================
const URL_JSON = "../db/data.json"; // tus días y horarios (no cambia)
const URL_FIREBASE = "https://turnos-consultorio-f423b-default-rtdb.firebaseio.com"; 

const horariosEl = document.getElementById("horarios");
const datosPacienteEl = document.getElementById("datos-paciente");

// ==============================
// DATOS DEL PACIENTE
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
// INICIO: CARGAR DATOS + TURNOS OCUPADOS DESDE FIREBASE
// ==============================
async function iniciarTurnero() {
  try {
    const res = await fetch(URL_JSON);
    const data = await res.json();
    const doctor = data[0].doctores[0];
    const diasOriginales = doctor.dias;

    // 🔥 Traer turnos reales desde Firebase
    const turnosOcupados = await obtenerTurnosDeFirebase(doctor.nombre);

    // 🔥 Filtrar días disponibles según Firebase
    const diasDisponibles = filtrarDias(diasOriginales, doctor.nombre, turnosOcupados);
    const fechasDisponibles = diasDisponibles.map(d => d.fecha);

    // Calendar
    const calendar = new VanillaCalendar("#calendario", {
      settings: {
        lang: "es",
        selection: { day: "single" },
        range: { min: "2025-11-01", max: "2025-12-31" }
      },
      actions: {
        clickDay(event, self) {
          const fecha = self.selectedDates[0];
          if (!fecha) return;

          mostrarHorarios(fecha, diasDisponibles, doctor, turnosOcupados);
          resaltarSeleccionado(fecha);
        },
        changeToMonth() {
          setTimeout(() => marcarDiasDisponibles(fechasDisponibles), 150);
        }
      }
    });

    calendar.init();

    setTimeout(() => marcarDiasDisponibles(fechasDisponibles), 300);

  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron cargar los horarios disponibles.",
    });
  }
}

iniciarTurnero();

// ==============================
// OBTENER TURNOS REALES DE FIREBASE
// ==============================
async function obtenerTurnosDeFirebase(nombreDoctor) {
  const res = await fetch(`${URL_FIREBASE}/turnos/${encodeURIComponent(nombreDoctor)}.json`);
  const data = await res.json();

  if (!data) return [];

  const turnos = [];
  for (const fecha in data) {
    for (const hora in data[fecha]) {
      turnos.push(data[fecha][hora]);
    }
  }

  return turnos;
}

// ==============================
// FILTRAR DÍAS DISPONIBLES
// ==============================
function filtrarDias(diasOriginales, nombreDoctor, turnosOcupados) {
  return diasOriginales
    .map(dia => {
      const horariosLibres = dia.horarios.filter(hora => {
        return !turnosOcupados.some(
          turno => turno.fecha === dia.fecha && turno.hora === hora
        );
      });
      return { fecha: dia.fecha, horarios: horariosLibres };
    })
    .filter(d => d.horarios.length > 0);
}

// ==============================
// MARCAR DÍAS DISPONIBLES
// ==============================
function marcarDiasDisponibles(fechasDisponibles) {
  document.querySelectorAll(".vanilla-calendar-day__btn").forEach(celda => {
    const fecha = celda.dataset.calendarDate;

    if (fechasDisponibles.includes(fecha)) {
      celda.style.backgroundColor = "#007bff";
      celda.style.color = "#fff";
      celda.style.borderRadius = "90%";
      celda.style.fontWeight = "bold";
    } else {
      celda.style.opacity = "0.3";
      celda.style.pointerEvents = "none";
    }
  });
}

// ==============================
// RESALTAR FECHA SELECCIONADA
// ==============================
function resaltarSeleccionado(fechaSeleccionada) {
  document.querySelectorAll(".vanilla-calendar-day__btn").forEach(celda => {
    celda.style.outline = "none";
  });

  const celda = document.querySelector(
    `.vanilla-calendar-day__btn[data-calendar-date="${fechaSeleccionada}"]`
  );

  if (celda) {
    celda.style.outline = "3px solid #155724";
    celda.style.outlineOffset = "2px";
  }
}

// ==============================
// MOSTRAR HORARIOS DISPONIBLES
// ==============================
function mostrarHorarios(fecha, diasDisponibles, doctor, turnosOcupados) {
  horariosEl.innerHTML = "<h2>Horarios disponibles</h2>";

  const diaOriginal = doctor.dias.find(d => d.fecha === fecha);

  const contenedor = document.createElement("div");
  contenedor.classList.add("lista-horarios");

  diaOriginal.horarios.forEach(hora => {
    const boton = document.createElement("button");
    boton.textContent = hora;
    boton.classList.add("btn-hora");

    const ocupado = turnosOcupados.some(t => t.fecha === fecha && t.hora === hora);

    if (ocupado) {
      boton.disabled = true;
      boton.classList.add("ocupado");
    } else {
      boton.addEventListener("click", () => {
        Swal.fire({
          title: "¿Confirmar turno?",
          html: `
            <b>Paciente:</b> ${paciente.nombre}<br>
            <b>Email:</b> ${paciente.email}<br>
            <b>Teléfono:</b> ${paciente.telefono}<br><br>
            <b>Profesional:</b> ${doctor.nombre}<br>
            <b>Fecha:</b> ${formatearFecha(fecha)}<br>
            <b>Hora:</b> ${hora}
          `,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Confirmar",
          cancelButtonText: "Cancelar",
        }).then(r => {
          if (r.isConfirmed) guardarTurnoFirebase(doctor.nombre, fecha, hora);
        });
      });
    }

    contenedor.appendChild(boton);
  });

  horariosEl.appendChild(contenedor);
}

// ==============================
// GUARDAR TURNO EN FIREBASE
// ==============================
function guardarTurnoFirebase(doctor, fecha, hora) {
  const turno = {
    doctor,
    fecha,
    hora,
    paciente: paciente.nombre,
    email: paciente.email,
    telefono: paciente.telefono
  };

  const ruta = `/turnos/${encodeURIComponent(doctor)}/${encodeURIComponent(fecha)}/${encodeURIComponent(hora)}.json`;

  fetch(`${URL_FIREBASE}${ruta}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(turno)
  })
  .then(() => {
    Swal.fire({
      icon: "success",
      title: "¡Turno confirmado!",
      text: `Tu turno fue registrado para el ${formatearFecha(fecha)} a las ${hora}.`,
      confirmButtonText: "Volver al inicio"
    }).then(() => {
      window.location.href = "../index.html";
    });
  })
  .catch(err => console.error("❌ Error:", err));
}

// ==============================
// FORMATEAR FECHA
// ==============================
function formatearFecha(fecha) {
  const [yyyy, mm, dd] = fecha.split("-");
  return `${dd}/${mm}/${yyyy}`;
}
