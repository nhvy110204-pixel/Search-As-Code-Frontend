# RAGFlash UI Design System & Component Guidelines

Tài liệu này định nghĩa hệ quy chuẩn thiết kế giao diện (Design System), bộ token màu sắc, hình học (geometry), kiểu chữ (typography) và các mẫu component (component patterns) chuẩn mực của dự án RAGFlash.

Mọi component mới hoặc các tác vụ refactor giao diện trong tương lai **bắt buộc phải tuân theo** các nguyên tắc trong tài liệu này để đảm bảo tính nhất quán, hiện đại và cao cấp trên toàn hệ thống.

---

## 1. Triết lý Thiết kế (Design Philosophy)

Phong cách của RAGFlash kết hợp giữa sự tối giản phẳng (Modern Flat), ngôn ngữ hình học Squircle bo tròn mềm mại và trải nghiệm SaaS hàng đầu:

1. **Card-based Modularity (Mô-đun hóa dạng thẻ)**: 
   Mọi nhóm thông tin, cài đặt hoặc khối chức năng được đóng gói trong thẻ bo tròn viền nhạt (`border-radius: 18px`).
2. **High-Clarity Surfaces (Bề mặt trong trẻo, tương phản chuẩn)**:
   - **Light mode**: Nền thẻ trắng tinh khiết (`#FFFFFF`) trên viền xám sáng (`#ECECEC`), tạo cảm giác sạch sẽ, hiện đại và không bị gắt mắt.
   - **Dark mode**: Tông đen than chì ấm áp (`#1E1E1F` cho modal, `#232324` cho thẻ, `#2C2C2E` cho track/inputs) kết hợp viền mờ tinh tế (`rgba(255, 255, 255, 0.08)`).
3. **Subtle & Intentional Accent (Màu sắc điểm nhấn có chủ đích)**:
   Màu xanh dương chủ đạo `#0878F9` chỉ được dùng để thu hút sự chú ý vào trạng thái kích hoạt, hành động chính, thanh tiến trình hoặc liên kết nâng cao. Không lạm dụng màu sắc làm rối mắt.
4. **Micro-Hierarchy (Phân cấp chi tiết sắc nét)**:
   Mỗi thẻ có phân cấp typography rõ rệt: Tiêu đề thẻ (15px bold) → Mô tả phụ (12-12.5px secondary) → Nhãn trạng thái/Pill badge (11-13px bold).

---

## 2. Bảng Design Tokens chuẩn (Color Tokens)

### 2.1. Surfaces & Backgrounds (Nền & Bề mặt)

| Token | Light Mode | Dark Mode | Ứng dụng |
| :--- | :--- | :--- | :--- |
| **Modal Background** | `#FFFFFF` | `#1E1E1F` | Khung Modal chính |
| **Modal Mask / Backdrop** | `rgba(0, 0, 0, 0.20)` (blur 8px) | `rgba(0, 0, 0, 0.45)` (blur 8px) | Lớp phủ nền sau modal |
| **Sidebar Background** | `#FFFFFF` | `#1E1E1F` | Cột bên trái modal/sidebar |
| **Card Surface (Layer 1)** | `#FFFFFF` | `#232324` | Khối thẻ card, danh sách items |
| **Track / Pill Container** | `#EEEEEE` | `#2C2C2E` | Rãnh trượt, vỏ bọc switch/toggles |
| **Active Pill / Tab Surface** | `#EFEFEF` (hoặc `#FFFFFF`) | `rgba(255, 255, 255, 0.12)` | Nút/Tab đang chọn |
| **Hover Surface** | `#F7F7F7` | `rgba(255, 255, 255, 0.05)` | Trạng thái rê chuột nav item |
| **Icon Tile Surface** | `#F5F5F5` | `#2C2C2E` | Hộp vuông bọc icon (42x42 / 44x44) |

### 2.2. Borders & Dividers (Viền & Đường kẻ)

