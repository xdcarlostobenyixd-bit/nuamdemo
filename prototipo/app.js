const records = [
  { id:'DJ-2026-001504', rut:'12.345.678-9', periodo:'2026', monto:'$ 12.450.000', estado:'Válido', codigo:'A1', lote:'declaracion_2026_v2.csv', fecha:'22 oct 2026 · 15:42', error:'Sin observaciones' },
  { id:'DJ-2026-001503', rut:'98.765.432-1', periodo:'2026', monto:'$ 4.850.000', estado:'Advertencia', codigo:'B2', lote:'declaracion_2026_v2.csv', fecha:'22 oct 2026 · 15:42', error:'Crédito de impuesto requiere revisión' },
  { id:'DJ-2026-001502', rut:'11.222.333-4', periodo:'2025', monto:'$ 7.120.000', estado:'Rechazado', codigo:'DUP', lote:'cierre_2025.xlsx', fecha:'21 oct 2026 · 11:18', error:'Registro duplicado en el período tributario' },
  { id:'DJ-2025-000983', rut:'17.999.111-2', periodo:'2025', monto:'$ 3.900.000', estado:'Válido', codigo:'A1', lote:'cierre_2025.xlsx', fecha:'21 oct 2026 · 11:18', error:'Sin observaciones' }
];

const profiles = {
  Administrador: { initials:'AD', access:['dashboard','carga','mantenedor','auditoria'] },
  'Analista tributario': { initials:'AT', access:['dashboard','carga','mantenedor'] },
  Auditor: { initials:'AU', access:['dashboard','mantenedor','auditoria'] }
};

const routeByPage = { dashboard:'resumen', carga:'carga', mantenedor:'mantenedor', auditoria:'auditoria' };
const savedPage = location.hash.replace('#/','');
const initialPage = Object.values(routeByPage).includes(savedPage) ? Object.keys(routeByPage).find(key => routeByPage[key] === savedPage) : 'login';

let state = {
  profile:'Analista tributario',
  page:initialPage,
  selected:null,
  toast:'',
  progress:0,
  file:'',
  fileText:'',
  validation:null,
  isReading:false,
  validationRunning:false,
  audit:[]
};

const app = document.querySelector('#app');
const navItems = [['dashboard','Resumen'],['carga','Carga masiva'],['mantenedor','Mantenedor'],['auditoria','Auditoría']];
const statusClass = status => status === 'Válido' ? 'ok' : status === 'Advertencia' ? 'warn' : 'bad';
const statusIcon = status => status === 'Válido' ? '●' : status === 'Advertencia' ? '▲' : '●';

function escapeCsv(value) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"','""')}"`;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function addAudit(action, detail) {
  state.audit.unshift({
    action,
    detail,
    profile:state.profile,
    date:new Date().toLocaleString('es-CL')
  });
}

function showToast(text) {
  state.toast = text;
  render();
  window.setTimeout(() => { state.toast = ''; render(); }, 2600);
}

function setPage(page) {
  state.page = page;
  state.selected = null;
  const hash = routeByPage[page];
  history.replaceState(null,'', hash ? `#/` + hash : location.pathname);
  render();
}

