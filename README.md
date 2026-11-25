# MedicDate Web — Sistema Integral de Gestión de Citas Médicas

Aplicación web institucional y paneles privados por rol (**Administrador**, **Asistente** y **Médico**) para el **Centro Médico Sagrado Corazón**. Forma parte del ecosistema multiplataforma **MedicDate** (Web, Android Móvil y Escritorio), conectado en tiempo real a una base de datos relacional normalizada en 3FN (`innegone_bd_medicdate`) mediante servicios RESTful en PHP.

---

## 1. Arquitectura del Sistema

El proyecto sigue una **arquitectura cliente-servidor desacoplada por capas**, separando la presentación (HTML5/PHP/CSS3 con lineamientos Material Design 3), la lógica de control de vistas y filtrado (JavaScript modular estructurado por función), la capa de consumo de servicios HTTP (`fetch` sin caché) y el backend de APIs RESTful en PHP con MySQL/MariaDB.

```mermaid
flowchart TD
    subgraph Frontend["MedicDate-web (Cliente Web)"]
        PUB["Portal Público y Acceso<br/>index.php · login.php · logout.php · recuperar.html"]
        ADMIN["Panel Privado Administrador<br/>pages/private/admin/* · includes/*"]
        ASIST["Panel Privado Asistente<br/>pages/private/asistente/*"]
        DOC["Panel Privado Médico<br/>pages/private/doctor/*"]
        UI["Componentes Reutilizables y Estilos<br/>ui/* · utils/*.html · styles/*"]
        CTRL["Controladores y Filtros por Función<br/>scripts/auth/* · scripts/common/* · scripts/asistente/* · scripts/doctor/*<br/>utils/filtros/*.php"]
        SVC["Capa de Servicios HTTP<br/>service/api_config.js · auth_service.js · asistente_service.js · doctor_service.js"]

        PUB --> CTRL
        ASIST --> UI
        DOC --> UI
        ADMIN --> UI
        ASIST --> CTRL
        DOC --> CTRL
        CTRL --> SVC
    end

    subgraph Backend["medicDateApis/apisWeb (Servidor REST PHP)"]
        HELPER["Middleware y Validación de Rol/Sesión<br/>config/conexion.php · config/api_helper.php"]
        API_AUTH["Autenticación del Personal<br/>auth/login.php"]
        API_ASIST["Endpoints Asistente (Solo Lectura)<br/>apis_asist/agenda_general.php<br/>apis_asist/ficha_pacientes.php"]
        API_DOC["Endpoints Médico<br/>priv_doc/resumen.php<br/>priv_doc/cargar_agenda_doc.php<br/>priv_doc/notas_cita.php<br/>priv_doc/cargar_pacientes.php"]

        SVC <-->|"HTTPS JSON (no-store)"| API_AUTH
        SVC <-->|"HTTPS JSON (no-store)"| API_ASIST
        SVC <-->|"HTTPS JSON (no-store)"| API_DOC
        API_AUTH --> HELPER
        API_ASIST --> HELPER
        API_DOC --> HELPER
    end

    subgraph Datos["Base de Datos MySQL / MariaDB (3FN)"]
        DB[("innegone_bd_medicdate<br/>persona · usuario · rol · empleado · doctor · asistente<br/>paciente · cita · historial_cita · auditoria · hero_slide<br/>especialidad · tipo_atencion · horario_atencion · consultorio")]
        HELPER <-->|"Consultas Preparadas mysqli"| DB
    end
```

### Principios Arquitectónicos
- **Separación de responsabilidades:**
  - `pages/`: Pantallas privadas organizadas por rol (`admin`, `asistente`, `doctor`).
  - `includes/`: Fragmentos PHP compartidos del portal público y del panel de administración (`head.php`, `header.php`, `guardia.php`, `menu_admin.php`, `barra_admin.php`).
  - `ui/` y `utils/`: Fragmentos HTML reutilizables (menús laterales por perfil y ventanas modales de detalle de cita e historial clínico) y utilidades de filtrado en PHP.
  - `styles/`: Todas las hojas de estilo del proyecto (`estilos.css` para el portal público/acceso y `panel_privado.css` para los paneles privados bajo Material Design 3).
  - `scripts/`: Controladores JavaScript organizados por función (`auth`, `common`, `asistente`, `doctor`) usando funciones nombradas tradicionales (sin código lambda).
  - `service/`: Configuración centralizada de la API, manejo estricto de sesión sin valores por defecto y clientes HTTP por rol (`AuthService`, `AsistenteService` y `DoctorService`).
