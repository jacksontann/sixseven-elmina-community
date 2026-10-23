import { Recycle, Trash2 } from 'lucide-react';
import type { RecyclingSummary } from '@/lib/domain/recycling';
import { MATERIALS, MATERIAL_LABELS } from '@/lib/domain/types';
import type { Formatter } from '@/lib/format';
import { MutationForm, SubmitButton } from '@/components/forms/mutation-form';
import { deleteRecyclingAction, logRecyclingAction } from '@/app/actions/social';

/** The small recycling tracker on your own profile (private, self-reported). */
export function RecyclingTracker({ summary: s, now, fmt }: { summary: RecyclingSummary; now: Date; fmt: Formatter }) {
  const max = Math.max(1, ...s.byMaterial.map((m) => m.kg));
  return (
    <section className="card card-pad grid gap-4" aria-labelledby="recycle-title">
      <div className="between"><h2 id="recycle-title" className="row text-lg"><Recycle size={20} className="text-climate" aria-hidden />My recycling</h2><span className="badge">Private · self-reported</span></div>
      <div>
        <p className="recycle-total">{fmt.kg(s.monthKg)}</p>
        <p className="small muted">recycled in {fmt.month(now)}{s.lastMonthKg > 0 ? ` · ${fmt.kg(s.lastMonthKg)} last month` : ''} · {fmt.kg(s.totalKg)} in total</p>
      </div>
      {s.byMaterial.length > 0 && (
        <ul className="grid gap-2" aria-label="This month by material">
          {s.byMaterial.map((m) => <li key={m.material} className="grid gap-1"><span className="between small"><span>{MATERIAL_LABELS[m.material]}</span><strong>{fmt.kg(m.kg)}</strong></span><span className="bar" aria-hidden><span style={{ width: `${Math.round((m.kg / max) * 100)}%` }} /></span></li>)}
        </ul>
      )}
      <MutationForm action={logRecyclingAction} success="Logged. Nice work! 🌱" resetOnSuccess className="grid gap-3 rounded-xl bg-surface-2 p-3">
        <p className="font-semibold">Log what you recycled</p>
        <div className="grid grid-cols-[1fr_110px] gap-2">
          <label className="field"><span className="sr-only">Material</span><select className="input" name="material" aria-label="Material">{MATERIALS.map((m) => <option key={m} value={m}>{MATERIAL_LABELS[m]}</option>)}</select></label>
          <label className="field"><span className="sr-only">Kilograms</span><input className="input" type="number" name="kg" min={0.1} max={100} step={0.1} placeholder="kg" aria-label="Kilograms" required /></label>
        </div>
        <SubmitButton variant="climate">Add to my tracker</SubmitButton>
      </MutationForm>
      {s.recent.length > 0 && (
        <details>
          <summary className="small font-semibold">Recent entries</summary>
          <ul className="mt-2 grid gap-1">
            {s.recent.map((r) => <li key={r.id} className="between small"><span>{MATERIAL_LABELS[r.material]} · {fmt.kg(r.kg)} · <span className="muted">{fmt.shortDate(r.loggedAt)}</span></span>
              <MutationForm action={deleteRecyclingAction} className=""><input type="hidden" name="id" value={r.id} /><button type="submit" className="icon-btn" aria-label={`Delete ${MATERIAL_LABELS[r.material]} ${r.kg} kg entry`}><Trash2 size={16} aria-hidden /></button></MutationForm></li>)}
          </ul>
        </details>
      )}
    </section>
  );
}
