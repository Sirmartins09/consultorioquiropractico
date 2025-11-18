// ==============================
// CONFIGURACIÓN
// ==============================
const URL_JSON = "../db/data.json";
const URL_FIREBASE = "https://turnos-consultorio-f423b-default-rtdb.firebaseio.com/turnos.json";

const horariosEl = document.getElementById("horarios");
const datosPacienteEl = document.getElementById("datos-paciente");

let ultimaFechaSeleccionada = localStorage.getItem("fechaSeleccionada") || null;

// ==============================
// LIMPIEZA AUTOMÁTICA DE LOCALSTORAGE
// ==============================
function limpiarLocalStorage() {

  // ❌ YA NO SE USA PARA BLOQUEAR HORARIOS
  localStorage.removeItem("turnosOcupados");

  // ❌ fecha seleccionada guardada de visitas anteriores
  localStorage.removeItem("fechaSeleccionada");

  // 🧹 SI QUERÉS limpiar los turnos personales cuando ya no existan en Firebase
  // lo dejo preparado por si más adelante querés hacer sincronización total:
  // localStorage.removeItem("turnosGuardados");

  console.log("🧽 LocalStorage limpiado sin afectar turnos personales.");
}

// llamar a la limpieza cada vez que se entra a la página
limpiarLocalStorage()

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

// ==========================================================
// 🟦 1) OBTENER TURNOS OCUPADOS DESDE FIREBASE (REAL)
// ==========================================================
async function obtenerTurnosFirebase() {
  try {
    const res = await fetch(URL_FIREBASE);
    const data = await res.json();
    if (!data) return [];

    const turnos = [];

    for (const doctor in data) {
      for (const fecha in data[doctor]) {
        for (const hora in data[doctor][fecha]) {
          turnos.push({
            doctor,
            fecha,
            hora
          });
        }
      }
    }
    return turnos;
  } catch (err) {
    console.error("❌ Error leyendo Firebase:", err);
    return [];
  }
}

// ==========================================================
// 🟩 2) CARGAR JSON + TURNOS FIREBASE Y ARMAR CALENDARIO
// ==========================================================
Promise.all([
  fetch(URL_JSON).then(r => r.json()),
  obtenerTurnosFirebase()
])
.then(([data, turnosFirebase]) => {
  const doctor = data[0].doctores[0];
  const diasOriginales = doctor.dias;

  // turnos ocupados vienen DEL SERVIDOR
  const turnosOcupados = turnosFirebase;

  let diasDisponibles = filtrarDias(diasOriginales, doctor.nombre, turnosOcupados);
  let fechasDisponibles = diasDisponibles.map(d => d.fecha);

  // inicializar el calendario
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
          if (ultimaFechaSeleccionada) resaltarSeleccionado(ultimaFechaSeleccionada);
        }, 150);
      },
    }
  });

  calendar.init();

  setTimeout(() => {
    marcarDiasDisponibles(fechasDisponibles);
    if (ultimaFechaSeleccionada && fechasDisponibles.includes(ultimaFechaSeleccionada)) {
      resaltarSeleccionado(ultimaFechaSeleccionada);
      mostrarHorarios(ultimaFechaSeleccionada, diasDisponibles, doctor, turnosOcupados);
    }
  }, 300);

});

// ==========================================================
// AUXILIARES
// ==========================================================
function filtrarDias(diasOriginales, nombreDoctor, turnosOcupados) {
  return diasOriginales
    .map(dia => {
      const libres = dia.horarios.filter(hora => {
        return !turnosOcupados.some(t =>
          t.doctor === nombreDoctor &&
          t.fecha === dia.fecha &&
          t.hora === hora
        );
      });
      return { fecha: dia.fecha, horarios: libres };
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
      celda.style.opacity = "1";
      celda.style.pointerEvents = "auto";
    } else {
      celda.style.opacity = "0.25";
      celda.style.pointerEvents = "none";
    }
  });
}

function resaltarSeleccionado(fechaSeleccionada) {
  const seleccionado = document.querySelector(
    `.vanilla-calendar-day__btn[data-calendar-date="${fechaSeleccionada}"]`
  );

  if (seleccionado) {
    seleccionado.style.outline = "3px solid #155724";
    seleccionado.style.outlineOffset = "2px";
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

    const ocupado = turnosOcupados.some(t =>
      t.doctor === doctor.nombre &&
      t.fecha === fechaSeleccionada &&
      t.hora === hora
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
        }).then(r => {
          if (r.isConfirmed) guardarTurno(doctor.nombre, fechaSeleccionada, hora);
        });
      });
    }

    contenedor.appendChild(boton);
  });
}

// ==========================================================
// GUARDAR TURNO EN FIREBASE
// ==========================================================
function guardarTurno(doctor, fecha, hora) {
  const turno = {
    doctor,
    fecha,
    hora,
    paciente: paciente.nombre,
    email: paciente.email,
    telefono: paciente.telefono
  };

  // guardar turno personal en localStorage
  const tusTurnos = JSON.parse(localStorage.getItem("turnosGuardados")) || [];
  tusTurnos.push(turno);
  localStorage.setItem("turnosGuardados", JSON.stringify(tusTurnos));

  // guardar en Firebase
  const url = `https://turnos-consultorio-f423b-default-rtdb.firebaseio.com/turnos/${doctor}/${fecha}/${hora}.json`;

  fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(turno)
  })
  .then(() => {
    Swal.fire({
      icon: "success",
      title: "¡Gracias!",
      text: `Tu turno fue registrado para el ${formatearFecha(fecha)} a las ${hora}.`,
      confirmButtonText: "Volver al inicio"
    }).then(() => {
      window.location.href = "../index.html";
    });
  });
}

// ==========================================================
// FORMATEAR FECHA
// ==========================================================
function formatearFecha(f) {
  const [y, m, d] = f.split("-");
  return `${d}/${m}/${y}`;
}