- **Tiempo real sin interferencia de caché:** Todas las peticiones HTTP se ejecutan con `cache: 'no-store'` y los endpoints PHP emiten encabezados `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` para reflejar al instante citas reservadas desde la app móvil Android o cambios de estado realizados por los médicos.
- **Seguridad y aislamiento por rol:**
  - La sesión se almacena y valida únicamente tras autenticarse (`MedicDateApi.guardarSesion` / `MedicDateApi.obtenerSesion`); si no existe una sesión válida para el rol requerido, los servicios rechazan la petición y las vistas privadas redirigen automáticamente a `login.php`.
  - El perfil **Asistente** opera estrictamente en modo **solo lectura (`GET`)** y las consultas SQL excluyen las notas clínicas internas del médico (`notas_internas`).
  - El perfil **Médico** solo puede consultar y atender citas donde `cita.id_empleado` coincide con su propio identificador de empleado autenticado.

---

## 2. Estructura del Proyecto

### 2.1 Repositorio Frontend (`MedicDate-web`)

```text
MedicDate-web/
├── index.php                                   # Portal público principal (Inicio, carrusel dinámico desde BD, servicios, médicos, ubicación)
├── login.php                                   # Pantalla de inicio de sesión del personal
├── logout.php                                  # Cierre de sesión PHP del panel administrativo
├── recuperar.html                              # Flujo visual de recuperación de contraseña por pregunta secreta
│
├── includes/
│   ├── head.php                                # Cabecera HTML y carga de fuentes, Bootstrap y styles/estilos.css
│   ├── header.php                              # Barra de navegación del portal público
│   ├── guardia.php                             # Guardia de sesión PHP para vistas de administración
│   ├── menu_admin.php                          # Menú lateral del panel de administración
│   └── barra_admin.php                         # Barra superior con usuario activo y cierre de sesión del administrador
│
├── img/
│   └── hero/                                   # Imágenes subidas para los slides del carrusel hero
│
├── styles/
│   ├── estilos.css                             # Estilos del portal público, login y recuperación de contraseña
│   └── panel_privado.css                       # Sistema de diseño MD3 para paneles privados, tablas, tarjetas, gráficas y modales
│
├── pages/
│   └── private/
│       ├── admin/
│       │   ├── panel.html                      # Panel general del administrador
│       │   ├── cuenta.html                     # Gestión de cuenta del administrador
│       │   └── hero.php                        # CRUD administrativo de imágenes/slides del carrusel hero
│       ├── asistente/
│       │   ├── agenda_general.html             # Vista de agenda general de todos los médicos (Asistente)
│       │   └── pacientes.html                  # Directorio y ficha de pacientes con sus citas (Asistente)
│       └── doctor/
│           ├── resumen.html                    # Dashboard del médico: KPIs, próxima cita, gráfica 7 días y agenda de hoy
│           ├── mi_agenda.html                  # Agenda del médico filtrable por lapso (Hoy, Próximos 7 días, Todas) y estado
│           └── mis_pasientes.html              # Pacientes atendidos por el médico e historial clínico
│
├── ui/
│   ├── lateral_panel_asistente.html            # Menú lateral de navegación para el perfil Asistente
│   └── lateral_panel_doctor.html               # Menú lateral de navegación para el perfil Médico
│
├── service/
│   ├── api_config.js                           # Configuración base de la API REST, guardado/validación de sesión y cliente fetch
│   ├── auth_service.js                         # Autenticación del personal contra auth/login.php y persistencia de sesión
│   ├── asistente_service.js                    # Métodos de consumo de APIs para el perfil Asistente
│   └── doctor_service.js                       # Métodos de consumo de APIs para el perfil Médico
│
├── scripts/
│   ├── auth/
│   │   ├── login.js                            # Validación, inicio de sesión y redirección por rol en login.php
│   │   └── recuperar.js                        # Navegación por pasos y controles de contraseña en recuperar.html
│   ├── common/
│   │   ├── ui_common.js                        # Layout privado, guardia de sesión, modales, badges de estado, fechas y toast
│   │   └── filtros.js                          # Funciones de búsqueda y filtrado en cliente por texto, lapso y estado
│   ├── asistente/
│   │   ├── agenda.js                           # Controlador de pages/private/asistente/agenda_general.html
│   │   └── pacientes.js                        # Controlador de pages/private/asistente/pacientes.html
│   └── doctor/
│       ├── resumen.js                          # Controlador de pages/private/doctor/resumen.html
│       ├── agenda.js                           # Controlador de pages/private/doctor/mi_agenda.html
│       └── pacientes.js                        # Controlador de pages/private/doctor/mis_pasientes.html
│
└── utils/
    ├── ventana_descripcion_cita.html           # Plantilla modal reutilizable para ver/atender una cita
    ├── ventana_historial_paciente.html         # Plantilla modal reutilizable para ficha e historial de citas del paciente
    └── filtros/
        ├── buscar_paciente.php                 # Filtro PHP de búsqueda de pacientes (nombre, correo, teléfono)
        ├── buscar_paciente_medico.php          # Filtro PHP de búsqueda de pacientes del médico (incluye alergias)
        ├── filtrar_citas_lapsos_tiempo.php     # Filtro PHP de citas por lapso (hoy, semana, mes, todas) o fecha exacta
        ├── filtrar_por_estados.php             # Filtro PHP de citas por estado normalizado o etiqueta visual
        └── limpiar_filtros.php                 # Restablecimiento de parámetros de filtrado por módulo
```

