import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { Modal } from '@/components/ui/Modal'
import { FishLogo } from '@/components/ui/FishLogo'
import { IconCloseOutline16 } from '@/components/ui/icons'
import { useAuthStore } from '@/store/useAuthStore'
import { Eye, EyeOff, AlertCircle, LogIn, UserPlus } from 'lucide-react'
import css from './LoginModal.module.css'

export function LoginModal() {
  const {
    isLoginModalOpen,
    loginModalDefaultTab,
    closeLoginModal,
    login,
    register,
    isLoading,
    authError,
    clearAuthError,
  } = useAuthStore()

  const [tab, setTab] = useState<'login' | 'register'>('login')

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  // Register form state
  const [regFullName, setRegFullName] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [regLocalError, setRegLocalError] = useState<string | null>(null)

  // Sync tab with defaultTab when modal opens
  useEffect(() => {
    if (isLoginModalOpen) {
      setTab(loginModalDefaultTab)
      clearAuthError()
      setRegLocalError(null)
    }
  }, [isLoginModalOpen, loginModalDefaultTab, clearAuthError])

  const handleTabChange = (nextTab: 'login' | 'register') => {
    setTab(nextTab)
    clearAuthError()
    setRegLocalError(null)
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginIdentifier.trim() || !loginPassword) return

    await login({
      identifier: loginIdentifier.trim(),
      password: loginPassword,
    })
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegLocalError(null)

    if (!regUsername.trim() || !regEmail.trim() || !regPassword) {
      setRegLocalError('Vui lòng điền đầy đủ các thông tin bắt buộc.')
      return
    }

    if (regUsername.trim().length < 3) {
      setRegLocalError('Tên người dùng phải có ít nhất 3 ký tự.')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(regUsername.trim())) {
      setRegLocalError('Tên người dùng chỉ được chứa chữ cái, số và gạch dưới (không chứa khoảng cách hay ký tự đặc biệt).')
      return
    }

    if (regPassword.length < 8) {
      setRegLocalError('Mật khẩu phải chứa ít nhất 8 ký tự.')
      return
    }

    if (regPassword !== regConfirmPassword) {
      setRegLocalError('Mật khẩu xác nhận không trùng khớp.')
      return
    }

    await register({
      username: regUsername.trim(),
      email: regEmail.trim(),
      password: regPassword,
      full_name: regFullName.trim() || undefined,
    })
  }

  return (
    <Modal
      open={isLoginModalOpen}
      onClose={closeLoginModal}
      title="Tài khoản người dùng"
      headless
    >
      <div className={css.dialog}>
        {/* Header */}
        <div className={css.header}>
          <div className={css.brandGroup}>
            <div className={css.brandIcon}>
              <FishLogo size={22} />
            </div>
            <h2 className={css.title}>
              {tab === 'login' ? 'Đăng nhập vào Hệ thống' : 'Tạo tài khoản mới'}
            </h2>
          </div>
          <button
            type="button"
            className={css.closeBtn}
            aria-label="Đóng"
            onClick={closeLoginModal}
          >
            <IconCloseOutline16 size={14} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className={css.tabsRow}>
          <button
            type="button"
            className={clsx(css.tabBtn, tab === 'login' && css.active)}
            onClick={() => handleTabChange('login')}
          >
            Đăng nhập
            {tab === 'login' && <div className={css.tabIndicator} />}
          </button>
          <button
            type="button"
            className={clsx(css.tabBtn, tab === 'register' && css.active)}
            onClick={() => handleTabChange('register')}
          >
            Đăng ký
            {tab === 'register' && <div className={css.tabIndicator} />}
          </button>
        </div>

        {/* Error Alert */}
        <div className={css.body}>
          {(authError || regLocalError) && (
            <div className={css.errorBanner}>
              <AlertCircle size={16} />
              <span>{authError || regLocalError}</span>
            </div>
          )}

          {tab === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className={css.formGroup}>
                <label className={css.label}>Email hoặc Tên đăng nhập</label>
                <div className={css.inputWrapper}>
                  <input
                    type="text"
                    required
                    autoFocus
                    className={css.input}
                    placeholder="VD: user@example.com hoặc username"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                  />
                </div>
              </div>

              <div className={css.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className={css.label}>Mật khẩu</label>
                </div>
                <div className={css.inputWrapper}>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    className={clsx(css.input, css.inputWithToggle)}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className={css.togglePasswordBtn}
                    onClick={() => setShowLoginPassword((v) => !v)}
                    aria-label={showLoginPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={css.submitBtn}
                disabled={isLoading || !loginIdentifier.trim() || !loginPassword}
              >
                {isLoading ? (
                  <div className={css.spinner} />
                ) : (
                  <>
                    <LogIn size={16} />
                    <span>Đăng nhập</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className={css.formGroup}>
                <label className={css.label}>Họ và tên (Tùy chọn)</label>
                <input
                  type="text"
                  className={css.input}
                  placeholder="VD: Nguyễn Văn A"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                />
              </div>

              <div className={css.formGroup}>
                <label className={css.label}>Tên người dùng (Username) *</label>
                <input
                  type="text"
                  required
                  className={css.input}
                  placeholder="VD: nguyenvana"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                />
              </div>

              <div className={css.formGroup}>
                <label className={css.label}>Địa chỉ Email *</label>
                <input
                  type="email"
                  required
                  className={css.input}
                  placeholder="user@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>

              <div className={css.formGroup}>
                <label className={css.label}>Mật khẩu (Tối thiểu 8 ký tự) *</label>
                <div className={css.inputWrapper}>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    className={clsx(css.input, css.inputWithToggle)}
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className={css.togglePasswordBtn}
                    onClick={() => setShowRegPassword((v) => !v)}
                    aria-label={showRegPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className={css.formGroup}>
                <label className={css.label}>Xác nhận mật khẩu *</label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  className={css.input}
                  placeholder="••••••••"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className={css.submitBtn}
                disabled={isLoading || !regUsername.trim() || !regEmail.trim() || !regPassword}
              >
                {isLoading ? (
                  <div className={css.spinner} />
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Tạo tài khoản</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </Modal>
  )
}