| Token | Light Mode | Dark Mode | Ứng dụng |
| :--- | :--- | :--- | :--- |
| **Card Border** | `1px solid #ECECEC` | `1px solid rgba(255, 255, 255, 0.08)` | Viền thẻ tiêu chuẩn |
| **Selected Card Border** | `1.5px solid #0878F9` | `1.5px solid #0878F9` | Thẻ đang kích hoạt |
| **Divider Line** | `#EEEEEE` | `rgba(255, 255, 255, 0.08)` | Đường phân cách ngang trong card |
| **Input Border** | `1px solid #E5E5E5` | `1px solid rgba(255, 255, 255, 0.12)` | Viền ô nhập liệu input |
| **Modal Outer Border** | Không viền | `1px solid rgba(255, 255, 255, 0.08)` | Viền viền mờ modal dark mode |

### 2.3. Typography & Text Colors (Màu chữ)

| Token | Light Mode | Dark Mode | Ứng dụng |
| :--- | :--- | :--- | :--- |
| **Text Primary** | `#181818` | `#FFFFFF` | Tiêu đề, tên hiển thị, nhãn chính |
| **Text Secondary** | `#555555` / `#666666` | `#999999` / `#AAAAAA` | Tiêu đề nhóm, mô tả thẻ, phụ đề |
| **Text Tertiary / Muted** | `#777777` / `#888888` | `#777777` | Gợi ý, chú thích thời gian |
| **Accent Primary** | `#0878F9` | `#0878F9` | Nút hành động, liên kết, số liệu |
| **Accent Badge Tint** | `#EAF3FE` | `rgba(8, 120, 249, 0.18)` | Nền pill badge "Gói miễn phí" |
| **Danger / Logout Hover** | `#DC2626` | `#EF4444` | Nút đăng xuất, hành động nguy hiểm |

---

## 3. Quy chuẩn Hình học & Bo góc (Geometry & Radii)

RAGFlash sử dụng hệ thống bo góc phân cấp rõ ràng theo kích thước container:

```
┌────────────────────────────────────────────────────────┐
│  Modal Dialog: border-radius: 32px                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Content Card: border-radius: 18px               │  │
│  │  ┌──────────────┐  ┌──────────────────────────┐  │  │
│  │  │  Icon Tile:  │  │  Pill Toggle / Badge:    │  │  │
│  │  │  radius 12px │  │  radius 999px (full)     │  │  │
│  │  └──────────────┘  └──────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

- **32px (`border-radius: 32px`)**: Khung Modal lớn, cửa sổ chính (`SettingsModal`, `DocumentDetailModal`).
- **18px (`border-radius: 18px`)**: Các khối thẻ Card (`cardStyle`), grouped containers, grid selection cards.
- **12px (`border-radius: 12px`)**: Hộp vuông chứa icon (Icon Tiles 42x42 hoặc 44x44), squircle avatar, nav item ở sidebar modal.
- **10px (`border-radius: 10px`)**: Ô input fields, textareas, nút bấm trong form.
- **999px (`border-radius: 999px`)**: Pill badge, nút chuyển chế độ (segmented toggle), thanh progress bar.
- **50% (`border-radius: 50%`)**: Nút đóng modal tròn (`width: 32px; height: 32px`), avatar tròn.

---

## 4. Typography & Spacing Scale (Phông chữ & Khoảng cách)

### Phông chữ
- **Body & Headings**: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Code & API Keys**: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

### Cỡ chữ & Trọng lượng chuẩn
- **Modal Title**: `18px - 19px`, `font-weight: 600`, `line-height: 1.3`
- **Section Group Label**: `14px`, `font-weight: 600`, màu secondary (`#555555` / `#999999`), `margin: 0 0 8px`
- **Card Primary Label**: `14px - 15px`, `font-weight: 500 - 600`
- **Card Subtitle / Description**: `12px - 12.5px`, `font-weight: 400`, `line-height: 1.4 - 1.45`
- **Pill / Badge Label**: `11.5px - 13px`, `font-weight: 600`