### 2.2 Backend de APIs Web (`medicDateApis/apisWeb`)
Desplegado en `https://medicdate.innego.net/web/apis/medicdate`:

```text
medicDateApis/apisWeb/
├── config/
│   ├── conexion.php                            # Conexión MySQLi (UTF-8 mb4) a innegone_bd_medicdate
│   └── api_helper.php                          # Encabezados CORS/no-cache, respuestas JSON, validación de sesión/rol y auditoría
├── auth/
│   └── login.php                               # POST: Autenticación del personal y devolución de datos de sesión/usuario
├── apis_asist/
│   ├── agenda_general.php                      # GET: Agenda general, KPIs, catálogo de médicos y detalle de cita sin notas internas
│   └── ficha_pacientes.php                     # GET: Directorio de pacientes y ficha individual con citas (solo lectura)
└── priv_doc/
    ├── resumen.php                             # GET: Perfil del médico, KPIs, siguiente cita, gráfica de 7 días y agenda de hoy
    ├── cargar_agenda_doc.php                   # GET: Agenda del médico por lapso/estado y detalle de cita con notas e historial
    ├── notas_cita.php                          # POST: Transacción para guardar notas internas y marcar cita como atendida
    └── cargar_pacientes.php                    # GET/POST: Pacientes del médico, historial de consultas, alergias y notas médicas
```

---

## 3. Funcionamiento por Módulo

### 3.1 Portal Público, Acceso y Administración (`index.php`, `login.php`, `recuperar.html`, `pages/private/admin/`)
- **Inicio (`index.php` + `includes/head.php` + `includes/header.php`):** Presenta el carrusel institucional cargado dinámicamente desde `hero_slide`, catálogo de servicios médicos, directorio de especialistas, horarios de atención 24/7, reseñas de pacientes y mapa de ubicación del centro médico.
- **Acceso del personal (`login.php` + `service/auth_service.js` + `scripts/auth/login.js`):** Valida las credenciales contra `auth/login.php`, persiste y verifica la sesión en `sessionStorage` mediante `MedicDateApi.guardarSesion()` y redirige al panel correspondiente según el perfil del usuario.
- **Recuperación de contraseña (`recuperar.html` + `scripts/auth/recuperar.js`):** Flujo en 3 pasos para recuperar acceso mediante pregunta secreta.
- **Administración del Hero (`pages/private/admin/hero.php`):** Permite dar de alta, editar, reordenar, activar/desactivar y eliminar slides del carrusel principal con validación de sesión PHP (`includes/guardia.php`).

---

### 3.2 Módulo del Asistente (`pages/private/asistente/`)

Diseñado bajo una política estricta de **solo lectura**: las citas son reservadas por los pacientes desde la aplicación móvil Android y el asistente las consulta para recepción y orientación.

