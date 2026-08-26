export type ProjectStatus = 'active' | 'archived' | 'deleted'
export type DocumentStatus =
  | 'uploaded'
  | 'pending'
  | 'processing'
  | 'parsing'
  | 'parsed'
  | 'summarizing'
  | 'chunking'
  | 'deduped'
  | 'enriched'
  | 'embedding'
  | 'linked'
  | 'ready'
  | 'completed'
  | 'partially_available'
  | 'completed_with_warnings'
  | 'failed'
  | 'quarantined'
  | (string & {})

export interface ProjectResponse {
  id: string
  owner_user_id: string
  name: string
  description: string | null
  status: ProjectStatus
  settings: Record<string, any>
  document_count: number
  session_count: number
  created_at: string
  updated_at: string
}

export interface ProjectCreateRequest {
  name: string
  description?: string | null
  status?: ProjectStatus
  settings?: Record<string, any>
}

export interface ProjectUpdateRequest {
  name?: string
  description?: string | null
  status?: ProjectStatus
  settings?: Record<string, any>
}

export interface ProjectListResponse {
  items: ProjectResponse[]
  total: number
  page: number
  page_size: number
}

export interface DocumentResponse {
  id: string
  user_id: string
  project_id: string
  file_name: string
  description: string | null
  mime_type: string
  storage_path: string | null
  markdown_path: string | null
  file_size_bytes: number
  status: DocumentStatus
  chunk_count: number
  has_partial_failures?: boolean
  processing_metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface DocumentListResponse {
  items: DocumentResponse[]
  total: number
  page: number
  page_size: number
}

export interface DocumentPreviewResponse {
  id: string
  file_name: string
  mime_type: string
  status: string
  chunk_count: number
  content: string
  summary: string | null
}

export interface DocumentChunkResponse {
  id: string
  document_id: string
  chunk_index: number
  content: string
  enriched_content?: string | null
  chunk_hash: string
  token_count: number
  page_number?: number | null
  embed_status: string
  chunk_source: string
  created_at: string
}

export interface DocumentChunkListResponse {
  items: DocumentChunkResponse[]
  total: number
  page: number
  page_size: number
}

export interface DocumentUploadResponse {
  document_id: string
  task_id: string | null
  celery_task_id: string | null
  is_new: boolean
  status: string
}

export type IngestionTaskState =
  | 'pending'
  | 'running'
  | 'checking_cache'
  | 'parsing'
  | 'summarizing'
  | 'chunking'
  | 'deduping'
  | 'enriching'
  | 'embedding'
  | 'linking'
  | 'saving'
  | 'processing'
  | 'completed'
  | 'partial_success'
  | 'completed_with_warnings'
  | 'failed'
  | 'failed_retryable'
  | 'failed_permanent'
  | 'cancelled'
  | 'quarantined'
  | (string & {})

export interface IngestionTaskStatus {
  task_id: string
  document_id?: string | null
  project_id?: string | null
  status: IngestionTaskState
  progress: number
  current_step?: string | null
  stage_label?: string | null
  processed_units?: number | null
  total_units?: number | null
  unit_name?: string | null
  step_upper_bound?: number | null
  estimated_duration_ms?: number | null
  error_message?: string | null
  started_at?: string | null
  completed_at?: string | null
  attempts?: number
  last_error_step?: string | null
}

export interface IngestionProgressEvent {
  event_id: string
  seq_num: number
  task_id: string
  document_id: string
  project_id: string
  status: IngestionTaskState
  actual_progress: number
  current_step?: string | null
  stage_label?: string | null
  processed_units?: number | null
  total_units?: number | null
  unit_name?: string | null
  step_upper_bound?: number | null
  estimated_duration_ms?: number | null
  error_message?: string | null
  timestamp: string
}


export interface BatchUploadResultItem {
  file_name: string
  success: boolean
  data?: DocumentUploadResponse
  error?: string
}

export interface BatchUploadResponse {
  success: boolean
  total: number
  results: BatchUploadResultItem[]
}

export interface UploadQueueItem {
  id: string
  file: File
  name: string
  size: number
  status: 'queued' | 'uploading' | 'parsing' | 'indexing' | 'completed' | 'failed'
  progress: number
  actualProgress?: number
  taskId?: string
  documentId?: string
  error?: string
  stage?: string
  processedUnits?: number
  totalUnits?: number
  unitName?: string
  stepUpperBound?: number
  lastSeqNum?: number
  lastUpdatedAt?: number
}

export interface ProjectIngestionStats {
  total_documents: number
  total_chunks: number
  total_size_bytes: number
  dedup_ratio: number
  saved_chunks: number
  status_breakdown: {
    completed: number
    processing: number
    failed: number
    pending: number
  }
  last_synced_at?: string | null
}

export interface BatchDeleteResponse {
  success: boolean
  deleted_count: number
  deleted_document_ids: string[]
  message: string
}

export interface ReindexResponse {
  task_id?: string
  document_id?: string
  project_id?: string
  task_ids?: string[]
  total_queued?: number
  status?: string
}