function renderLogin() {
  app.innerHTML = `<section class="login-shell">
    <div class="brand-panel">
      <div class="wordmark">NUAM · DATA TRUST</div>
      <h1>Calificaciones tributarias con control desde el origen.</h1>
      <p>Prototipo navegable del mantenedor DJ1948. Simula acceso por roles, ingesta masiva, validación de datos y trazabilidad de auditoría.</p>
      <div class="signals"><span class="signal">Validación de formato</span><span class="signal">Control anti-duplicados</span><span class="signal">Auditoría trazable</span></div>
    </div>
    <div class="login-card"><div class="card">
      <span class="tag">PROTOTIPO SIN BACKEND</span><h2>Ingresa al entorno</h2>
      <p class="muted">Selecciona un perfil para recorrer las funcionalidades visibles según su rol.</p>
      <div class="role-grid">${Object.keys(profiles).map(role => `
        <button class="role ${role === state.profile ? 'active':''}" data-role="${role}">
          <span class="role-icon">${profiles[role].initials}</span>
          <span><strong>${role}</strong><small>${role === 'Administrador' ? 'Gestión completa y auditoría' : role === 'Auditor' ? 'Consulta y trazabilidad' : 'Carga, validación y consulta'}</small></span>
        </button>`).join('')}</div>
      <button class="primary" id="enter">Acceder al prototipo</button>
      <p class="demo-note">Los datos mostrados son referenciales y no se almacenan.</p>
    </div></div>
  </section>`;

  document.querySelectorAll('[data-role]').forEach(button => button.onclick = () => {
    state.profile = button.dataset.role;
    renderLogin();
  });
  document.querySelector('#enter').onclick = () => {
    addAudit('Inicio de sesión', `Acceso mediante el perfil ${state.profile}`);
    setPage('dashboard');
  };
}

function shell(title, subtitle, body) {
  const config = profiles[state.profile];
  const items = navItems.filter(([id]) => config.access.includes(id));
  app.innerHTML = `<div class="layout">
    <aside class="sidebar">
      <div class="wordmark">NUAM</div>
      <div class="profile"><b>${state.profile}</b><span>sesión simulada · ${config.initials}</span></div>
      <nav class="nav" aria-label="Navegación principal">${items.map(([id,label]) => `<button data-nav="${id}" class="${state.page === id ? 'active':''}">${label}</button>`).join('')}</nav>
      <button class="logout" id="logout">Salir</button>
    </aside>
    <main class="main">
      <header class="topline"><div><h1>${title}</h1><p>${subtitle}</p></div><span class="tag">${state.profile.toUpperCase()}</span></header>
      ${body}
    </main>
  </div>${state.toast ? `<aside class="toast" role="status">${state.toast}</aside>` : ''}`;

  document.querySelectorAll('[data-nav]').forEach(button => button.onclick = () => setPage(button.dataset.nav));
  document.querySelector('#logout').onclick = () => {
    addAudit('Cierre de sesión','Sesión simulada finalizada');
    state.page = 'login';
    state.selected = null;
    state.progress = 0;
    state.file = '';
    state.fileText = '';
    state.fileRows = null;
    state.validation = null;
    state.isReading = false;
    state.validationRunning = false;
    history.replaceState(null,'',location.pathname);
    render();
  };
}

function dashboard() {
  shell('Resumen operativo','Monitorea el estado del proceso de calificaciones tributarias.',`
    <section class="metrics">
      <article class="metric"><span>Registros procesados</span><b>26.480</b><small>↑ 12,4% esta semana</small></article>
      <article class="metric"><span>Lotes exitosos</span><b>18</b><small>95,8% aprobación</small></article>
      <article class="metric"><span>En validación</span><b>02</b><small>Motor activo</small></article>
      <article class="metric"><span>Rechazados</span><b>03</b><small class="danger">requieren revisión</small></article>
    </section>
    <section class="grid-2">
      <article class="panel"><h2>Acción rápida</h2><div class="dropzone"><div><strong>Inicia una carga masiva DJ1948</strong><p>Accede al flujo de validación de archivos CSV o XLSX.</p><button class="primary" id="goUpload" style="max-width:260px">Ir a carga masiva</button></div></div></article>
      <article class="panel"><h2>Estado operativo</h2><div class="recent">
        <div class="recent-row"><span>Conexión de validación<small>Reglas de esquema y RUT</small></span><b class="pill ok">● Operativa</b></div>
        <div class="recent-row"><span>Auditoría de eventos<small>Bitácora disponible</small></span><b class="pill ok">● Activa</b></div>
        <div class="recent-row"><span>Registros observados<small>Lote DJ-2026-10-22</small></span><b class="pill warn">▲ 3 casos</b></div>
      </div></article>
    </section>`);
  document.querySelector('#goUpload').onclick = () => setPage('carga');
}