1. **Agenda general (`agenda_general.html` + `scripts/asistente/agenda.js`):**
   - Muestra **4 indicadores superiores**: *Citas de hoy*, *Programadas*, *Pacientes* y *Médicos*.
   - **Filtros combinables:** por *Día* (`YYYY-MM-DD`), por *Médico* (cargado dinámicamente de la BD) y por *Estado* (`Programada`, `Atendida`, `Cancelada`), más botón *Limpiar*.
   - **Detalle de cita (`ventana_descripcion_cita.html`):** Al pulsar **Ver**, consulta `apis_asist/agenda_general.php?id_cita=X` y despliega fecha, paciente, teléfono, médico, especialidad, motivo y estado, **ocultando cualquier nota clínica interna del médico**.
2. **Pacientes (`pacientes.html` + `scripts/asistente/pacientes.js`):**
   - Lista todos los pacientes activos con buscador instantáneo por nombre, correo o teléfono.
   - **Ficha del paciente (`ventana_historial_paciente.html`):** Al pulsar **Ver ficha**, consulta `apis_asist/ficha_pacientes.php?id_paciente=X` y muestra sus datos de contacto, edad calculada desde `fecha_nacimiento` y la tabla de citas registradas.

---

### 3.3 Módulo del Médico (`pages/private/doctor/`)

Todas las vistas filtran automáticamente en el servidor por el `id_empleado` vinculado al médico autenticado, garantizando que cada doctor consulte y gestione únicamente sus propias citas y pacientes.

```mermaid
sequenceDiagram
    autonumber
    actor Medico as Médico Autenticado
    participant UI as Vista (resumen / mi_agenda)
    participant SVC as DoctorService (doctor_service.js)
    participant API as priv_doc/notas_cita.php
    participant DB as MySQL (innegone_bd_medicdate)

    Medico->>UI: Pulsa "Abrir" en una cita
    UI->>SVC: obtenerDetalleCitaMedico(id_cita)
    SVC->>API: GET cargar_agenda_doc.php?id_cita=X
    API->>DB: SELECT cita, paciente (WHERE id_cita=X AND id_empleado=M)
    DB-->>API: Datos de la cita + flag es_fecha_atendible
    API-->>UI: Renderiza modal con notas_internas y botones habilitados
    Medico->>UI: Escribe notas clínicas y pulsa "Marcar como atendida"
    UI->>SVC: guardarNotasCita(id_cita, notas, true)
    SVC->>API: POST notas_cita.php
    API->>DB: START TRANSACTION (SELECT ... FOR UPDATE)
    API->>DB: UPDATE cita SET notas_internas=?, estado='completada'
    API->>DB: INSERT INTO historial_cita (estado_anterior, estado_nuevo, accion)
    API->>DB: COMMIT + INSERT INTO auditoria
    API-->>UI: 200 OK (Cita marcada como atendida)
    UI-->>Medico: Cierra modal, muestra notificación toast y refresca tabla/KPIs
```

1. **Resumen (`resumen.html` + `scripts/doctor/resumen.js`):**
   - **Encabezado personalizado:** Muestra el saludo con el nombre del doctor, sus especialidades concatenadas y sus días/horarios de atención registrados en `horario_atencion`.
   - **5 tarjetas KPI:** *Citas hoy*, *Por atender hoy*, *Atendidas hoy*, *Próximos 7 días* y *Pacientes*.
   - **Siguiente por atender:** Destaca la próxima cita programada desde la fecha actual con acceso rápido al modal de atención.
   - **Gráfica de barras (7 días):** Visualiza la carga de citas no canceladas para hoy y los próximos 6 días.
   - **Agenda de hoy:** Tabla con las citas programadas y atendidas en el día actual.
2. **Mi agenda (`mi_agenda.html` + `scripts/doctor/agenda.js`):**
   - **Filtros por lapso:** Conmutador rápido entre *Hoy*, *Próximos 7 días* y *Todas*, combinado con filtro por *Estado* (`Programada`, `Atendida`, `Cancelada`).
   - **Modal de atención clínica (`ventana_descripcion_cita.html`):**
     - Permite capturar y actualizar `notas_internas` siempre que la cita no esté cancelada.
     - Habilita el botón **Marcar como atendida** únicamente cuando la cita está programada y la fecha actual es mayor o igual a la fecha de la cita (`DATE(inicio) <= CURDATE()`).
