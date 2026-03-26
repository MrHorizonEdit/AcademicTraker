const WEIGHTS = { Baja: 1, Media: 2, Alta: 3.5, '¡Esa mondá qué!': 6 };
const STORAGE_KEY = 'tracker_data_v2';

// ── UID estable (no se regenera en cada carga) ──
function uid() { return Math.random().toString(36).slice(2, 10); }

// DEFAULT_DATA solo se usa si no hay nada en localStorage
function getDefaultData() {
    return [
        {
            id: 'default_01',
            nombre: 'Molestar a Santi',
            open: true,
            fecha: '2026-04-14',
            actividades: [
                { id: 'act_01', nombre: 'Pedirle audio de Porta', dificultad: 'Baja', duracion: '0.5', realizado: false },
                { id: 'act_02', nombre: 'Burlarse del oso polar', dificultad: 'Media', duracion: '0.5', realizado: false },
                { id: 'act_04', nombre: 'Ganarle en rebotes', dificultad: '¡Esa mondá qué!', duracion: '0.5', realizado: false },
                { id: 'act_05', nombre: 'Fijar mensaje 8 días más', dificultad: 'Alta', duracion: '0.5', realizado: false },
                { id: 'act_03', nombre: 'Ya dije lo de Porta?', dificultad: 'Alta', duracion: '0.5', realizado: false },
            ]
        }
    ];
}

// ── Carga inicial segura ──
function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {
        console.warn('Error leyendo localStorage, usando datos por defecto.', e);
    }
    return getDefaultData();
}

let data = loadData();

// ── Guardado inmediato (sin debounce para localStorage) ──
let toastTimer;
function save() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        // Toast de confirmación
        const toast = document.getElementById('saveToast');
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 1400);
    } catch (e) {
        console.error('Error guardando en localStorage:', e);
        alert('⚠️ No se pudo guardar. Tu navegador puede tener el almacenamiento bloqueado o lleno.');
    }
}

// ── CALC ──
function calcPct(actividades) {
    const withW = actividades.filter(a => WEIGHTS[a.dificultad] != null);
    if (!withW.length) {
        const t = actividades.length;
        return t ? Math.round(actividades.filter(a => a.realizado).length / t * 100) : 0;
    }
    const total = withW.reduce((s, a) => s + WEIGHTS[a.dificultad], 0);
    const done = withW.filter(a => a.realizado).reduce((s, a) => s + WEIGHTS[a.dificultad], 0);
    return total ? Math.round(done / total * 100) : 0;
}

function dateClass(dateStr) {
    if (!dateStr) return '';
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const diff = Math.ceil((new Date(dateStr + 'T00:00:00') - now) / 86400000);
    if (diff <= 3) return 'date-rojo';
    if (diff <= 7) return 'date-amarillo';
    return 'date-verde';
}

// ── RENDER ──
function renderAll() {
    const list = document.getElementById('materiasList');
    list.innerHTML = '';
    data.forEach(m => list.appendChild(buildCard(m)));
}