function parseDelimitedText(text) {
  const delimiter = text.indexOf(';') >= 0 && text.indexOf('\t') < 0 &&
    text.split('\n')[0].split(';').length > text.split('\n')[0].split(',').length ? ';' : ',';
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index++;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      row.push(field.trim());
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index++;
      row.push(field.trim());
      if (row.some(value => value !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (quoted) return { error:'El archivo contiene una comilla sin cerrar.', rows:[] };
  row.push(field.trim());
  if (row.some(value => value !== '')) rows.push(row);
  return { rows };
}

function normalizeRut(rut) {
  return String(rut).replaceAll('.','').replaceAll(' ','').replace(/-/g,'').toUpperCase();
}

function validRut(rut) {
  const normalized = normalizeRut(rut);
  return /^\d{7,8}[0-9K]$/.test(normalized);
}

function validateRows(rows) {
  if (!rows.length) return { valid:false, validRows:0, warnedRows:0, rejectedRows:0, errors:['El archivo está vacío'] };
  const headers = rows[0].map(header => String(header).trim().toLowerCase());
  const required = ['rut','periodo','monto'];
  const missing = required.filter(header => !headers.includes(header));
  if (missing.length) {
    return { valid:false, validRows:0, warnedRows:0, rejectedRows:Math.max(rows.length - 1,0), errors:[`Faltan columnas obligatorias: ${missing.join(', ')}`] };
  }
  let validRows = 0, warnedRows = 0, rejectedRows = 0;
  const seen = new Set();
  for (let index = 1; index < rows.length; index++) {
    const row = Object.fromEntries(headers.map((header, position) => [header, String(rows[index][position] ?? '').trim()]));
    const rutValid = validRut(row.rut);
    const periodoValid = /^\d{4}$/.test(row.periodo);
    const numericValue = Number(String(row.monto).replaceAll('$','').replaceAll('.','').replaceAll(',','.'));
    const montoValid = /^\d[\d.,]*$/.test(row.monto) && Number.isFinite(numericValue);
    const key = `${normalizeRut(row.rut)}-${row.periodo}`;
    if (!rutValid || !periodoValid || !montoValid) rejectedRows++;
    else if (seen.has(key)) rejectedRows++;
    else if (numericValue > 100000000) warnedRows++;
    else validRows++;
    seen.add(key);
  }
  return { valid:true, validRows, warnedRows, rejectedRows, errors:[] };
}

function validateCsv(text) {
  const parsed = parseDelimitedText(text);
  if (parsed.error) return { valid:false, validRows:0, warnedRows:0, rejectedRows:0, errors:[parsed.error] };
  return validateRows(parsed.rows);
}

function upload() {
  const validation = state.validation;
  shell('Carga masiva DJ1948','Simulación de ingesta, validación y reporte de un archivo local.',`
    <section class="grid-2">
      <article class="panel"><h2>Nuevo lote de declaraciones</h2>
        <div class="dropzone" id="drop"><div><strong>${state.file || 'Arrastra un archivo o selecciónalo'}</strong><p>Formatos admitidos: CSV y XLSX · máximo 50 MB</p><input type="file" id="file" accept=".csv,.xlsx" hidden><button class="outline" id="choose">Seleccionar archivo</button></div></div>
        <div class="progress-wrap"><div class="progress-label"><span>${state.progress ? 'Validando estructura y duplicidad…' : 'Sin carga iniciada'}</span><b>${state.progress}%</b></div><div class="progress"><div style="width:${state.progress}%"></div></div></div>
        <div class="upload-actions"><button class="primary" id="simulate" ${state.file && !state.isReading && !state.validationRunning ? '' : 'disabled'}>${state.isReading ? 'Leyendo archivo…' : state.validationRunning ? 'Validando…' : 'Iniciar validación'}</button><button class="outline" id="template">Descargar plantilla CSV</button></div>
        ${validation ? `<div class="validation ${validation.valid ? 'success-validation':'error-validation'}"><b>${validation.valid ? 'Archivo validado' : 'Archivo no compatible'}</b><p>${validation.valid ? `${validation.validRows} válidos · ${validation.warnedRows} observados · ${validation.rejectedRows} rechazados` : validation.errors.join('. ')}</p></div>` : ''}
      </article>
      <article class="panel"><h2>Reglas aplicadas</h2><div class="recent">
        <div class="recent-row"><span>1. Estructura del archivo<small>Columnas obligatorias y tipos</small></span><b class="pill ok">Esquema</b></div>
        <div class="recent-row"><span>2. Identificación tributaria<small>Formato de RUT y período</small></span><b class="pill ok">Formato</b></div>
        <div class="recent-row"><span>3. Integridad del lote<small>Hash por RUT + período</small></span><b class="pill ok">Duplicados</b></div>
      </div></article>
    </section>`);

  document.querySelector('#choose').onclick = () => document.querySelector('#file').click();
  document.querySelector('#file').onchange = event => loadFile(event.target.files[0]);
  document.querySelector('#drop').ondragover = event => event.preventDefault();
  document.querySelector('#drop').ondrop = event => {
    event.preventDefault();
    if (event.dataTransfer.files[0]) loadFile(event.dataTransfer.files[0]);
  };
  document.querySelector('#simulate').onclick = () => runValidation();
  document.querySelector('#template').onclick = () => {
    downloadFile('plantilla_dj1948.csv','rut,periodo,monto\r\n12.345.678-9,2026,12450000\r\n','text/csv;charset=utf-8');
    addAudit('Plantilla descargada','plantilla_dj1948.csv');
    showToast('Plantilla CSV descargada.');
  };
}

function loadFile(file) {
  if (!file) return;
  const extension = file.name.split('.').pop().toLowerCase();
  if (!['csv','xlsx'].includes(extension)) {
    showToast('Formato no permitido. Seleccione CSV o XLSX.');
    return;
  }
  if (file.size > 50 * 1024 * 1024) {
    showToast('El archivo supera el límite de 50 MB.');
    return;
  }
  state.file = file.name;
  state.validation = null;
  state.progress = 0;
  state.isReading = true;
  state.validationRunning = false;
  state.fileText = '';
  state.fileRows = null;
  if (extension === 'csv') {
    const reader = new FileReader();
    reader.onload = event => { state.fileText = String(event.target.result); state.isReading = false; render(); };
    reader.onerror = () => { state.isReading = false; showToast('No fue posible leer el archivo.'); };
    reader.readAsText(file);
  } else {
    if (!window.XLSX) {
      state.isReading = false;
      showToast('No se pudo cargar el lector XLSX. Intente con CSV.');
      state.file = '';
      render();
      return;
    }
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const workbook = window.XLSX.read(event.target.result, { type:'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = window.XLSX.utils.sheet_to_json(firstSheet, { header:1, defval:'' });
        state.fileRows = rows;
      } catch {
        state.validation = { valid:false, validRows:0, warnedRows:0, rejectedRows:0, errors:['El archivo XLSX no pudo ser interpretado'] };
      }
      state.isReading = false;
      render();
    };
    reader.onerror = () => { state.isReading = false; showToast('No fue posible leer el archivo XLSX.'); };
    reader.readAsArrayBuffer(file);
  }
  addAudit('Archivo seleccionado', `${file.name} · ${(file.size/1024).toFixed(1)} KB`);
  render();
}

function runValidation() {
  if (state.isReading || state.validationRunning) return;
  state.validationRunning = true;
  state.progress = 5;
  render();
  let progress = 5;
  const timer = setInterval(() => {
    progress = Math.min(progress + 19, 100);
    state.progress = progress;
    render();
    if (progress >= 100) {
      clearInterval(timer);
      window.setTimeout(() => {
        if (state.file.toLowerCase().endsWith('.xlsx')) {
          state.validation = state.fileRows ? validateRows(state.fileRows) : { valid:false, validRows:0, warnedRows:0, rejectedRows:0, errors:['No se encontró una hoja válida'] };
        } else {
          state.validation = validateCsv(state.fileText);
        }
        state.progress = 100;
        state.validationRunning = false;
        addAudit('Validación ejecutada', `${state.file} · ${state.validation.valid ? 'compatible' : 'incompatible'}`);
        render();
        showToast(state.validation.valid ? 'Validación finalizada con observaciones controladas.' : 'Validación detenida: revise las columnas.');
      }, 250);
    }
  }, 240);
}

function maintainer() {
  const detail = state.selected ? records.find(record => record.id === state.selected) : null;
  const tableRows = records.map(record => `<tr>
    <td><b>${record.id}</b><br><small>${record.rut}</small></td><td>${record.periodo}</td><td>${record.monto}</td>
    <td><span class="pill ${statusClass(record.estado)}">${statusIcon(record.estado)} ${record.estado}</span></td>
    <td>${record.codigo}</td><td><button class="linkbtn" data-detail="${record.id}">Ver detalle</button></td>
  </tr>`).join('');

  shell('Mantenedor de declaraciones','Consulta, filtra y revisa el resultado de validación de cada declaración DJ1948.',`
    <section class="panel">
      <div class="filters">
        <input id="rutFilter" placeholder="Buscar RUT o identificador" aria-label="Buscar RUT o identificador">
        <select id="periodFilter" aria-label="Período"><option value="">Todos los períodos</option><option>2026</option><option>2025</option></select>
        <select id="statusFilter" aria-label="Estado"><option value="">Todos los estados</option><option>Válido</option><option>Advertencia</option><option>Rechazado</option></select>
        <button class="secondary" id="export">Exportar CSV</button>
      </div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Declaración / RUT</th><th>Período</th><th>Monto</th><th>Estado</th><th>Código</th><th>Acción</th></tr></thead><tbody id="rows">${tableRows}</tbody></table></div>
    </section>
    ${detail ? `<section class="panel detail-panel"><div class="detail-heading"><h2>Detalle ${detail.id}</h2><button class="outline" id="closeDetail">Cerrar</button></div>
      <div class="detail">
        <div><small>Contribuyente</small><b>${detail.rut}</b></div><div><small>Archivo de origen</small><b>${detail.lote}</b></div>
        <div><small>Fecha de carga</small><b>${detail.fecha}</b></div><div><small>Resultado de validación</small><b class="pill ${statusClass(detail.estado)}">${statusIcon(detail.estado)} ${detail.estado}</b></div>
        <div><small>Código de calificación</small><b>${detail.codigo}</b></div><div><small>Observación</small><b>${detail.error}</b></div>
      </div><button class="secondary" id="exportPdf">Imprimir reporte</button></section>` : ''}`);

  const filter = () => {
    const query = document.querySelector('#rutFilter').value.toLowerCase();
    const period = document.querySelector('#periodFilter').value;
    const status = document.querySelector('#statusFilter').value;
    const found = records.filter(record => (record.rut + record.id).toLowerCase().includes(query) &&
      (!period || record.periodo === period) && (!status || record.estado === status));
    document.querySelector('#rows').innerHTML = found.length ? found.map(record => `<tr>
      <td><b>${record.id}</b><br><small>${record.rut}</small></td><td>${record.periodo}</td><td>${record.monto}</td>
      <td><span class="pill ${statusClass(record.estado)}">${statusIcon(record.estado)} ${record.estado}</span></td>
      <td>${record.codigo}</td><td><button class="linkbtn" data-detail="${record.id}">Ver detalle</button></td>
    </tr>`).join('') : '<tr><td colspan="6" class="empty">No hay resultados para los filtros aplicados.</td></tr>';
    bindDetails();
  };

  ['rutFilter','periodFilter','statusFilter'].forEach(id => document.querySelector('#' + id).oninput = filter);
  function bindDetails() {
    document.querySelectorAll('[data-detail]').forEach(button => button.onclick = () => {
      state.selected = button.dataset.detail;
      addAudit('Detalle consultado', `Declaración ${state.selected}`);
      render();
    });
  }
  bindDetails();

  document.querySelector('#export').onclick = () => {
    const content = ['id,rut,periodo,monto,estado,codigo,lote,fecha,observacion',
      ...records.map(record => [record.id,record.rut,record.periodo,record.monto,record.estado,record.codigo,record.lote,record.fecha,record.error].map(escapeCsv).join(','))].join('\n');
    downloadFile('declaraciones_dj1948.csv', content, 'text/csv;charset=utf-8');
    addAudit('Exportación CSV','Listado completo de declaraciones');
    showToast('Exportación CSV generada.');
  };

  if (detail) {
    document.querySelector('#closeDetail').onclick = () => { state.selected = null; render(); };
    document.querySelector('#exportPdf').onclick = () => {
      addAudit('Reporte impreso', `Declaración ${detail.id}`);
      window.print();
    };
  }
}

function audit() {
  const auditItems = [
    { icon:'#0e6975', action:'Carga masiva finalizada', detail:'Analista tributario · 22 oct 2026, 15:42 · declaracion_2026_v2.csv' },
    { icon:'#d79b00', action:'Registro observado', detail:'Regla DUP-01 · línea 809 · RUT 11.222.333-4' },
    { icon:'#0e6975', action:'Reporte consultado', detail:'Auditor · 22 oct 2026, 15:58 · DJ-2026-001503' },
    { icon:'#b42318', action:'Intento de acceso denegado', detail:'Rol insuficiente · endpoint de administración · 22 oct 2026, 16:10' },
    ...state.audit.map(item => ({ icon:'#2f75b5', action:item.action, detail:`${item.profile} · ${item.date} · ${item.detail}` }))
  ];

  shell('Auditoría y trazabilidad','Revisión de acciones, eventos y resultados de controles.',`
    <section class="grid-2">
      <article class="panel"><h2>Eventos recientes</h2><div class="timeline">${auditItems.map(item => `
        <div class="event"><i style="background:${item.icon}"></i><div><b>${item.action}</b><br><small>${item.detail}</small></div></div>`).join('')}</div></article>
      <article class="panel"><h2>Controles de trazabilidad</h2><div class="recent">
        <div class="recent-row"><span>Usuario y perfil registrado</span><b class="pill ok">Activo</b></div>
        <div class="recent-row"><span>Marca de tiempo del evento</span><b class="pill ok">UTC</b></div>
        <div class="recent-row"><span>Resultado y regla aplicada</span><b class="pill ok">Trazable</b></div>
        <div class="recent-row"><span>Origen de datos</span><b class="pill ok">Local</b></div>
      </div></article>
    </section>
    <button class="secondary audit-export" id="exportAudit">Exportar bitácora CSV</button>`);

  document.querySelector('#exportAudit').onclick = () => {
    const content = ['accion,detalle',
      ...auditItems.map(item => [item.action,item.detail].map(escapeCsv).join(','))].join('\n');
    downloadFile('bitacora_nuam.csv', content, 'text/csv;charset=utf-8');
    showToast('Bitácora exportada.');
  };
}

function render() {
  if (state.page === 'login') renderLogin();
  else if (state.page === 'dashboard') dashboard();
  else if (state.page === 'carga') upload();
  else if (state.page === 'mantenedor') maintainer();
  else audit();
}

render();