3. **Mis pacientes (`mis_pasientes.html` + `scripts/doctor/pacientes.js`):**
   - Lista los pacientes que tienen citas registradas con el médico autenticado, mostrando *Edad*, *Total de citas*, *Última consulta* (última cita atendida) y *Próxima cita*.
   - **Modal Historial contigo (`ventana_historial_paciente.html`):** Muestra edad, teléfono, correo, alergias registradas y la línea de tiempo de consultas con el médico incluyendo las notas clínicas de cada atención.

---

## 4. Catálogo de Endpoints REST (`apisWeb`)

URL base configurada en `service/api_config.js`:
```text
https://medicdate.innego.net/web/apis/medicdate
```

| Endpoint | Método | Rol Requerido | Parámetros Principales | Respuesta / Función |
| :--- | :---: | :---: | :--- | :--- |
| `auth/login.php` | `POST` | Público | JSON: `correo`, `clave` | Autentica al personal y devuelve los datos del usuario/sesión. |
| `apis_asist/agenda_general.php` | `GET` | `asistente`, `administrador` | `id_usuario`, `fecha`, `id_medico`, `estado`, `id_cita` (opcional) | Resumen general, lista de médicos, citas filtradas o detalle de cita sin `notas_internas`. |
| `apis_asist/ficha_pacientes.php` | `GET` | `asistente`, `administrador` | `id_usuario`, `busqueda`, `id_paciente` (opcional) | Lista de pacientes activos o ficha individual con su historial de citas (solo lectura). |
| `priv_doc/resumen.php` | `GET` | `medico` | `id_usuario` (o `token` / `id_sesion`) | Perfil y horario del médico, 5 KPIs, siguiente cita, gráfica de 7 días y agenda de hoy. |
| `priv_doc/cargar_agenda_doc.php` | `GET` | `medico` | `id_usuario`, `lapso` (`hoy`\|`semana`\|`todas`), `estado`, `id_cita` | Lista de citas propias del médico o detalle de cita con `notas_internas` e `historial_cita`. |
| `priv_doc/notas_cita.php` | `POST` | `medico` | JSON: `id_usuario`, `id_cita`, `notas_internas`, `marcar_atendida` | Actualiza notas internas y cambia estado a `completada`, registrando en `historial_cita` y `auditoria`. |
| `priv_doc/cargar_pacientes.php` | `GET` / `POST` | `medico` | `id_usuario`, `busqueda`, `id_paciente` (opcional) | Lista de pacientes del médico o historial clínico completo con alergias y notas por cita. |

---

## 5. Mapeo de Estados de Cita (BD <-> Interfaz)

En la base de datos (`cita.estado`), las citas manejan estados granulares normalizados que se agrupan en las 3 etiquetas visuales del prototipo:

| Estado en Base de Datos (`ENUM`) | Etiqueta en Interfaz Web | Clase CSS de Badge |
| :--- | :---: | :---: |
| `pendiente`, `confirmada`, `en_progreso` | **Programada** | `.badge.b-azul` |
| `completada` | **Atendida** | `.badge.b-ok` |
| `cancelada`, `inasistencia` | **Cancelada** | `.badge.b-rojo` |

---

## 6. Configuración y Despliegue

1. **Frontend (`MedicDate-web`):**
   - No requiere compilación (HTML5, PHP, CSS3 y JavaScript ES6 nativo).
   - Puede servirse desde cualquier servidor web con PHP (Nginx, Apache, XAMPP/Laragon) o subirse directamente al directorio público del hosting (`https://medicdate.innego.net/medicdate/`).
2. **Cambio de entorno de APIs (opcional para pruebas locales):**
   - Por defecto, `service/api_config.js` apunta a `https://medicdate.innego.net/web/apis/medicdate`.
   - Para apuntar a un servidor local durante pruebas, basta con ejecutar en la consola del navegador:
     ```javascript
     localStorage.setItem('medicdate_api_base', 'http://localhost/medicDateApis/apisWeb');
     ```
   - Para volver al servidor en producción:
     ```javascript
     localStorage.removeItem('medicdate_api_base');
     ```
