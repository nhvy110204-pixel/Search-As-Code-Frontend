import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { IconCloseOutline16, IconCheckOutline16 } from '@/components/ui'
import { useAuthStore } from '@/store/useAuthStore'
import css from './UserProfileModal.module.css'

export function UserProfileModal() {
  const {
    user,
    isProfileModalOpen,
    closeProfileModal,
    updateUserProfile,
    isLoading,
  } = useAuthStore()

  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (user && isProfileModalOpen) {
      setFullName(user.full_name || '')
      setAvatarUrl(user.avatar_url || '')
      setUsername(user.username || '')
      setEmail(user.email || '')
      setSaveSuccess(false)
    }
  }, [user, isProfileModalOpen])

  if (!user) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveSuccess(false)

    const success = await updateUserProfile({
      full_name: fullName.trim() || undefined,
      avatar_url: avatarUrl.trim() || undefined,
      username: username.trim() || undefined,
      email: email.trim() || undefined,
    })

    if (success) {
      setSaveSuccess(true)
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
    }
  }

  const initialLetter = (user.full_name || user.username || 'U').charAt(0).toUpperCase()
  const formattedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : 'Không xác định'

  return (
    <Modal
      open={isProfileModalOpen}
      onClose={closeProfileModal}
      title="Hồ sơ người dùng"
      headless
    >
      <div className={css.dialog}>
        {/* Header */}
        <div className={css.header}>
          <h2 className={css.title}>Hồ sơ cá nhân & Tài khoản</h2>
          <button
            type="button"
            className={css.closeBtn}
            aria-label="Đóng"
            onClick={closeProfileModal}
          >
            <IconCloseOutline16 size={14} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave}>
          <div className={css.body}>
            {/* User Hero Banner */}
            <div className={css.userHero}>
              <div className={css.avatarContainer}>
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className={css.avatarImg}
                    onError={(e) => {
                      // fallback to initials on broken image
                      (e.currentTarget as HTMLElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <span>{initialLetter}</span>
                )}
              </div>
              <div className={css.userSummary}>
                <div className={css.nameRow}>
                  <span className={css.userName}>
                    {user.full_name || user.username}
                  </span>
                  <span className={css.badge}>
                    <IconCheckOutline16 size={12} style={{ display: 'inline', marginRight: 3, verticalAlign: -1 }} />
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <span className={css.userEmail}>{user.email}</span>
              </div>
            </div>

            {/* Profile Edit Section */}
            <div className={css.section}>
              <span className={css.sectionTitle}>Thông tin cá nhân</span>
              <div className={css.formGrid}>
                <div className={css.formGroup}>
                  <label className={css.label}>Họ và tên</label>
                  <input
                    type="text"
                    className={css.input}
                    placeholder="VD: Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className={css.formGroup}>
                  <label className={css.label}>Tên đăng nhập (Username)</label>
                  <input
                    type="text"
                    className={css.input}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div className={css.fullWidth}>
                  <div className={css.formGroup}>
                    <label className={css.label}>Địa chỉ Email</label>
                    <input
                      type="email"
                      className={css.input}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className={css.fullWidth}>
                  <div className={css.formGroup}>
                    <label className={css.label}>Đường dẫn ảnh đại diện (Avatar URL)</label>
                    <input
                      type="url"
                      className={css.input}
                      placeholder="https://example.com/avatar.png"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* System Info Section */}
            <div className={css.section}>
              <span className={css.sectionTitle}>Thông tin hệ thống</span>
              <div className={css.metaList}>
                <div className={css.metaRow}>
                  <span className={css.metaKey}>Ngày tham gia:</span>
                  <span className={css.metaVal}>{formattedDate}</span>
                </div>
                <div className={css.metaRow}>
                  <span className={css.metaKey}>Vai trò:</span>
                  <span className={css.metaVal}>
                    {user.metadata_?.role ? String(user.metadata_.role).toUpperCase() : 'STANDARD USER'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={css.footer}>
            {saveSuccess && (
              <span className={css.successMsg}>
                <IconCheckOutline16 size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
                Đã lưu thay đổi thành công!
              </span>
            )}
            <button
              type="button"
              className={css.cancelBtn}
              onClick={closeProfileModal}
            >
              Đóng
            </button>
            <button
              type="submit"
              className={css.saveBtn}
              disabled={isLoading}
            >
              <IconCheckOutline16 size={14} />
              <span>{isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
