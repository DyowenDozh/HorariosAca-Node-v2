// ============================================================================
// Motor de generación — v4
// - DURA: no repetir materia el mismo día
// - GROUP2: exactamente 1 día con 2 horas CONSECUTIVAS, resto máx 1/día
// - Aleatorio con reintentos
// ============================================================================

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function tryOnce(input, maxSteps) {
    const { days, demands, teachers, canTeach, rules, prefMap, candidateCache } = input;
    const cells = [];
    for (const d of days) {
        for (let h = 0; h < d.hours; h++) cells.push({ day_key: d.day_key, hour_index: h });
    }
    const gradeIds = [...new Set(demands.map(d => d.grade_id))];
    shuffle(gradeIds);

    const remaining = {};
    for (const dem of demands) {
        if (!remaining[dem.grade_id]) remaining[dem.grade_id] = {};
        remaining[dem.grade_id][dem.subject_id] = dem.weekly_hours;
    }

    // Contadores por día
    const dayCount = {};
    const dc = (g,s,d) => dayCount[`${g}-${s}-${d}`]||0;
    const incDc = (g,s,d) => { const k=`${g}-${s}-${d}`; dayCount[k]=(dayCount[k]||0)+1; };
    const decDc = (g,s,d) => { dayCount[`${g}-${s}-${d}`]--; };

    // GROUP2: rastrear primera hora colocada en cada día y si ya se usó el día-par
    // g2first["gid-sid-day"] = hour_index de la primera colocación, o undefined
    // g2paired["gid-sid"] = day_key del día que tiene el par, o undefined
    const g2first = {};
    const g2paired = {};

    const placements = [];
    let steps = 0;

    function isGroup2(gid, sid) {
        return prefMap[`${gid}-${sid}`] === 'GROUP2';
    }

    function gradeOpts(gid, dayKey, hourIndex, usedTeachers) {
        const opts = [];
        for (const [sid, count] of Object.entries(remaining[gid])) {
            if (count <= 0) continue;
            const subjectId = Number(sid);
            const cands = candidateCache[`${gid}-${subjectId}`];
            if (!cands || cands.length === 0) continue;

            const currentOnDay = dc(gid, subjectId, dayKey);
            const g2 = isGroup2(gid, subjectId);

            if (g2) {
                // GROUP2: lógica especial
                if (currentOnDay === 0) {
                    // Primera hora de esta materia en este día → OK
                    opts.push({ subject_id: subjectId, candidates: cands.filter(t => !usedTeachers.has(t)), remaining: count });
                } else if (currentOnDay === 1) {
                    // Segunda hora → solo si: es consecutiva Y no se usó par en otro día
                    const firstH = g2first[`${gid}-${subjectId}-${dayKey}`];
                    const pairedDay = g2paired[`${gid}-${subjectId}`];
                    if (firstH === hourIndex - 1 && (!pairedDay || pairedDay === dayKey)) {
                        opts.push({ subject_id: subjectId, candidates: cands.filter(t => !usedTeachers.has(t)), remaining: count });
                    }
                    // Si no es consecutiva o ya hay par en otro día → no permitir
                }
                // currentOnDay >= 2 → nunca (máximo 2 por día con GROUP2)
            } else {
                // Normal: máximo 1 por día
                if (currentOnDay >= 1) continue;
                opts.push({ subject_id: subjectId, candidates: cands.filter(t => !usedTeachers.has(t)), remaining: count });
            }
        }

        // Filtrar opciones sin candidatos libres
        const valid = opts.filter(o => o.candidates.length > 0);
        shuffle(valid);
        valid.sort((a, b) => {
            if (a.candidates.length !== b.candidates.length) return a.candidates.length - b.candidates.length;
            return b.remaining - a.remaining;
        });
        return valid;
    }

    function solve(ci) {
        if (ci >= cells.length) {
            // Verificar toda la demanda satisfecha
            for (const gid of gradeIds)
                for (const c of Object.values(remaining[gid]))
                    if (c > 0) return false;
            // Verificar GROUP2: cada materia GROUP2 DEBE tener su par colocado
            for (const dem of demands) {
                if (isGroup2(dem.grade_id, dem.subject_id) && dem.weekly_hours >= 2) {
                    if (!g2paired[`${dem.grade_id}-${dem.subject_id}`]) return false;
                }
            }
            return true;
        }
        if (++steps > maxSteps) return false;
        return assignGrades(ci, cells[ci], 0, new Set());
    }

    function assignGrades(ci, cell, gi, used) {
        if (gi >= gradeIds.length) return solve(ci + 1);
        const gid = gradeIds[gi];
        const rem = Object.values(remaining[gid]).reduce((a,b)=>a+b,0);
        if (rem === 0) return assignGrades(ci, cell, gi+1, used);
        const slotsLeft = cells.length - ci;
        const mustFill = rem >= slotsLeft;
        const opts = gradeOpts(gid, cell.day_key, cell.hour_index, used);

        for (const opt of opts) {
            const cands = [...opt.candidates]; shuffle(cands);
            for (const tid of cands) {
                if (used.has(tid)) continue;

                // Colocar
                used.add(tid);
                remaining[gid][opt.subject_id]--;
                const prevOnDay = dc(gid, opt.subject_id, cell.day_key);
                incDc(gid, opt.subject_id, cell.day_key);

                // GROUP2: rastrear
                const g2 = isGroup2(gid, opt.subject_id);
                const g2fk = `${gid}-${opt.subject_id}-${cell.day_key}`;
                const g2pk = `${gid}-${opt.subject_id}`;
                let wasFirst = false, wasPaired = false;
                if (g2) {
                    if (prevOnDay === 0) {
                        g2first[g2fk] = cell.hour_index;
                        wasFirst = true;
                    } else if (prevOnDay === 1) {
                        g2paired[g2pk] = cell.day_key;
                        wasPaired = true;
                    }
                }

                placements.push({ grade_id:gid, subject_id:opt.subject_id, teacher_id:tid, day_key:cell.day_key, hour_index:cell.hour_index });

                if (assignGrades(ci, cell, gi+1, used)) return true;

                // Deshacer
                placements.pop();
                if (g2) {
                    if (wasPaired) delete g2paired[g2pk];
                    if (wasFirst) delete g2first[g2fk];
                }
                decDc(gid, opt.subject_id, cell.day_key);
                remaining[gid][opt.subject_id]++;
                used.delete(tid);
            }
        }
        if (!mustFill) return assignGrades(ci, cell, gi+1, used);
        return false;
    }

    const ok = solve(0);
    return ok ? { ok:true, placements:[...placements], steps } : { ok:false, steps };
}

