const SUPABASE_URL = "https://belbjgmlrmnxxhyjrdom.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlbGJqZ21scm1ueHhoeWpyZG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDQyMjcsImV4cCI6MjA3MDA4MDIyN30.Rl7S8shZgQaEz5yiapAQL0j78PO5u1gC8wVKzGBsU8E";                                                                                                                                                                                                                                                             const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function agregarEstudiante() {
  const nombre = document.getElementById("nombre").value;
  const correo = document.getElementById("correo").value;
  const clase = document.getElementById("clase").value;

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    alert("No estás autenticado.");
    return;
  }

  const { error } = await client.from("estudiantes").insert({
    nombre,
    correo,
    clase,
    user_id: user.id,
  });

  if (error) {
    alert("Error al agregar: " + error.message);
  } else {
    alert("Estudiante agregado");
    cargarEstudiantes();
  }
}

async function cargarEstudiantes() {
  const { data, error } = await client
    .from("estudiantes")  //Nombre de BD
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    alert("Error al cargar estudiantes: " + error.message);
    return;
  }

  const lista = document.getElementById("lista-estudiantes");
  lista.innerHTML = "";
  data.forEach((est) => {
    const item = document.createElement("li");
    item.textContent = `${est.nombre} (${est.clase})`;
    lista.appendChild(item);
  });
}

cargarEstudiantes();

async function subirArchivo() {
  const archivoInput = document.getElementById("archivo");
  const archivo = archivoInput.files[0];

  if (!archivo) {
    alert("Selecciona un archivo primero.");
    return;
  }

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    alert("Sesión no válida.");
    return;
  }

  const nombreRuta = `${user.id}/${archivo.name}`; 
  const { data, error } = await client.storage
    .from("tareas") //Nombre del bucket
    .upload(nombreRuta, archivo, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    alert("Error al subir: " + error.message);
  } else {
    alert("Archivo subido correctamente.");
    listarArchivos(); 
  }
}

async function listarArchivos() {
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    alert("Sesión no válida.");
    return;
  }

  const { data, error } = await client.storage
    .from("tareas")
    .list(`${user.id}`, { limit: 20 });

  const lista = document.getElementById("lista-archivos");
  lista.innerHTML = "";

  if (error) {
    lista.innerHTML = "<li>Error al listar archivos</li>";
    return;
  }

  data.forEach(async (archivo) => {
    const { data: signedUrlData, error: signedUrlError } = await client.storage
      .from("tareas")
      .createSignedUrl(`${user.id}/${archivo.name}`, 60);

    if (signedUrlError) {
      console.error("Error al generar URL firmada:", signedUrlError.message);
      return;
    }

    const publicUrl = signedUrlData.signedUrl;

    const item = document.createElement("li");

    const esImagen = archivo.name.match(/\.(jpg|jpeg|png|gif)$/i);
    const esPDF = archivo.name.match(/\.pdf$/i);

    if (esImagen) {
      item.innerHTML = `
        <strong>${archivo.name}</strong><br>
        <a href="${publicUrl}" target="_blank">
          <img src="${publicUrl}" width="150" style="border:1px solid #ccc; margin:5px;" />
        </a>
      `;
    } else if (esPDF) {
      item.innerHTML = `
        <strong>${archivo.name}</strong><br>
        <a href="${publicUrl}" target="_blank">Ver PDF</a>
      `;
    } else {
      item.innerHTML = '<a href="${publicUrl}" target="_blank">${archivo.name}</a>';
    }

    lista.appendChild(item);
  });
}
listarArchivos();

async function cerrarSesion() {
  const { error } = await client.auth.signOut();

  if (error) {
    alert("Error al cerrar sesión: " + error.message);
  } else {
    localStorage.removeItem("token");
    alert("Sesión cerrada.");
    window.location.href = "index.html";
  }
}
/////Modificar estudiantes
async function cargarEstudiantes() {
  const { data, error } = await client
    .from("estudiantes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    alert("Error al cargar estudiantes: " + error.message);
    return;
  }

  const lista = document.getElementById("lista-estudiantes");
  lista.innerHTML = "";

  data.forEach((est) => {
    const item = document.createElement("li");
    item.classList.add("estudiante-item");

    // Texto con nombre y clase
    const texto = document.createElement("span");
    texto.textContent = `${est.nombre} (${est.clase})`;

    // Botón modificar
    const btnModificar = document.createElement("button");
    btnModificar.textContent = "Modificar";
    btnModificar.classList.add("btn-modificar");
    btnModificar.onclick = () => abrirFormularioModificar(est);

    // Botón borrar
    const btnBorrar = document.createElement("button");
    btnBorrar.textContent = "Borrar";
    btnBorrar.classList.add("btn-borrar");
    btnBorrar.onclick = () => borrarEstudiante(est.id);

    item.appendChild(texto);
    item.appendChild(btnModificar);
    item.appendChild(btnBorrar);
    lista.appendChild(item);
  });
}

async function modificarEstudiante(id, nombre, correo, clase) {
  const { error } = await client
    .from("estudiantes")
    .update({ nombre, correo, clase })
    .eq("id", id);

  if (error) {
    alert("Error al modificar estudiante: " + error.message);
  } else {
    alert("Estudiante modificado");
    cargarEstudiantes();
  }
}

// Modificar estudiante con Swal
function abrirFormularioModificar(est) {
  Swal.fire({
    title: 'Modificar estudiante',
    html:
      `<input id="swalNombre" class="swal2-input" placeholder="Nombre" value="${est.nombre}">` +
      `<input id="swalCorreo" type="email" class="swal2-input" placeholder="Correo" value="${est.correo}">` +
      `<input id="swalClase" class="swal2-input" placeholder="Clase" value="${est.clase}">`,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const nombre = document.getElementById('swalNombre').value.trim();
      const correo = document.getElementById('swalCorreo').value.trim();
      const clase = document.getElementById('swalClase').value.trim();

      if (!nombre || !correo || !clase) {
        Swal.showValidationMessage('Por favor completa todos los campos');
        return false;
      }
      return { nombre, correo, clase };
    },
    customClass: {
      popup: 'swal-popup-custom',
      confirmButton: 'swal-confirm-btn',
      cancelButton: 'swal-cancel-btn',
      input: 'swal2-input'
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      const { nombre, correo, clase } = result.value;
      const error = await modificarEstudiante(est.id, nombre, correo, clase);
      if (!error) {
        Swal.fire('¡Modificado!', 'Estudiante modificado correctamente', 'success');
        cargarEstudiantes();
      } else {
        Swal.fire('Error', error.message, 'error');
      }
    }
  });
}

// Borrar estudiante con confirmación Swal
async function borrarEstudiante(id) {
  const result = await Swal.fire({
    title: '¿Seguro quieres borrar este estudiante?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, borrar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    customClass: {
      popup: 'swal-popup-custom',
      confirmButton: 'swal-delete-btn',
      cancelButton: 'swal-cancel-btn'
    }
  });

  if (result.isConfirmed) {
    const { error } = await client.from("estudiantes").delete().eq("id", id);

    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      Swal.fire('Borrado', 'Estudiante borrado correctamente', 'success');
      cargarEstudiantes();
    }
  }
}
