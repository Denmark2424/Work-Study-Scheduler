/* src/pages/DeadlinesPage.jsx */
import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { Plus, Trash2, Pencil, AlertTriangle, CheckCircle } from 'lucide-react'
import styles from './DeadlinesPage.module.css'

export default function DeadlinesPage() {
  const { deadlines, addDeadline, updateDeadline, removeDeadline, conflicts, DAYS, TIME_SLOTS } = useApp()

  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    subject: '',
    day: 'MON',
    time: '8–9 AM',
    urgent: false,
  })

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleStartEdit(dl) {
    setEditingId(dl.id)
    setForm({
      title: dl.title,
      subject: dl.subject || '',
      day: dl.day,
      time: dl.time,
      urgent: !!dl.urgent,
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCancel() {
    setEditingId(null)
    setForm({ title: '', subject: '', day: 'MON', time: '8–9 AM', urgent: false })
    setShowForm(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return

    if (editingId) {
      updateDeadline(editingId, form)
      setEditingId(null)
    } else {
      addDeadline(form)
    }

    setForm({ title: '', subject: '', day: 'MON', time: '8–9 AM', urgent: false })
    setShowForm(false)
  }

  const conflictIds = new Set(conflicts.map(c => c.id))

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Deadlines</h1>
          <p className={styles.subtitle}>Track upcoming assignments, exams, and submission dates.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (showForm) {
              handleCancel()
            } else {
              setEditingId(null)
              setForm({ title: '', subject: '', day: 'MON', time: '8–9 AM', urgent: false })
              setShowForm(true)
            }
          }}
        >
          {showForm ? 'Cancel' : <><Plus size={16} /> Add Deadline</>}
        </button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className={`card ${styles.formCard} ${editingId ? styles.editModeCard : ''}`}>
          <div className={styles.formHeader}>
            <h3 className={styles.formTitle}>
              {editingId ? 'Edit Deadline' : 'New Deadline'}
            </h3>
            {editingId && (
              <span className={styles.editingTag}>Editing Mode</span>
            )}
          </div>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label>Title *</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder=""
                  required
                  autoFocus
                />
              </div>
              <div className={styles.field}>
                <label>Subject</label>
                <input
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder=""
                />
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.field}>
                <label>Day</label>
                <select name="day" value={form.day} onChange={handleChange}>
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label>Time Slot</label>
                <select name="time" value={form.time} onChange={handleChange}>
                  {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className={`${styles.field} ${styles.checkField}`}>
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    name="urgent"
                    checked={form.urgent}
                    onChange={handleChange}
                  />
                  Mark as Urgent
                </label>
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Save Changes' : 'Save Deadline'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {deadlines.length === 0 ? (
        <div className={`card ${styles.emptyCard}`}>
          <CheckCircle size={40} color="var(--success)" />
          <p>No deadlines yet. Add one to start tracking.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {deadlines.map(dl => {
            const isConflict = conflictIds.has(dl.id)
            const isBeingEdited = editingId === dl.id
            return (
              <div
                key={dl.id}
                className={`card ${styles.dlCard} ${isConflict ? styles.conflictCard : ''} ${isBeingEdited ? styles.activeEditingCard : ''}`}
              >
                <div className={styles.dlLeft}>
                  {isConflict
                    ? <AlertTriangle size={20} color="var(--danger)" />
                    : <CheckCircle size={20} color="var(--success)" />
                  }
                  <div>
                    <div className={styles.dlTitle}>{dl.title}</div>
                    <div className={styles.dlMeta}>
                      {dl.subject && <span>{dl.subject} · </span>}
                      <span>{dl.day}, {dl.time}</span>
                    </div>
                    {isConflict && (
                      <div className={styles.conflictNote}>
                        ⚠ This deadline overlaps with a WORK block — you may not be free!
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.dlRight}>
                  {dl.urgent && <span className="badge badge-deadline">Urgent</span>}
                  {isConflict && <span className="badge badge-deadline">Conflict!</span>}
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px' }}
                    onClick={() => handleStartEdit(dl)}
                    title="Edit Deadline"
                    aria-label={`Edit ${dl.title}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px' }}
                    onClick={() => removeDeadline(dl.id)}
                    title="Remove"
                    aria-label={`Remove ${dl.title}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
