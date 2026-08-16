import { IconBrowseOutline16, IconDownloadOutline16 } from '@/components/ui'
import type { ProducedFile } from '@/types/chat'
import css from './ProducedFiles.module.css'

export interface ProducedFilesProps {
  files: ProducedFile[]
  onOpenFile?: (file: ProducedFile) => void
}

export function ProducedFiles({ files, onOpenFile }: ProducedFilesProps) {
  if (!files || files.length === 0) return null

  return (
    <div className={css.root}>
      <div className={css.header}>
        <IconBrowseOutline16 size={14} />
        <span>Tệp được tạo ({files.length}):</span>
      </div>
      <div className={css.list}>
        {files.map((file) => (
          <button
            key={file.id}
            type="button"
            className={css.chip}
            onClick={() => onOpenFile?.(file)}
          >
            <span>{file.name}</span>
            {file.size && <span className={css.fileSize}>({file.size})</span>}
            <IconDownloadOutline16 size={12} style={{ marginLeft: 2 }} />
          </button>
        ))}
      </div>
    </div>
  )
}
