# AGENTS.md — Chatbot Web Frontend (Standalone React 19 + TypeScript + Vite)

> **Mục tiêu**: Đây là hướng dẫn kỹ thuật toàn diện cho các AI coding agent khi phát triển, mở rộng hoặc tích hợp backend cho giao diện `chatbot-web-fe`. Toàn bộ giao diện được copy nguyên bản 100% từ DeepSeek Harness (`packages/client/*`), tuân thủ tuyệt đối các chuẩn thiết kế, CSS Module, Class names, Design tokens và Tokens hệ thống `--dsw-*`.

---

## 1. Kiến Trúc Dự Án (`chatbot-web-fe`)

```
chatbot-web-fe/
├── src/
│   ├── components/
│   │   ├── layout/            # Khung AppFrame 2 cột (sidebarCol + centerCol) và Modal thêm workspace
│   │   ├── sidebar/           # SidebarRoot (Logo, BrandWordmark, FishLogo, New Session, Settings)
│   │   ├── workspace/         # WorkspaceBrowser, Rows (ProjectRow, SessionRow), WorkspacePicker
│   │   ├── conversation/      # ConversationRoot, EmptyHero, InputBar, ChatView, MessageItem, ReasoningRow, ContextMeter, ApprovalPanel
│   │   ├── commands/          # PopupSelectView (Menu gợi ý lệnh Slash Commands `/`)
│   │   ├── model-selection/   # ModelSelect (Menu dropdown chọn mô hình đa cấp, nhóm, checkmark)
│   │   ├── questions/         # QuestionComposer (Takeover hỏi đáp), PlanReviewPanel (Takeover duyệt plan)
│   │   ├── settings/          # SettingsRoot (Modal 1080x700 2 cột), AppearanceRow (Theme cubes), EnterBehaviorRow, Tabs
│   │   ├── attachment/        # AttachmentRail, DropOverlay, ImageLightbox, MessageImage
│   │   ├── feedback/          # MessageFeedbackActions (Thumbs Up/Down)
│   │   ├── deliverables/      # ProducedFiles (Thẻ danh sách file do agent tạo ra)
│   │   ├── interactive/       # Interactive components
│   │   └── ui/                # 25 UI Primitives độc lập (Button, Modal, Menu, Tooltip, HoverCard, Pill, Toast, TerminalBlock, DiffBlock, v.v.)
│   ├── store/                 # Zustand state stores (useChatStore, useSettingsStore, useThemeStore)
│   ├── styles/                # Design Platform Tokens (--dsw-*), Base, Scrollbar, Shiki, Reset
│   ├── types/                 # TypeScript interfaces (chat.ts)
│   ├── App.tsx                # Gắn AppFrame và các Layer Modals
│   └── main.tsx               # Entry point
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 2. Danh Sách Đầy Đủ Các Popup, Dropdown Menu & Dialog

| Loại Giao Diện | Thành Phần | File Nguồn | Chức Năng |
| :--- | :--- | :--- | :--- |
| **Menu Dropdown** | `Menu` | `src/components/ui/Menu.tsx` | Menu ngữ cảnh dạng popover với submenus, phím tắt, dividers, checkmarks, portal rendering. |
| **Popup Lệnh Slash** | `PopupSelectView` | `src/components/commands/PopupSelectView.tsx` | Menu gợi ý lệnh nhanh tự động hiện khi gõ `/` trong ô chat (hỗ trợ phím mũi tên, Enter, Tab). |
| **Menu Chọn Mô Hình** | `ModelSelect` | `src/components/model-selection/ModelSelect.tsx` | Dropdown 2 cấp phân nhóm theo hãng mô hình, hiển thị mô tả, độ nỗ lực, và dấu tích chọn. |
| **Popup Context Token** | `ContextMeter` | `src/components/conversation/ContextMeter.tsx` | Vòng tròn đo % token ngữ cảnh cạnh nút gửi, click mở popup phân tích chi tiết System / Tools / Messages. |
| **Dialog Đổi Tên Session** | `Modal` (Rename Session) | `src/components/workspace/WorkspaceBrowser.tsx` | Hộp thoại nhập tên mới cho phiên trò chuyện, phím tắt Enter để lưu. |
| **Dialog Xóa Workspace** | `Modal` (Delete Workspace) | `src/components/workspace/WorkspaceBrowser.tsx` | Hộp thoại cảnh báo và xác nhận xóa thư mục làm việc khỏi sidebar. |
| **Dialog Thêm Workspace** | `AddWorkspaceModal` | `src/components/layout/AddWorkspaceModal.tsx` | Hộp thoại nhập tên và đường dẫn thư mục làm việc mới. |
| **Thẻ Takeover Phê Duyệt** | `ApprovalPanel` | `src/components/conversation/ApprovalPanel.tsx` | Khung cảnh báo màu hổ phách thay thế InputBar khi agent yêu cầu phê duyệt lệnh nguy hiểm. |
| **Thẻ Takeover Duyệt Plan** | `PlanReviewPanel` | `src/components/questions/PlanReviewPanel.tsx` | Khung xem xét markdown kế hoạch và nút phê duyệt / từ chối trước khi agent thực thi. |
| **Thẻ Takeover Hỏi Đáp** | `QuestionComposer` | `src/components/questions/QuestionComposer.tsx` | Khung câu hỏi trắc nghiệm / nhiều lựa chọn / nhập tay để người dùng trả lời trực tiếp cho agent. |
| **Modal Xem Ảnh Lớn** | `ImageLightbox` | `src/components/attachment/ImageLightbox.tsx` | Xem ảnh phóng to toàn màn hình khi nhấp vào ảnh trong hội thoại. |
| **Modal Cài Đặt Hệ Thống** | `SettingsRoot` | `src/components/settings/SettingsRoot.tsx` | Modal 800-1080px 2 cột (188px nav rail + options area) quản lý theme, phím tắt, API key, presets, plugins. |

---

## 3. Quy Tắc Dành Cho AI Coding Agent

1. **Không Tự Sáng Tạo Giao Diện**: Luôn tái sử dụng các components và biến CSS trong `src/styles/design-platform.css` và `src/components/ui/`.
2. **Kế Thừa CSS Modules**: Khi tạo thêm thành phần mới, áp dụng quy tắc đặt tên class tương tự các module gốc (`.root`, `.card`, `.body`, `.header`, `.trigger`, `.selected`).
3. **Quản Lý Trạng Thái Qua Zustand**:
   - `useChatStore`: Quản lý các phiên chat, streaming, tin nhắn, danh sách workspace, phản hồi like/dislike.
   - `useSettingsStore`: Quản lý API Key, Base URL, Temperature, Max Tokens, Tab cài đặt.
   - `useThemeStore`: Quản lý chế độ theme (Light / Dark / System).
4. **Tích Hợp Backend Dễ Dàng**: Khi kết nối với backend thực tế, chỉ cần gọi `sendMessage` từ `useChatStore` và cập nhật luồng `fetch` SSE trong hàm `sendMessage`.
