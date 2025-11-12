// ==============================
// CONFIGURACIÓN
// ==============================
const URL_FIREBASE = "https://turnos-consultorio-f423b-default-rtdb.firebaseio.com"; // 🔗 CAMBIAR por tu URL exacta
const contenedorTurnos = document.getElementById("lista-turnos");
const btnBorrarTodo = document.getElementById("btn-borrar-todo");

// ==============================
// AL CARGAR LA PÁGINA
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  await mostrarTurnos();
});

// ==============================
// MOSTRAR TURNOS GUARDADOS DESDE FIREBASE
// ==============================
async function mostrarTurnos() {
  const turnosGuardados = await obtenerTurnosDeFirebase(); // 🔥 ahora lee del servidor

  if (turnosGuardados.length === 0) {
    contenedorTurnos.innerHTML = "<p>No tenés turnos registrados actualmente.</p>";
    return;
  }

  contenedorTurnos.innerHTML = "";

  turnosGuardados.forEach((turno, index) => {
    const div = document.createElement("div");
    div.classList.add("turno-item");
    div.innerHTML = `
      <p><b>Profesional:</b> ${turno.doctor}</p>
      <p><b>Fecha:</b> ${formatearFecha(turno.fecha)}</p>
      <p><b>Hora:</b> ${turno.hora}</p>
      <p><b>Paciente:</b> ${turno.paciente}</p>
      <button class="btn-cancelar" data-index="${index}">Cancelar este turno</button>
      <hr>
    `;
    contenedorTurnos.appendChild(div);
  });

  // Asignar eventos de cancelación
  document.querySelectorAll(".btn-cancelar").forEach((boton, index) => {
    boton.addEventListener("click", () => {
      const turno = turnosGuardados[index];
      cancelarTurno(turno);
    });
  });
}

// ==============================
// CANCELAR UN TURNO INDIVIDUAL
// ==============================
function cancelarTurno(turnoEliminado) {
  Swal.fire({
    title: "¿Cancelar turno?",
    text: `¿Querés cancelar el turno del ${formatearFecha(turnoEliminado.fecha)} a las ${turnoEliminado.hora}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, cancelar",
    cancelButtonText: "No",
  }).then((r) => {
    if (r.isConfirmed) {
      eliminarTurnoDeFirebase(turnoEliminado.doctor, turnoEliminado.fecha, turnoEliminado.hora);

      // Actualizar localStorage (por compatibilidad)
      const turnosGuardados = JSON.parse(localStorage.getItem("turnosGuardados")) || [];
      const filtrados = turnosGuardados.filter(
        t => !(t.doctor === turnoEliminado.doctor && t.fecha === turnoEliminado.fecha && t.hora === turnoEliminado.hora)
      );
      localStorage.setItem("turnosGuardados", JSON.stringify(filtrados));

      Swal.fire({
        icon: "success",
        title: "Turno cancelado",
        text: `Se eliminó el turno del ${formatearFecha(turnoEliminado.fecha)} a las ${turnoEliminado.hora}.`,
        timer: 2000,
        showConfirmButton: false,
        willClose: () => mostrarTurnos(), // 🔁 se actualiza automáticamente
      });
    }
  });
}

// ==============================
// CANCELAR TODOS LOS TURNOS
// ==============================
btnBorrarTodo.addEventListener("click", async () => {
  const turnosGuardados = await obtenerTurnosDeFirebase();

  if (turnosGuardados.length === 0) {
    Swal.fire({
      icon: "info",
      title: "Sin turnos",
      text: "No hay turnos para eliminar.",
      timer: 2000,
      showConfirmButton: false,
    });
    return;
  }

  Swal.fire({
    title: "¿Eliminar todos los turnos?",
    text: "Esta acción no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar todo",
    cancelButtonText: "Cancelar",
  }).then((r) => {
    if (r.isConfirmed) {
      // Borrar cada turno de Firebase
      turnosGuardados.forEach(t => eliminarTurnoDeFirebase(t.doctor, t.fecha, t.hora));

      // Limpiar localStorage
      localStorage.removeItem("turnosGuardados");
      localStorage.removeItem("turnosOcupados");

      Swal.fire({
        icon: "success",
        title: "Todos los turnos fueron cancelados",
        timer: 2000,
        showConfirmButton: false,
        willClose: () => mostrarTurnos(),
      });
    }
  });
});

// ==============================
// FUNCIONES AUXILIARES
// ==============================

// 🔥 Obtener todos los turnos desde Firebase
async function obtenerTurnosDeFirebase() {
  const res = await fetch(`${URL_FIREBASE}/turnos.json`);
  const data = await res.json();

  if (!data) return [];

  const turnos = [];
  for (const doctor in data) {
    for (const fecha in data[doctor]) {
      for (const hora in data[doctor][fecha]) {
        const turno = data[doctor][fecha][hora];
        turnos.push(turno);
      }
    }
  }
  return turnos;
}

// 🔥 Eliminar turno de Firebase
function eliminarTurnoDeFirebase(doctor, fecha, hora) {
  const ruta = `/turnos/${encodeURIComponent(doctor)}/${encodeURIComponent(fecha)}/${encodeURIComponent(hora)}.json`;

  fetch(`${URL_FIREBASE}${ruta}`, { method: "DELETE" })
    .then(res => {
      if (!res.ok) throw new Error("Error al eliminar turno en Firebase");
      console.log(`🗑️ Turno eliminado en Firebase: ${doctor} ${fecha} ${hora}`);
    })
    .catch(err => console.error("❌ Error al eliminar turno:", err));
}

// Formatear fecha (de AAAA-MM-DD a DD/MM/AAAA)
function formatearFecha(fecha) {
  const [año, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${año}`;
}
