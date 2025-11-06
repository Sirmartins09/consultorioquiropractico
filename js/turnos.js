const formulario = document.getElementById("form-turno");

formulario.onsubmit = (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const email = document.getElementById("email").value.trim();
  const telefono = document.getElementById("telefono").value.trim();

  // ======== VALIDACIONES ========

  // Campos vacíos
  if (!nombre || !email || !telefono) {
    Swal.fire({
      icon: "warning",
      title: "Campos incompletos",
      text: "Por favor, complete todos los campos obligatorios.",
    });
    return;
  }

  // Nombre no debe contener números
  for (let i = 0; i < nombre.length; i++) {
    if (nombre[i] >= "0" && nombre[i] <= "9") {
      Swal.fire({
        icon: "error",
        title: "Nombre inválido",
        text: "El nombre no puede contener números.",
      });
      return;
    }
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    Swal.fire({
      icon: "error",
      title: "Correo inválido",
      text: "Por favor, ingrese un correo electrónico válido.",
    });
    return;
  }

  // Teléfono solo números
  for (let i = 0; i < telefono.length; i++) {
    const char = telefono[i];
    if ((char >= "a" && char <= "z") || (char >= "A" && char <= "Z")) {
      Swal.fire({
        icon: "error",
        title: "Teléfono inválido",
        text: "El teléfono solo puede contener números.",
      });
      return;
    }
  }

  // ======== GUARDAR DATOS Y REDIRIGIR ========
  const datosPaciente = { nombre, email, telefono };
  localStorage.setItem("datosPaciente", JSON.stringify(datosPaciente));

  // Redirigir al calendario
  window.location.href = "../pages/fechayhora.html";

};
