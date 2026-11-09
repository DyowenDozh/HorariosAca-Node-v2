// ============================================================================
// Motor de generación — v8 (dos fases + niveles + límites/disponibilidad + reglas de días)
// ----------------------------------------------------------------------------
// Interfaz:
//   generateSchedule({ days, demands, teachers, canTeach, rules, prefDetails,
//                      availability?, dayLimits? })
//   -> { ok:true, placements:[...], stats, warning?, relaxed?, unplaced? }
//   -> { ok:false, reason }
//
// Entradas nuevas (opcionales):
//   availability: [{ teacher_id, day_key, hour_index }]  // franjas ND (no disponible)
//   dayLimits:    [{ teacher_id, day_key, max_hours }]    // máx horas/día (0 = sin límite)
//
// Preferencias detalladas (prefDetails[].grouping):
//   'GROUP2'    → una materia: 1 día con 2 horas consecutivas, resto máx 1/día.
//   'MAX1'      → máx 1/día (igual que por defecto).
//   'NO_CONSEC' → los días de la materia no pueden ser consecutivos (p. ej. Ed. Física
//                 lunes y miércoles, no lunes y martes).
//
// Niveles (se detiene en el primero que funciona):
//   PRECHEQUEO — imposibles obvios (profesor con carga obligatoria > su capacidad).
//   NIVEL 1    — todas las restricciones (incluye preferencias detalladas).
//   NIVEL 2    — ignora las preferencias detalladas; mantiene máx 1/día, límites y ND.
//   NIVEL 3    — mejor esfuerzo: solo físicas + ND; deja huecos y avisa.
// ============================================================================

const BUDGET_TIER1 = 30000;
const BUDGET_TIER2 = 15000;
const BUDGET_TIER3 = 15000;

