// Dial.jsx - Selector tipo rueda: valor central nítido, vecinos opacos.
// Controlable con botones ▲▼, scroll del mouse y escritura manual.
// Muestra siempre 2 dígitos. Reutilizable para horas, minutos, etc.
function pad2(n) {
    return String(n).padStart(2, '0');
}

function Dial({ value, min, max, onChange, label, wrap = false, width }) {
    const clamp = (v) => {
        if (wrap) {
            const range = max - min + 1;
            return ((v - min) % range + range) % range + min;
        }
        return Math.max(min, Math.min(max, v));
    };

    const step = (delta) => onChange(clamp(value + delta));

    const onInput = (e) => {
        const digits = e.target.value.replace(/\D/g, '').slice(-2);
        if (digits === '') { onChange(min); return; }
        onChange(clamp(parseInt(digits, 10)));
    };

    const prevVal = (wrap || value > min) ? clamp(value - 1) : null;
    const nextVal = (wrap || value < max) ? clamp(value + 1) : null;

    return (
        <div className="dial" style={width ? { width } : undefined}>
            <div className="dial-ghost">{prevVal !== null ? pad2(prevVal) : '\u00A0'}</div>
            <div className="dial-center">
                <input
                    value={pad2(value)}
                    onChange={onInput}
                    onFocus={(e) => e.target.select()}
                    inputMode="numeric"
                />
            </div>
            <div className="dial-ghost">{nextVal !== null ? pad2(nextVal) : '\u00A0'}</div>
            <div className="dial-arrows">
                <button type="button" onClick={() => step(1)} aria-label="subir">▲</button>
                <button type="button" onClick={() => step(-1)} aria-label="bajar">▼</button>
            </div>
            {label && <div className="dial-label">{label}</div>}
        </div>
    );
}

export { pad2 };
export default Dial;
