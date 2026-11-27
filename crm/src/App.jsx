import { useState } from 'react';
import { PERIODS, computeEndDate, computeNextPayment, fmtDate, fmtMoney, daysUntil } from './utils.js';
import { useItems } from './useItems.js';

const PAYMENT_STATUSES = [
  { value: 'paid', label: 'Оплачено' },
  { value: 'pending', label: 'Ожидает оплаты' },
  { value: 'overdue', label: 'Просрочено' },
];

const emptyForm = () => ({
  contractor: '',
  description: '',
  startDate: '',
  endDate: '',
  period: 'month',
  paymentStatus: 'pending',
  amount: '',
  inBudget: 'yes',
});

export default function App() {
  const { items, addItem, updateItem, removeItem } = useItems();
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState('nextPayment');

  const setField = (name, value) => {
    setForm((f) => {
      const next = { ...f, [name]: value };
      // автопересчёт даты окончания при изменении даты начала / периодичности
      if (name === 'startDate' || name === 'period') {
        next.endDate = computeEndDate(next.startDate, next.period);
      }
      return next;
    });
  };

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.contractor.trim()) return;
    if (editingId) {
      updateItem(editingId, form);
    } else {
      addItem(form);
    }
    resetForm();
  };

  const startEdit = (item) => {
    setForm({ ...emptyForm(), ...item });
    setEditingId(item.id);
    setShowForm(true);
  };

  const filtered = items
    .filter((it) => {
      const q = filter.trim().toLowerCase();
      if (!q) return true;
      return (
        it.contractor?.toLowerCase().includes(q) ||
        it.description?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortKey === 'contractor') return (a.contractor || '').localeCompare(b.contractor || '', 'ru');
      if (sortKey === 'endDate') return (a.endDate || '9999').localeCompare(b.endDate || '9999');
      return (computeNextPayment(a) || '9999').localeCompare(computeNextPayment(b) || '9999');
    });

  const totalAmount = items
    .filter((i) => i.inBudget === 'yes')
    .reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const soonCount = items.filter((i) => {
    const d = daysUntil(computeNextPayment(i));
    return d !== null && d >= 0 && d <= 7;
  }).length;

  const overdueCount = items.filter((i) => {
    const d = daysUntil(computeNextPayment(i));
    return d !== null && d < 0;
  }).length;

  return (
    <div className="app">
      <header className="header">
        <h1>💼 Моя CRM — платежи и лицензии</h1>
        <div className="stats">
          <span className="stat">Записей: <b>{items.length}</b></span>
          <span className="stat warn">Скоро (7 дней): <b>{soonCount}</b></span>
          <span className="stat bad">Просрочено: <b>{overdueCount}</b></span>
          <span className="stat">В бюджете на период: <b>{fmtMoney(totalAmount)}</b></span>
        </div>
        <div className="toolbar">
          <button className="btn primary" onClick={() => { resetForm(); setShowForm(true); }}>
            + Добавить запись
          </button>
          <input
            className="search"
            placeholder="Поиск по контрагенту / описанию…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
            <option value="nextPayment">Сортировка: по дате платежа</option>
            <option value="contractor">Сортировка: по контрагенту</option>
            <option value="endDate">Сортировка: по дате окончания</option>
          </select>
        </div>
      </header>

      {showForm && (
        <form className="form" onSubmit={submit}>
          <h2>{editingId ? 'Редактировать запись' : 'Новая запись'}</h2>
          <div className="grid">
            <label>
              Контрагент *
              <input
                value={form.contractor}
                onChange={(e) => setField('contractor', e.target.value)}
                placeholder="ООО «Ромашка», сервис и т.п."
                required
              />
            </label>
            <label className="wide">
              Описание
              <input
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Лицензия ПО, хостинг, подписка…"
              />
            </label>
            <label>
              Периодичность
              <select value={form.period} onChange={(e) => setField('period', e.target.value)}>
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </label>
            <label>
              Дата начала
              <input type="date" value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} />
            </label>
            <label>
              Дата окончания <small>(автоматически)</small>
              <input type="date" value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} />
            </label>
            <label>
              Сумма платежа
              <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setField('amount', e.target.value)} placeholder="0" />
            </label>
            <label>
              Статус оплаты
              <select value={form.paymentStatus} onChange={(e) => setField('paymentStatus', e.target.value)}>
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
            <label>
              Есть ли в бюджете?
              <select value={form.inBudget} onChange={(e) => setField('inBudget', e.target.value)}>
                <option value="yes">Да</option>
                <option value="no">Нет</option>
              </select>
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn primary">{editingId ? 'Сохранить' : 'Добавить'}</button>
            <button type="button" className="btn" onClick={resetForm}>Отмена</button>
          </div>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Контрагент</th>
              <th>Описание</th>
              <th>Дата начала</th>
              <th>Дата окончания</th>
              <th>Предстоящий платёж</th>
              <th>Статус оплаты</th>
              <th>Периодичность</th>
              <th className="num">Сумма</th>
              <th>В бюджете</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="empty">
                  {items.length === 0
                    ? 'Записей пока нет — нажмите «Добавить запись».'
                    : 'Ничего не найдено.'}
                </td>
              </tr>
            )}
            {filtered.map((it) => {
              const next = computeNextPayment(it);
              const d = daysUntil(next);
              const nextCls = d === null ? '' : d < 0 ? 'bad' : d <= 7 ? 'warn' : '';
              const periodLabel = PERIODS.find((p) => p.value === it.period)?.label || it.period;
              return (
                <tr key={it.id}>
                  <td className="strong">{it.contractor}</td>
                  <td>{it.description || '—'}</td>
                  <td>{fmtDate(it.startDate)}</td>
                  <td>{fmtDate(it.endDate)}</td>
                  <td className={nextCls}>
                    {fmtDate(next)}
                    {d !== null && (
                      <small className="hint">
                        {d < 0 ? `просрочено ${-d} дн.` : d === 0 ? 'сегодня' : `через ${d} дн.`}
                      </small>
                    )}
                  </td>
                  <td>
                    <select
                      className={`status status-${it.paymentStatus}`}
                      value={it.paymentStatus}
                      onChange={(e) => updateItem(it.id, { paymentStatus: e.target.value })}
                    >
                      {PAYMENT_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>{periodLabel}</td>
                  <td className="num">{fmtMoney(it.amount)}</td>
                  <td>{it.inBudget === 'yes' ? '✅ Да' : '⛔ Нет'}</td>
                  <td className="actions">
                    <button className="btn small" onClick={() => startEdit(it)}>✏️</button>
                    <button
                      className="btn small danger"
                      onClick={() => { if (confirm('Удалить запись?')) removeItem(it.id); }}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className="footer">
        Данные хранятся локально в вашем браузере (localStorage). Экспорт/импорт CSV доступен ниже.
        <div className="io">
          <button className="btn" onClick={() => exportCsv(items)}>⬇ Экспорт CSV</button>
          <label className="btn filebtn">
            ⬆ Импорт CSV
            <input type="file" accept=".csv,text/csv" onChange={(e) => importCsv(e.target.files?.[0], addItem)} />
          </label>
        </div>
      </footer>
    </div>
  );
}

// ---- CSV ----
const CSV_HEADERS = ['contractor', 'description', 'startDate', 'endDate', 'period', 'paymentStatus', 'amount', 'inBudget'];

function exportCsv(items) {
  const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
  const rows = [CSV_HEADERS.join(','), ...items.map((i) => CSV_HEADERS.map((h) => esc(i[h])).join(','))];
  const blob = new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'crm-export.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importCsv(file, addItem) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const text = String(reader.result).replace(/^\uFEFF/, '');
    const lines = parseCsv(text);
    if (lines.length < 2) return;
    const header = lines[0].map((h) => h.trim());
    for (let r = 1; r < lines.length; r++) {
      const obj = {};
      header.forEach((h, idx) => (obj[h] = lines[r][idx] ?? ''));
      if (obj.contractor) addItem(obj);
    }
  };
  reader.readAsText(file, 'utf-8');
}

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}