---

## 5. Các Mẫu Component Chuẩn (Reusable Patterns)

Dưới đây là mã nguồn chuẩn của từng mẫu component để copy-paste trực tiếp khi tạo mới hoặc refactor.

### Mẫu 1: Thẻ Tiêu chuẩn (Standard Card)
Dùng cho danh thiếp người dùng, hàng thiết lập đơn lẻ, thẻ liên kết.

```tsx
import { useThemeStore } from '@/store/useThemeStore'

export function ExampleCard() {
  const { isDark } = useThemeStore()

  const cardStyle: React.CSSProperties = {
    padding: '16px 20px',
    background: isDark ? 'var(--dsw-alias-bg-layer-1, #232324)' : '#FFFFFF',
    borderRadius: 18,
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #ECECEC',
    boxSizing: 'border-box',
    transition: 'all 120ms ease',
  }

  return (
    <div style={cardStyle}>
      {/* Nội dung bên trong */}
    </div>
  )
}
```

---

### Mẫu 2: Khối nhóm Gộp (Grouped Card with Dividers)
Dùng khi có 2 hoặc nhiều tuỳ chọn thuộc cùng một chủ đề (ví dụ: Chế độ sáng/tối + Hành vi gửi tin nhắn).

```tsx
<div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
  {/* Hàng 1 */}
  <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--dsw-alias-label-primary, #181818)' }}>
      Tuỳ chọn A
    </span>
    {/* Controls */}
  </div>

  {/* Đường kẻ phân cách */}
  <div style={{ height: 1, background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EEEEEE', margin: '0 20px' }} />

  {/* Hàng 2 */}
  <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--dsw-alias-label-primary, #181818)' }}>
        Tuỳ chọn B
      </div>
      <div style={{ fontSize: 12, color: isDark ? '#888888' : '#777777', marginTop: 2 }}>
        Mô tả chi tiết tuỳ chọn B
      </div>
    </div>
    {/* Controls */}
  </div>
</div>
```

---

### Mẫu 3: Thanh gạt viên thuốc (Segmented Pill Switcher)
Dùng cho bộ chuyển 2 hoặc 3 trạng thái (Theme switcher, Enter behavior switcher).

```tsx
<div
  style={{
    display: 'flex',
    background: isDark ? '#2C2C2E' : '#EEEEEE',
    padding: 3,
    borderRadius: 999,
    gap: 2,
  }}
>
  {options.map((opt) => {
    const isActive = selected === opt.id
    return (
      <button
        key={opt.id}
        type="button"
        onClick={() => setSelected(opt.id)}
        style={{
          padding: '4px 12px',
          border: 'none',
          borderRadius: 999,
          fontSize: 13,
          fontWeight: isActive ? 600 : 400,
          background: isActive ? (isDark ? 'rgba(255,255,255,0.12)' : '#FFFFFF') : 'transparent',
          color: isActive ? '#0878F9' : (isDark ? '#AAAAAA' : '#666666'),
          boxShadow: isActive ? (isDark ? '0 2px 6px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.08)') : 'none',
          cursor: 'pointer',
          transition: 'all 120ms ease',
        }}
      >
        {opt.label}
      </button>
    )
  })}
</div>
```

---

### Mẫu 4: Thẻ chọn dạng Lưới (Selection Grid Card)
Dùng cho danh sách Mô hình (R1, V3) hoặc Chế độ Agent (Presets).

