// ==============================
// CONFIGURACIÓN
// ==============================
const URL = "../db/data.json";
const contenedorTurnos = document.getElementById("lista-turnos");
const btnBorrarTodo = document.getElementById("btn-borrar-todo");

// ==============================
// CARGAR Y MOSTRAR TURNOS GUARDADOS
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  mostrarTurnos();
});

function mostrarTurnos() {
  const turnosGuardados = JSON.parse(localStorage.getItem("turnosGuardados")) || [];

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

  // Asignar eventos a los botones "Cancelar este turno"
  const botonesCancelar = document.querySelectorAll(".btn-cancelar");
  botonesCancelar.forEach(boton => {
    boton.addEventListener("click", () => {
      const index = boton.dataset.index;
      cancelarTurno(index);
    });
  });
}

// ==============================
// CANCELAR UN TURNO INDIVIDUAL
// ==============================
function cancelarTurno(index) {
  const turnosGuardados = JSON.parse(localStorage.getItem("turnosGuardados")) || [];
  const turnosOcupados = JSON.parse(localStorage.getItem("turnosOcupados")) || [];

  const turnoEliminado = turnosGuardados.splice(index, 1)[0];

  // Eliminar también de turnosOcupados
  const nuevosOcupados = turnosOcupados.filter(
    t =>
      !(t.doctor === turnoEliminado.doctor &&
        t.fecha === turnoEliminado.fecha &&
        t.hora === turnoEliminado.hora)
  );

  localStorage.setItem("turnosGuardados", JSON.stringify(turnosGuardados));
  localStorage.setItem("turnosOcupados", JSON.stringify(nuevosOcupados));

  Swal.fire({
    icon: "success",
    title: "Turno cancelado",
    text: `Se eliminó el turno del ${formatearFecha(turnoEliminado.fecha)} a las ${turnoEliminado.hora}.`,
    timer: 2000,
    showConfirmButton: false,
  });

  mostrarTurnos(); // actualizar lista
}

// ==============================
// CANCELAR TODOS LOS TURNOS
// ==============================
btnBorrarTodo.addEventListener("click", () => {
  Swal.fire({
    title: "¿Eliminar todos los turnos?",
    text: "Esta acción no se puede deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar todo",
    cancelButtonText: "Cancelar",
  }).then((r) => {
    if (r.isConfirmed) {
      localStorage.removeItem("turnosGuardados");
      localStorage.removeItem("turnosOcupados");
      Swal.fire({
        icon: "success",
        title: "Todos los turnos fueron cancelados",
        timer: 2000,
        showConfirmButton: false,
      });
      mostrarTurnos();
    }
  });
});

// ==============================
// FORMATEAR FECHA
// ==============================
function formatearFecha(fecha) {
  const año = fecha.substring(0, 4);
  const mes = fecha.substring(5, 7);
  const dia = fecha.substring(8, 10);
  return `${dia}/${mes}/${año}`;
}