function buildCard(m) {
    const pct = calcPct(m.actividades);
    const done = pct >= 100;

    const card = document.createElement('div');
    card.className = 'materia-card' + (done ? ' completada' : '');
    card.dataset.id = m.id;

    // Header
    const hdr = document.createElement('div');
    hdr.className = 'materia-header';
    hdr.onclick = e => {
        if (['INPUT', 'SELECT'].includes(e.target.tagName)) return;
        m.open = !m.open; save(); renderAll();
    };

    const left = document.createElement('div');
    left.className = 'materia-left';

    const arrow = document.createElement('span');
    arrow.className = 'toggle-arrow' + (m.open ? ' open' : '');
    arrow.textContent = '▶';

    const nameInp = document.createElement('input');
    nameInp.className = 'materia-name-input';
    nameInp.value = m.nombre;
    nameInp.placeholder = 'Nombre materia...';
    nameInp.onchange = e => { m.nombre = e.target.value; save(); };

    left.appendChild(arrow);
    left.appendChild(nameInp);

    const meta = document.createElement('div');
    meta.className = 'materia-meta';

    const dateWrap = document.createElement('div');
    dateWrap.className = 'materia-date-wrap';

    const dateLabel = document.createElement('span');
    dateLabel.className = 'materia-date-label';
    dateLabel.textContent = '📅';

    const dateInp = document.createElement('input');
    dateInp.type = 'date';
    dateInp.className = 'materia-date-input ' + dateClass(m.fecha);
    dateInp.value = m.fecha || '';
    dateInp.onchange = e => { m.fecha = e.target.value; save(); renderAll(); };

    dateWrap.appendChild(dateLabel);
    dateWrap.appendChild(dateInp);

    const pctBadge = document.createElement('span');
    pctBadge.className = 'pct-badge' + (done ? ' done' : '');
    pctBadge.textContent = pct + '%';

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-del-materia';
    delBtn.textContent = '✕';
    delBtn.title = 'Eliminar materia';
    delBtn.onclick = e => {
        e.stopPropagation();
        if (confirm('¿Eliminar "' + m.nombre + '"?')) {
            data = data.filter(x => x.id !== m.id); save(); renderAll();
        }
    };

    meta.appendChild(dateWrap);
    meta.appendChild(pctBadge);
    meta.appendChild(delBtn);

    hdr.appendChild(left);
    hdr.appendChild(meta);

    // Progress bar
    const pbWrap = document.createElement('div');
    pbWrap.className = 'progress-bar-wrap';
    const pbFill = document.createElement('div');
    pbFill.className = 'progress-bar-fill' + (done ? ' done' : '');
    pbFill.style.width = pct + '%';
    pbWrap.appendChild(pbFill);

    // Body
    const body = document.createElement('div');
    body.className = 'materia-body collapse-body' + (m.open ? '' : ' hidden');

    const colH = document.createElement('div');
    colH.className = 'col-headers';
    colH.innerHTML = '<span>Actividad</span><span>Dificultad</span><span>Hrs</span><span></span>';
    body.appendChild(colH);

    m.actividades.forEach(act => body.appendChild(buildRow(m, act)));

    const addBtn = document.createElement('button');
    addBtn.className = 'btn-add-act';
    addBtn.innerHTML = '＋ Agregar actividad';
    addBtn.onclick = () => {
        m.actividades.push({ id: uid(), nombre: '', dificultad: '', duracion: '', realizado: false });
        save(); renderAll();
        setTimeout(() => {
            const c = document.querySelector(`[data-id="${m.id}"]`);
            if (c) { const ins = c.querySelectorAll('.act-nombre'); ins[ins.length - 1]?.focus(); }
        }, 40);
    };
    body.appendChild(addBtn);

    card.appendChild(hdr);
    card.appendChild(pbWrap);
    card.appendChild(body);
    return card;
}

function buildRow(m, act) {
    const row = document.createElement('div');
    row.className = 'actividad-row' + (act.realizado ? ' completada-row' : '');

    const nombre = document.createElement('input');
    nombre.className = 'cell-input act-nombre';
    nombre.value = act.nombre;
    nombre.placeholder = 'Actividad...';
    nombre.onchange = e => { act.nombre = e.target.value; save(); };

    const difClsMap = { Baja: 'dif-baja', Media: 'dif-media', Alta: 'dif-alta', '¡Esa mondá qué!': 'dif-esa' };
    const dif = document.createElement('select');
    dif.className = 'cell-select ' + (difClsMap[act.dificultad] || '');
    ['', 'Baja', 'Media', 'Alta', '¡Esa mondá qué!'].forEach(o => {
        const opt = document.createElement('option');
        opt.value = o; opt.textContent = o || '—';
        if (o === act.dificultad) opt.selected = true;
        dif.appendChild(opt);
    });
    dif.onchange = e => {
        act.dificultad = e.target.value;
        dif.className = 'cell-select ' + (difClsMap[e.target.value] || '');
        save(); renderAll();
    };

    const dur = document.createElement('input');
    dur.className = 'cell-input';
    dur.value = act.duracion;
    dur.placeholder = '0';
    dur.type = 'number';
    dur.min = '0';
    dur.step = '0.5';
    dur.onchange = e => { act.duracion = e.target.value; save(); };

    const actions = document.createElement('div');
    actions.className = 'row-actions';

    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.className = 'check-done';
    chk.checked = act.realizado;
    chk.onchange = e => { act.realizado = e.target.checked; save(); renderAll(); };

    const del = document.createElement('button');
    del.className = 'btn-del';
    del.title = 'Eliminar';
    del.innerHTML = '✕';
    del.onclick = () => { m.actividades = m.actividades.filter(x => x.id !== act.id); save(); renderAll(); };

    actions.appendChild(chk);
    actions.appendChild(del);

    row.appendChild(nombre);
    row.appendChild(dif);
    row.appendChild(dur);
    row.appendChild(actions);
    return row;
}

// ── MODALS ──
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

function showAddMateriaModal() {
    document.getElementById('inputMateria').value = '';
    openModal('modalMateria');
    setTimeout(() => document.getElementById('inputMateria').focus(), 50);
}

function confirmMateria() {
    const val = document.getElementById('inputMateria').value.trim();
    if (!val) return;
    data.push({ id: uid(), nombre: val, open: true, fecha: '', actividades: [] });
    save(); renderAll();
    closeModal('modalMateria');
}

document.querySelectorAll('.modal-overlay').forEach(el => {
    el.onclick = e => { if (e.target === el) el.classList.remove('show'); };
});

// ── INIT ──
renderAll();