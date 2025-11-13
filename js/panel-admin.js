// ==============================
// CONFIGURACIÓN
// ==============================
const URL_FIREBASE = "https://turnos-consultorio-f423b-default-rtdb.firebaseio.com"; // 🔗 tu URL base
const tablaTurnos = document.getElementById("tabla-turnos");
const btnActualizar = document.getElementById("btn-actualizar");

// ==============================
// AL INICIAR
// ==============================
document.addEventListener("DOMContentLoaded", cargarTurnos);
btnActualizar.addEventListener("click", cargarTurnos);

// ==============================
// CARGAR TURNOS DESDE FIREBASE
// ==============================
async function cargarTurnos() {
  tablaTurnos.innerHTML = `<tr><td colspan="7">Cargando turnos...</td></tr>`;

  try {
    const res = await fetch(`${URL_FIREBASE}/turnos/Daniel%20Dean.json`);
    const data = await res.json();

    if (!data) {
      tablaTurnos.innerHTML = `<tr><td colspan="7">No hay turnos registrados.</td></tr>`;
      return;
    }

    const turnos = [];
    for (const fecha in data) {
      for (const hora in data[fecha]) {
        const turno = data[fecha][hora];
        turnos.push(turno);
      }
    }

    // Ordenar por fecha y hora
    turnos.sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

    mostrarTurnos(turnos);
  } catch (error) {
    console.error("Error al cargar turnos:", error);
    tablaTurnos.innerHTML = `<tr><td colspan="7" class="text-danger">Error al cargar los turnos.</td></tr>`;
  }
}

// ==============================
// MOSTRAR TURNOS EN LA TABLA
// ==============================
function mostrarTurnos(turnos) {
  tablaTurnos.innerHTML = "";

  turnos.forEach(turno => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${formatearFecha(turno.fecha)}</td>
      <td>${turno.hora}</td>
      <td>${turno.paciente}</td>
      <td>${turno.email}</td>
      <td>${turno.telefono}</td>
      <td>${turno.estado || "Pendiente"}</td>
      <td>
        <button class="btn btn-success btn-sm" onclick="marcarAtendido('${turno.fecha}','${turno.hora}')">
          <i class="fas fa-check"></i> Atendido
        </button>
        <button class="btn btn-danger btn-sm" onclick="eliminarTurno('${turno.fecha}','${turno.hora}')">
          <i class="fas fa-trash-alt"></i> Eliminar
        </button>
      </td>
    `;
    tablaTurnos.appendChild(fila);
  });
}

// ==============================
// ELIMINAR TURNO
// ==============================
function eliminarTurno(fecha, hora) {
  Swal.fire({
    title: "¿Eliminar turno?",
    text: `¿Querés eliminar el turno del ${formatearFecha(fecha)} a las ${hora}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  }).then((r) => {
    if (r.isConfirmed) {
      const ruta = `/turnos/Daniel%20Dean/${encodeURIComponent(fecha)}/${encodeURIComponent(hora)}.json`;
      fetch(`${URL_FIREBASE}${ruta}`, { method: "DELETE" })
        .then(res => {
          if (!res.ok) throw new Error("Error al eliminar turno");
          Swal.fire({
            icon: "success",
            title: "Turno eliminado",
            timer: 1500,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            didClose: () => cargarTurnos() // 🔁 solo se actualiza una vez, al cerrar la alerta
          });
        })
        .catch(err => console.error("❌ Error al eliminar:", err));
    }
  });
}

// ==============================
// MARCAR COMO ATENDIDO
// ==============================
function marcarAtendido(fecha, hora) {
  const ruta = `/turnos/Daniel%20Dean/${encodeURIComponent(fecha)}/${encodeURIComponent(hora)}.json`;

  fetch(`${URL_FIREBASE}${ruta}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado: "Atendido" })
  })
    .then(res => {
      if (!res.ok) throw new Error("Error al actualizar turno");
      Swal.fire({
        icon: "success",
        title: "Turno marcado como atendido",
        timer: 1500,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didClose: () => cargarTurnos() // ✅ solo se ejecuta una vez
      });
    })
    .catch(err => console.error("❌ Error al actualizar:", err));
}

// ==============================
// FORMATEAR FECHA
// ==============================
function formatearFecha(fecha) {
  const [año, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${año}`;
}