function shuffle(arr, rnd) {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1));[arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
}
function makeRng(seed) {
    let a = seed >>> 0;
    return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function generateSchedule(input) {
    const { days, demands, teachers, canTeach, rules, prefDetails, availability, dayLimits } = input;

    const numDays = days.length;
    if (numDays === 0) return { ok: false, reason: 'El horario no tiene días laborales configurados.' };
    const hoursOfDay = days.map(d => d.hours);
    const S = hoursOfDay.reduce((a, b) => a + b, 0);
    if (S === 0) return { ok: false, reason: 'Los días configurados no tienen franjas de clase.' };

    const dayIdx = {}; days.forEach((d, i) => { dayIdx[d.day_key] = i; });

    const gradeIds = [...new Set(demands.map(d => d.grade_id))];
    for (const gid of gradeIds) {
        const total = demands.filter(d => d.grade_id === gid).reduce((s, d) => s + d.weekly_hours, 0);
        if (total > S) return { ok: false, reason: `El grado ${gid} requiere ${total} horas pero la semana solo tiene ${S} franjas. Reduce horas o agrega días.`, impossible: true };
    }

    // --- Disponibilidad ND por profesor: ndHours[tid][dayIdx] = Set(horas), ndCount ---
    const ndHours = {}; const ndCount = {};
    for (const t of teachers) { ndHours[t.teacher_id] = Array.from({ length: numDays }, () => new Set()); ndCount[t.teacher_id] = new Int16Array(numDays); }
    if (availability) for (const a of availability) {
        const di = dayIdx[a.day_key]; if (di === undefined) continue;
        if (!ndHours[a.teacher_id]) continue;
        if (!ndHours[a.teacher_id][di].has(a.hour_index)) { ndHours[a.teacher_id][di].add(a.hour_index); ndCount[a.teacher_id][di]++; }
    }
    // --- Límite diario por profesor: limit[tid][dayIdx] = max_hours (0 = sin límite) ---
    const dayLimit = {};
    for (const t of teachers) dayLimit[t.teacher_id] = new Int16Array(numDays); // 0 = sin límite
    if (dayLimits) for (const dl of dayLimits) {
        const di = dayIdx[dl.day_key]; if (di === undefined) continue;
        if (dayLimit[dl.teacher_id]) dayLimit[dl.teacher_id][di] = dl.max_hours || 0;
    }

    // Cupo efectivo de un profesor en un día: horas del día, menos ND, acotado por el límite.
    function teacherCap(tid, di) {
        let cap = hoursOfDay[di] - (ndCount[tid] ? ndCount[tid][di] : 0);
        const lim = dayLimit[tid] ? dayLimit[tid][di] : 0;
        if (lim && lim > 0) cap = Math.min(cap, lim);
        return cap < 0 ? 0 : cap;
    }

    function getCandidates(gid, sid) {
        const must = [], may = [];
        for (const t of teachers) {
            if (!canTeach[`${t.teacher_id}-${sid}`]) continue;
            const r = rules[`${t.teacher_id}-${sid}-${gid}`];
            if (r === 'NO') continue;
            if (r === 'DEBE') must.push(t.teacher_id); else may.push(t.teacher_id);
        }
        return must.length > 0 ? must : may;
    }

    const prefMap = {};
    if (prefDetails) for (const pd of prefDetails) {
        if (pd.grouping && pd.grouping !== 'NONE') prefMap[`${pd.grade_id}-${pd.subject_id}`] = pd.grouping;
    }

    const vars = [];
    for (const dem of demands) {
        if (!dem.weekly_hours || dem.weekly_hours <= 0) continue;
        const cands = getCandidates(dem.grade_id, dem.subject_id);
        if (cands.length === 0) return { ok: false, reason: `No hay profesor para la materia ${dem.subject_id} en el grado ${dem.grade_id}.`, impossible: true };
        const grouping = prefMap[`${dem.grade_id}-${dem.subject_id}`] || 'NONE';
        vars.push({ grade_id: dem.grade_id, subject_id: dem.subject_id, hours: dem.weekly_hours, cands, grouping });
    }
    if (vars.length === 0) return { ok: false, reason: 'No hay materias con horas para generar.' };

    // --- PRECHEQUEO de imposibilidad por capacidad del profesor ---
    // Capacidad semanal de un profesor = suma de sus cupos por día.
    const teacherWeekCap = {};
    for (const t of teachers) { let c = 0; for (let d = 0; d < numDays; d++) c += teacherCap(t.teacher_id, d); teacherWeekCap[t.teacher_id] = c; }
    const forcedLoad = {};
    for (const v of vars) if (v.cands.length === 1) forcedLoad[v.cands[0]] = (forcedLoad[v.cands[0]] || 0) + v.hours;
    const overloaded = Object.entries(forcedLoad)
        .filter(([t, h]) => h > (teacherWeekCap[t] !== undefined ? teacherWeekCap[t] : S))
        .map(([t, h]) => ({ teacher_id: Number(t), hours: h, cap: teacherWeekCap[t] !== undefined ? teacherWeekCap[t] : S }));

    const t0 = Date.now();

    if (overloaded.length > 0) {
        const be = bestEffort(vars, { numDays, hoursOfDay, gradeIds, teachers, days, ndHours });
        const quien = overloaded.map(o => `profesor ${o.teacher_id} (${o.hours}h obligatorias, cupo ${o.cap}h)`).join(', ');
        return { ok: true, placements: be.placements, relaxed: true, unplaced: be.unplaced,
            warning: `El horario es imposible de cuadrar tal cual: ${quien} supera su cupo semanal (por horas, límites o disponibilidad). Se generó un horario parcial dejando huecos; revisa esos profesores.`,
            stats: { units: be.placements.length, unplaced: be.unplaced.length, ms: Date.now() - t0 } };
    }

    // NIVEL 1
    let r = twoPhase(vars, { numDays, hoursOfDay, gradeIds, teachers, days, teacherCap, ndHours, relaxDetailed: false, budget: BUDGET_TIER1 });
    if (r.ok) return { ok: true, placements: r.placements, relaxed: false, stats: { ...r.stats, ms: Date.now() - t0 } };

    // NIVEL 2 (ignora preferencias detalladas)
    const hadDetailed = vars.some(v => v.grouping === 'GROUP2' || v.grouping === 'NO_CONSEC');
    r = twoPhase(vars, { numDays, hoursOfDay, gradeIds, teachers, days, teacherCap, ndHours, relaxDetailed: true, budget: BUDGET_TIER2 });
    if (r.ok) return { ok: true, placements: r.placements, relaxed: true,
        warning: hadDetailed ? 'No se pudieron respetar algunas preferencias detalladas (unir materias o separarlas en días no consecutivos); se generó un horario válido sin esas preferencias.' : 'Se generó un horario relajando algunas preferencias.',
        stats: { ...r.stats, ms: Date.now() - t0 } };

    // NIVEL 3 (mejor esfuerzo)
    const be = bestEffort(vars, { numDays, hoursOfDay, gradeIds, teachers, days, ndHours });
    if (be.placements.length > 0) return { ok: true, placements: be.placements, relaxed: true, unplaced: be.unplaced,
        warning: be.unplaced.length > 0 ? `No fue posible cuadrar todo el horario; se ubicaron ${be.placements.length} clases y quedaron ${be.unplaced.length} sin ubicar (huecos). Revisa la carga horaria, los límites y la disponibilidad de los profesores.` : 'Se generó el horario relajando restricciones.',
        stats: { units: be.placements.length, unplaced: be.unplaced.length, ms: Date.now() - t0 } };

    return { ok: false, reason: 'No se pudo generar ningún horario. Revisa la configuración de grados, materias y profesores.' };
}

// ============================================================================
// Dos fases (días + horas). relaxDetailed=true ignora GROUP2 y NO_CONSEC.
// ============================================================================
function twoPhase(vars, ctx) {
    const { numDays, hoursOfDay, gradeIds, teachers, days, teacherCap, ndHours, relaxDetailed, budget } = ctx;
    const start = Date.now();
    const deadline = start + budget; // tope de tiempo total de este nivel

    // Capacidad por materia según reglas de días
    const maxNonConsec = Math.ceil(numDays / 2);
    for (const v of vars) {
        const g2 = !relaxDetailed && v.grouping === 'GROUP2';
        const nc = !relaxDetailed && v.grouping === 'NO_CONSEC';
        const maxPerDay = g2 ? 2 : 1;
        if (v.hours > numDays * maxPerDay) return { ok: false };
        if (nc && v.hours > maxNonConsec) return { ok: false }; // no caben en días no consecutivos
    }

    const V = vars.length;
    const isG2 = vars.map(v => (!relaxDetailed && v.grouping === 'GROUP2' && v.hours >= 2));
    const isNC = vars.map(v => (!relaxDetailed && v.grouping === 'NO_CONSEC'));
    const anyBlock = isG2.some(x => x);

    function phaseA(rnd, nodeBudget) {
        const singlesRem = new Int16Array(V);
        const blockRem = new Int8Array(V);
        const lastSingleDay = new Int16Array(V);
        const usedDay = [];
        for (let vi = 0; vi < V; vi++) {
            if (isG2[vi]) { blockRem[vi] = 1; singlesRem[vi] = vars[vi].hours - 2; }
            else { blockRem[vi] = 0; singlesRem[vi] = vars[vi].hours; }
            lastSingleDay[vi] = -1; usedDay.push(new Uint8Array(numDays));
        }
        const gradeDay = {}; for (const g of gradeIds) gradeDay[g] = new Int16Array(numDays);
        const teacherDay = {}; for (const t of teachers) teacherDay[t.teacher_id] = new Int16Array(numDays);
        const assigned = []; let nodes = 0; let stop = false;

        // Propagación global de capacidad del profesor (forward checking):
        //  teacherReq[t]  = horas pendientes que OBLIGATORIAMENTE debe dar t (materias de un solo profe)
        //  teacherRemCap[t] = cupo semanal restante de t (suma de cupos por día menos lo ya usado)
        const teacherReq = {}; const teacherRemCap = {};
        for (const t of teachers) { teacherReq[t.teacher_id] = 0; let c = 0; for (let d = 0; d < numDays; d++) c += teacherCap(t.teacher_id, d); teacherRemCap[t.teacher_id] = c; }
        for (let vi = 0; vi < V; vi++) if (vars[vi].cands.length === 1) teacherReq[vars[vi].cands[0]] += vars[vi].hours;
        const forcedTeacher = vars.map(v => v.cands.length === 1 ? v.cands[0] : -1);

        function freeTeachers(vi, day, weight) {
            const out = []; const cands = vars[vi].cands;
            for (let k = 0; k < cands.length; k++) if (teacherDay[cands[k]][day] + weight <= teacherCap(cands[k], day)) out.push(cands[k]);
            return out;
        }
        function nextKind(vi) { if (blockRem[vi] > 0) return 'block'; if (singlesRem[vi] > 0) return 'single'; return null; }
        // Primer día permitido para el próximo "single" (respeta no-consecutivos)
        function singleFromDay(vi) {
            if (lastSingleDay[vi] < 0) return 0;
            return lastSingleDay[vi] + (isNC[vi] ? 2 : 1);
        }
        function feasibleDaysCount(vi) {
            const v = vars[vi]; const kind = nextKind(vi); if (!kind) return 0;
            const weight = kind === 'block' ? 2 : 1;
            const from = kind === 'single' ? singleFromDay(vi) : 0;
            let c = 0;
            for (let d = from; d < numDays; d++) {
                if (usedDay[vi][d]) continue;
                if (gradeDay[v.grade_id][d] + weight > hoursOfDay[d]) continue;
                if (freeTeachers(vi, d, weight).length > 0) c++;
            }
            return c;
        }
        // Carga aproximada de un día (para repartir parejo): grado + mínimo de profes
        function dayLoad(vi, d) {
            const v = vars[vi]; let tmin = 1e9; const cands = v.cands;
            for (let k = 0; k < cands.length; k++) { const l = teacherDay[cands[k]][d]; if (l < tmin) tmin = l; }
            return gradeDay[v.grade_id][d] + (tmin === 1e9 ? 0 : tmin);
        }

        function solve() {
            if (++nodes > nodeBudget) return false;
            if ((nodes & 1023) === 0 && Date.now() > deadline) stop = true;
            if (stop) return false;
            // Poda global: ningún profesor puede tener más horas obligatorias
            // pendientes que su cupo restante.
            for (const t of teachers) if (teacherReq[t.teacher_id] > teacherRemCap[t.teacher_id]) return false;
            let best = -1, bestSlack = Infinity, bestRemTot = -1;
            for (let vi = 0; vi < V; vi++) {
                const kind = nextKind(vi); if (!kind) continue;
                const v = vars[vi];
                const remItems = (blockRem[vi] > 0 ? 1 : 0) + singlesRem[vi];
                let slack;
                if (!anyBlock && !isNC[vi]) {
                    let availDays = 0;
                    for (let d = 0; d < numDays; d++) { if (usedDay[vi][d]) continue; if (gradeDay[v.grade_id][d] + 1 <= hoursOfDay[d] && freeTeachers(vi, d, 1).length > 0) availDays++; }
                    if (availDays < remItems) return false;
                    slack = availDays - remItems;
                } else {
                    const fd = feasibleDaysCount(vi);
                    if (fd < 1) return false;
                    // cota de días disponibles para los items restantes
                    let avail = 0; for (let d = 0; d < numDays; d++) if (!usedDay[vi][d]) avail++;
                    if (avail < remItems) return false;
                    slack = fd - 1;
                }
                if (slack < bestSlack || (slack === bestSlack && remItems > bestRemTot)) { bestSlack = slack; best = vi; bestRemTot = remItems; }
            }
            if (best === -1) return true;

            const vi = best, v = vars[vi];
            const kind = nextKind(vi);
            const weight = kind === 'block' ? 2 : 1;
            const from = kind === 'single' ? singleFromDay(vi) : 0;
            const dayList = [];
            for (let d = from; d < numDays; d++) {
                if (usedDay[vi][d]) continue;
                if (gradeDay[v.grade_id][d] + weight > hoursOfDay[d]) continue;
                if (freeTeachers(vi, d, weight).length > 0) dayList.push(d);
            }
            if (rnd) shuffle(dayList, rnd);
            // Orden natural (días crecientes): rápido. El cupo por profesor/día ya
            // reparte los grados entre días sin necesidad de reordenar.

            for (const d of dayList) {
                const ft = freeTeachers(vi, d, weight); if (rnd) shuffle(ft, rnd);
                for (const tid of ft) {
                    gradeDay[v.grade_id][d] += weight; teacherDay[tid][d] += weight; usedDay[vi][d] = 1;
                    teacherRemCap[tid] -= weight;
                    const isForced = forcedTeacher[vi] === tid;
                    if (isForced) teacherReq[tid] -= weight;
                    const prevLastSingle = lastSingleDay[vi];
                    if (kind === 'block') blockRem[vi] = 0; else { singlesRem[vi]--; lastSingleDay[vi] = d; }
                    assigned.push({ vi, day: d, teacher: tid, weight });
                    if (solve()) return true;
                    assigned.pop();
                    if (kind === 'block') blockRem[vi] = 1; else { singlesRem[vi]++; lastSingleDay[vi] = prevLastSingle; }
                    if (isForced) teacherReq[tid] += weight;
                    teacherRemCap[tid] += weight;
                    usedDay[vi][d] = 0; gradeDay[v.grade_id][d] -= weight; teacherDay[tid][d] -= weight;
                    if (stop) return false;
                }
            }
            return false;
        }
        const ok = solve();
        return ok ? { ok: true, assigned, nodes } : { ok: false, nodes };
    }

    // Fase B: asignar horas dentro de un día (di). Respeta ND del profesor.
    function phaseB(lessons, H, di, rnd) {
        const blocks = []; const singles = [];
        lessons.forEach((l, i) => (l.block ? blocks : singles).push(i));
        const hourA = new Int16Array(lessons.length).fill(-1);
        const gradeBusy = {}; const teacherBusy = {};
        for (const l of lessons) {
            if (!gradeBusy[l.grade_id]) gradeBusy[l.grade_id] = new Uint8Array(H);
            if (!teacherBusy[l.teacher]) {
                const arr = new Uint8Array(H);
                const nd = ndHours[l.teacher] ? ndHours[l.teacher][di] : null; // horas ND de ese profe ese día
                if (nd) for (const h of nd) if (h < H) arr[h] = 1; // prohibidas
                teacherBusy[l.teacher] = arr;
            }
        }
        function placeBlocks(bi) {
            if (bi >= blocks.length) return placeSingles(0);
            const i = blocks[bi]; const l = lessons[i]; const starts = [];
            for (let h = 0; h + 1 < H; h++) if (!gradeBusy[l.grade_id][h] && !gradeBusy[l.grade_id][h + 1] && !teacherBusy[l.teacher][h] && !teacherBusy[l.teacher][h + 1]) starts.push(h);
            if (rnd) shuffle(starts, rnd);
            for (const h of starts) {
                gradeBusy[l.grade_id][h] = 1; gradeBusy[l.grade_id][h + 1] = 1; teacherBusy[l.teacher][h] = 1; teacherBusy[l.teacher][h + 1] = 1; hourA[i] = h;
                if (placeBlocks(bi + 1)) return true;
                gradeBusy[l.grade_id][h] = 0; gradeBusy[l.grade_id][h + 1] = 0; teacherBusy[l.teacher][h] = 0; teacherBusy[l.teacher][h + 1] = 0; hourA[i] = -1;
            }
            return false;
        }
        function availS(i) { const l = lessons[i]; let c = 0; for (let h = 0; h < H; h++) if (!gradeBusy[l.grade_id][h] && !teacherBusy[l.teacher][h]) c++; return c; }
        function placeSingles(done) {
            if (done === singles.length) return true;
            let best = -1, bestC = Infinity;
            for (const i of singles) { if (hourA[i] !== -1) continue; const c = availS(i); if (c === 0) return false; if (c < bestC) { bestC = c; best = i; } }
            const l = lessons[best]; const hs = [];
            for (let h = 0; h < H; h++) if (!gradeBusy[l.grade_id][h] && !teacherBusy[l.teacher][h]) hs.push(h);
            if (rnd) shuffle(hs, rnd);
            for (const h of hs) { hourA[best] = h; gradeBusy[l.grade_id][h] = 1; teacherBusy[l.teacher][h] = 1; if (placeSingles(done + 1)) return true; hourA[best] = -1; gradeBusy[l.grade_id][h] = 0; teacherBusy[l.teacher][h] = 0; }
            return false;
        }
        if (!placeBlocks(0)) return null;
        const res = [];
        lessons.forEach((l, i) => { res.push(l.block ? { i, hours: [hourA[i], hourA[i] + 1] } : { i, hours: [hourA[i]] }); });
        return res;
    }

    function attempt(rnd) {
        const rA = phaseA(rnd, rnd ? 300000 : 600000);
        if (!rA.ok) return null;
        const byDay = Array.from({ length: numDays }, () => []);
        for (const a of rA.assigned) { const v = vars[a.vi]; byDay[a.day].push({ grade_id: v.grade_id, subject_id: v.subject_id, teacher: a.teacher, block: a.weight === 2 }); }
        const placements = [];
        for (let d = 0; d < numDays; d++) {
            const lessons = byDay[d]; if (lessons.length === 0) continue;
            const res = phaseB(lessons, hoursOfDay[d], d, rnd || makeRng(0x1234567 + d));
            if (!res) return null;
            for (const { i, hours } of res) for (const h of hours) placements.push({ grade_id: lessons[i].grade_id, subject_id: lessons[i].subject_id, teacher_id: lessons[i].teacher, day_key: days[d].day_key, hour_index: h });
        }
        return { placements, nodes: rA.nodes };
    }

    let res = attempt(null); let totalNodes = res ? res.nodes : 0; let attempts = 1;
    while (!res && Date.now() - start < budget) { attempts++; res = attempt(makeRng(0x9E3779B1 ^ (attempts * 2654435761))); if (res) totalNodes += res.nodes; }
    if (!res) return { ok: false };
    return { ok: true, placements: res.placements, stats: { units: res.placements.length, nodes: totalNodes, attempts } };
}

// ============================================================================
// Mejor esfuerzo: solo físicas + ND. Permite repetir materia en el día. Deja huecos.
// ============================================================================
function bestEffort(vars, ctx) {
    const { numDays, hoursOfDay, gradeIds, teachers, days, ndHours } = ctx;
    const slots = [];
    days.forEach((d, di) => { for (let h = 0; h < d.hours; h++) slots.push({ day_idx: di, hour_index: h, day_key: d.day_key }); });
    const S = slots.length;
    const gradeBusy = {}; for (const g of gradeIds) gradeBusy[g] = new Uint8Array(S);
    const teacherBusy = {}; for (const t of teachers) teacherBusy[t.teacher_id] = new Uint8Array(S);
    // Pre-marcar ND como ocupado para cada profesor
    slots.forEach((sl, s) => { for (const t of teachers) { const nd = ndHours && ndHours[t.teacher_id] ? ndHours[t.teacher_id][sl.day_idx] : null; if (nd && nd.has(sl.hour_index)) teacherBusy[t.teacher_id][s] = 1; } });

    const lessons = [];
    for (const v of vars) for (let k = 0; k < v.hours; k++) lessons.push({ grade_id: v.grade_id, subject_id: v.subject_id, cands: v.cands });
    lessons.sort((a, b) => a.cands.length - b.cands.length);

    const placements = []; const unplaced = [];
    for (const l of lessons) {
        let placed = false;
        for (let s = 0; s < S && !placed; s++) {
            if (gradeBusy[l.grade_id][s]) continue;
            for (const tid of l.cands) {
                if (!teacherBusy[tid][s]) { gradeBusy[l.grade_id][s] = 1; teacherBusy[tid][s] = 1; placements.push({ grade_id: l.grade_id, subject_id: l.subject_id, teacher_id: tid, day_key: slots[s].day_key, hour_index: slots[s].hour_index }); placed = true; break; }
            }
        }
        if (!placed) unplaced.push({ grade_id: l.grade_id, subject_id: l.subject_id });
    }
    return { placements, unplaced };
}

module.exports = { generateSchedule };