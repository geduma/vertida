import { readFileSync, readdirSync } from 'node:fs';

const req = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const es = req('src/i18n/es.json');
const en = req('src/i18n/en.json');

let fails = 0;
const need = (key: string, where: string) => {
  if (!es[key]) { console.error(`MISS es ${key} at ${where}`); fails++; }
  if (!en[key]) { console.error(`MISS en ${key} at ${where}`); fails++; }
};

const methods = req('src/data/methods.json');
for (const m of methods) { need(m.nombreKey, `method ${m.id}`); need(m.descripcionKey, `method ${m.id}`); }

const files = [
  ...readdirSync('src/data/recipes').map((f: string) => `src/data/recipes/${f}`),
  ...readdirSync('src/data/discovery').map((f: string) => `src/data/discovery/${f}`),
];
for (const f of files) {
  const r = req(f);
  need(r.nombreKey, f);
  if (r.historiaKey) need(r.historiaKey, f);
  let acc = -1;
  for (const ph of r.fases) {
    need(ph.instruccionKey, f);
    if (ph.aguaAcumuladaG < acc) { console.error(`non-monotonic water at ${f}`); fails++; }
    acc = ph.aguaAcumuladaG;
  }
  if (r.fases.at(-1).tipo !== 'fin' || r.fases.at(-1).duracionS !== 0) { console.error(`invalid fin at ${f}`); fails++; }
  if (r.categoria === 'atipica' && !r.historiaKey) { console.error(`atipica missing history ${f}`); fails++; }
}
if (fails) { console.error(`${fails} failures`); process.exit(1); }
console.log(`OK ${files.length} recipes validated`);
