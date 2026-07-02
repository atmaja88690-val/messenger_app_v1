import { useState } from 'react'

interface NewUserDialogProps {
  onClose: () => void
}

interface FormState {
  username: string
  password: string
  title: string
  firstName: string
  lastName: string
  middleName: string
  nickname: string
  dateOfBirth: string
  jobTitle: string
  jobDepartment: string
  jobDescription: string
  phoneNumber: string
  email: string
  socialProfile: string
  postalAddress: string
}

const EMPTY_FORM: FormState = {
  username: '',
  password: '',
  title: '',
  firstName: '',
  lastName: '',
  middleName: '',
  nickname: '',
  dateOfBirth: '',
  jobTitle: '',
  jobDepartment: '',
  jobDescription: '',
  phoneNumber: '',
  email: '',
  socialProfile: '',
  postalAddress: ''
}

export default function NewUserDialog({ onClose }: NewUserDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async () => {
    setError(null)

    if (!form.username.trim() || !form.password.trim()) {
      setError('Username and password are required.')
      return
    }
    if (!form.firstName.trim()) {
      setError('First name is required.')
      return
    }

    setSubmitting(true)
    try {
      // TODO: backend endpoint belum diverifikasi (POST /api/admin/users atau serupa).
      // Stub dulu sesuai keputusan: form UI dulu, endpoint nanti.
      console.log('[NewUserDialog] submit (stub, belum kirim ke backend):', form)
      setError('Backend endpoint for creating users is not wired up yet — form data logged to console only.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-800">
          <h2 className="text-lg font-semibold text-white">New User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">
            &times;
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 bg-amber-900/40 border border-amber-700 rounded-lg text-amber-300 text-sm">
              {error}
            </div>
          )}

          {/* Login credentials */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Username" value={form.username} onChange={set('username')} autoFocus />
            <Field label="Password" value={form.password} onChange={set('password')} type="password" />
          </div>

          <div className="border-t border-gray-700 pt-4 space-y-3">
            <Field label="Title" value={form.title} onChange={set('title')} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name" value={form.firstName} onChange={set('firstName')} />
              <Field label="Last Name" value={form.lastName} onChange={set('lastName')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Middle Name" value={form.middleName} onChange={set('middleName')} />
              <Field label="Nickname" value={form.nickname} onChange={set('nickname')} />
            </div>
            <Field label="Date of Birth" value={form.dateOfBirth} onChange={set('dateOfBirth')} type="date" />
            <Field label="Job Title" value={form.jobTitle} onChange={set('jobTitle')} />
            <Field label="Job Department" value={form.jobDepartment} onChange={set('jobDepartment')} />
            <TextAreaField label="Job Description" value={form.jobDescription} onChange={set('jobDescription')} />
            <Field label="Phone Number" value={form.phoneNumber} onChange={set('phoneNumber')} />
            <Field label="Email Address" value={form.email} onChange={set('email')} type="email" />
            <Field label="Social Profile" value={form.socialProfile} onChange={set('socialProfile')} />
            <TextAreaField label="Postal Address" value={form.postalAddress} onChange={set('postalAddress')} />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-700 sticky bottom-0 bg-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white rounded-lg text-sm font-medium"
          >
            {submitting ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  autoFocus = false
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  autoFocus?: boolean
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        className="w-full px-3 py-2 bg-gray-700 text-white text-sm rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
      />
    </div>
  )
}

function TextAreaField({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        rows={2}
        className="w-full px-3 py-2 bg-gray-700 text-white text-sm rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
      />
    </div>
  )
}