function generateSchedule(input) {
    const { days, demands, teachers, canTeach, rules, prefDetails } = input;
    const numDays = days.length;
    const totalSlots = days.reduce((s,d)=>s+d.hours, 0);
    const gradeIds = [...new Set(demands.map(d => d.grade_id))];

    for (const gid of gradeIds) {
        const total = demands.filter(d=>d.grade_id===gid).reduce((s,d)=>s+d.weekly_hours,0);
        if (total > totalSlots)
            return { ok:false, reason:`El grado ${gid} requiere ${total} horas pero la semana solo tiene ${totalSlots} franjas.` };
    }

    function getCandidates(gid, sid) {
        const must=[], may=[];
        for (const t of teachers) {
            if (!canTeach[`${t.teacher_id}-${sid}`]) continue;
            const r = rules[`${t.teacher_id}-${sid}-${gid}`];
            if (r==='NO') continue;
            if (r==='DEBE') must.push(t.teacher_id); else may.push(t.teacher_id);
        }
        return must.length>0 ? must : may;
    }
    const candidateCache = {};
    for (const dem of demands) {
        const c = getCandidates(dem.grade_id, dem.subject_id);
        candidateCache[`${dem.grade_id}-${dem.subject_id}`] = c;
        if (c.length===0) return { ok:false, reason:`No hay profesor para la materia ${dem.subject_id} en el grado ${dem.grade_id}.` };
    }

    const prefMap = {};
    if (prefDetails) for (const pd of prefDetails) {
        if (pd.grouping && pd.grouping !== 'NONE') prefMap[`${pd.grade_id}-${pd.subject_id}`] = pd.grouping;
    }

    // Validar capacidad con no-repeat
    for (const dem of demands) {
        const det = prefMap[`${dem.grade_id}-${dem.subject_id}`];
        const maxPD = det === 'GROUP2' ? 2 : 1;
        if (dem.weekly_hours > numDays * maxPD)
            return { ok:false, reason:`La materia ${dem.subject_id} en grado ${dem.grade_id} tiene ${dem.weekly_hours}h pero solo caben ${numDays*maxPD} con máx ${maxPD}/día.`, impossible:true };
    }

    const inp = { days, demands, teachers, canTeach, rules, prefMap, candidateCache };
    const MAX_ATTEMPTS = 50;
    const STEPS_PER = 600000;
    let totalSteps = 0;
    for (let a = 0; a < MAX_ATTEMPTS; a++) {
        const r = tryOnce(inp, STEPS_PER);
        totalSteps += r.steps;
        if (r.ok) return { ok:true, placements:r.placements, stats:{ units:r.placements.length, steps:totalSteps, attempts:a+1 } };
    }
    return { ok:false, reason:'No se encontró un horario válido tras múltiples intentos. Revisa la carga horaria.' };
}

module.exports = { generateSchedule };