```tsx
<div
  onClick={onSelect}
  style={{
    padding: '16px 18px',
    borderRadius: 18,
    background: isDark ? '#232324' : '#FFFFFF',
    border: isSelected ? '1.5px solid #0878F9' : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #ECECEC'),
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    transition: 'all 140ms ease',
    boxShadow: isSelected ? '0 2px 10px rgba(8, 120, 249, 0.12)' : 'none',
  }}
>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--dsw-alias-label-primary, #181818)' }}>
      {item.name}
    </span>
    {/* Status badge */}
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 999,
        background: isSelected ? 'rgba(8, 120, 249, 0.12)' : (isDark ? 'rgba(255,255,255,0.08)' : '#F2F2F2'),
        color: isSelected ? '#0878F9' : (isDark ? '#AAAAAA' : '#666666'),
      }}
    >
      {item.badge}
    </span>
  </div>
  <div style={{ fontSize: 12, color: isDark ? '#AAAAAA' : '#666666', lineHeight: 1.4 }}>
    {item.description}
  </div>
</div>
```

---

### Mẫu 5: Hộp Icon Squircle (Icon Tile)
Dùng trong thẻ Presets, thẻ Profile hoặc danh sách tính năng.

```tsx
<div
  style={{
    width: 44,
    height: 44,
    borderRadius: 12,
    background: isDark ? '#2C2C2E' : '#F5F5F5',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  }}
>
  {/* Icon SVG với màu #0878F9 hoặc tương ứng */}
  <Icon size={20} style={{ color: '#0878F9' }} />
</div>
```

---

### Mẫu 6: Thanh Tiến trình & Quota (Progress Bar)

```tsx
<div
  style={{
    height: 6,
    background: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E8E8E8',
    borderRadius: 999,
    margin: '14px 0 16px',
    overflow: 'hidden',
  }}
>
  <div
    style={{
      width: `${percentage}%`,
      height: '100%',
      background: '#0878F9',
      borderRadius: 999,
      transition: 'width 240ms ease',
    }}
  />
</div>
```

---

## 6. Hướng dẫn Refactor các Màn hình Hiện có (Refactoring Guide)

Khi refactor các màn hình cũ sang phong cách chuẩn này (ví dụ: `ProjectsRoot`, `DocumentDetailModal`, `LoginModal`, `UserProfileModal`):

### Bước 1: Rà soát & Thay thế Bo góc (Corner Radii)
- Thay toàn bộ bo góc `4px`, `6px`, `8px` sắc cạnh ở các khung hộp chính thành:
  - Khung modal: `32px`
  - Thẻ / Card / Container: `18px`
  - Nút bấm / Input trong thẻ: `10px - 12px`
  - Nút tròn đóng/mở: `50%`

### Bước 2: Chuẩn hóa Màu viền & Nền thẻ (Surfaces & Borders)
- Xóa bỏ các màu nền xám gắt hoặc bóng đổ đậm (heavy box-shadows).
- Thay bằng:
  - Nền Light mode: `#FFFFFF` với viền `1px solid #ECECEC`.
  - Nền Dark mode: `#232324` với viền `1px solid rgba(255, 255, 255, 0.08)`.
  - Đường phân cách: `#EEEEEE` (Light) và `rgba(255, 255, 255, 0.08)` (Dark).

### Bước 3: Đồng bộ Icon & Nút tương tác
- Dùng `IconCloseOutline16` hoặc icon từ `@/components/ui`.
- Nút đóng góc trên bên phải: Hình tròn `32x32px`, nền `#F5F5F5` (Dark: `rgba(255,255,255,0.08)`), hover zoom nhẹ và chuyển nền.
- Nút điều hướng hoặc menu item: Chiều cao `38px`, bo góc `12px`, padding ngang `12px`. Khi active có nền `#EFEFEF` (Light) / `rgba(255,255,255,0.09)` (Dark).

### Bước 4: Kiểm tra Responsiveness & Trợ năng (Accessibility)
- Chiều rộng modal tiêu chuẩn: `width: min(880px, calc(100vw - 32px))`.
- Chiều cao modal tiêu chuẩn: `height: min(650px, calc(100vh - 32px))`.
- Luôn hỗ trợ đóng bằng phím **Escape** (`keydown`).
- Luôn hỗ trợ `aria-modal="true"` và nhãn `aria-label`.
