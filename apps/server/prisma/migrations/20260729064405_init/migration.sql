-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "bindColumnIds" TEXT NOT NULL DEFAULT '[]',
    "unionId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminToken" (
    "id" SERIAL NOT NULL,
    "adminId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AdminToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "adminId" INTEGER,
    "username" TEXT,
    "role" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" INTEGER,
    "ip" TEXT,
    "userAgent" TEXT,
    "detail" TEXT,
    "isViolation" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Column" (
    "id" SERIAL NOT NULL,
    "parentId" INTEGER,
    "columnName" TEXT NOT NULL,
    "columnSlug" TEXT NOT NULL,
    "responsibleBusiness" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Column_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" SERIAL NOT NULL,
    "columnId" INTEGER NOT NULL,
    "articleSlug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "encryptedContent" TEXT,
    "summary" TEXT,
    "coverImageUrl" TEXT,
    "source" TEXT,
    "responsibleBusiness" TEXT,
    "authorId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "secretLevel" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "businessTags" TEXT NOT NULL DEFAULT '[]',
    "roleTags" TEXT NOT NULL DEFAULT '[]',
    "timeTags" TEXT NOT NULL DEFAULT '[]',
    "reviewerId" INTEGER,
    "reviewComment" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "finalReviewerId" INTEGER,
    "finalReviewComment" TEXT,
    "finalReviewedAt" TIMESTAMP(3),
    "rejectCount" INTEGER NOT NULL DEFAULT 0,
    "isTop" BOOLEAN NOT NULL DEFAULT false,
    "pinLevel" TEXT,
    "pinExpireAt" TIMESTAMP(3),
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "scheduledPublishAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" INTEGER,
    "receiverId" INTEGER,
    "receiverRole" TEXT,
    "receiverDeptId" INTEGER,
    "bizType" TEXT,
    "bizId" INTEGER,
    "articleId" INTEGER,
    "action" TEXT,
    "actorId" INTEGER,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "permissions" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" SERIAL NOT NULL,
    "articleId" INTEGER,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensitiveWord" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "replacement" TEXT NOT NULL DEFAULT '***',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SensitiveWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskControlLog" (
    "id" SERIAL NOT NULL,
    "sourceType" TEXT NOT NULL,
    "userId" INTEGER,
    "ipAddress" TEXT,
    "contentSnapshot" TEXT,
    "matchedWords" TEXT,
    "action" TEXT NOT NULL,
    "articleId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskControlLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SysRsaKey" (
    "id" SERIAL NOT NULL,
    "version" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "privateKeyEnc" TEXT NOT NULL,
    "keyIv" TEXT NOT NULL,
    "keyAuthTag" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "SysRsaKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileResource" (
    "id" SERIAL NOT NULL,
    "file_name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_format" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "column_id" INTEGER,
    "article_id" INTEGER,
    "category" TEXT,
    "uploader_id" INTEGER NOT NULL,
    "access_level" TEXT NOT NULL DEFAULT 'PUBLIC',
    "secret_level" TEXT NOT NULL DEFAULT 'NORMAL',
    "internal_tags" TEXT,
    "risk_note" TEXT,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "preview_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "preview_enabled" BOOLEAN NOT NULL DEFAULT true,
    "preview_cache_key" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatSearchKeyword" (
    "id" SERIAL NOT NULL,
    "keyword" TEXT NOT NULL,
    "stat_date" TIMESTAMP(3) NOT NULL,
    "search_count" INTEGER NOT NULL DEFAULT 0,
    "result_count" INTEGER NOT NULL DEFAULT 0,
    "user_type" TEXT NOT NULL DEFAULT 'anonymous',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatSearchKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" SERIAL NOT NULL,
    "inquiry_no" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "business_tag" TEXT NOT NULL,
    "submitter_name" TEXT NOT NULL,
    "submitter_contact" TEXT NOT NULL,
    "submitter_type" TEXT NOT NULL,
    "submitter_user_id" INTEGER,
    "assignee_id" INTEGER,
    "assignee_dept_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reply_content" TEXT,
    "reply_by" INTEGER,
    "reply_at" TIMESTAMP(3),
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "deadline_at" TIMESTAMP(3) NOT NULL,
    "is_timeout" BOOLEAN NOT NULL DEFAULT false,
    "warning_sent" BOOLEAN NOT NULL DEFAULT false,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryRoutingConfig" (
    "id" SERIAL NOT NULL,
    "business_tag" TEXT NOT NULL,
    "assignee_id" INTEGER,
    "assignee_dept_id" INTEGER,
    "timeout_hours" INTEGER NOT NULL DEFAULT 72,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InquiryRoutingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "union_id" TEXT NOT NULL,
    "sso_user_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SsoUserBinding" (
    "id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "union_id" TEXT NOT NULL,
    "sso_user_type" TEXT NOT NULL,
    "sso_name" TEXT,
    "sso_department" TEXT,
    "bind_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bind_source" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "SsoUserBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SsoConfig" (
    "id" SERIAL NOT NULL,
    "config_key" TEXT NOT NULL,
    "config_value" TEXT NOT NULL,
    "config_type" TEXT NOT NULL DEFAULT 'STRING',
    "description" TEXT,
    "is_encrypted" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SsoConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatRawEvent" (
    "id" SERIAL NOT NULL,
    "event_type" TEXT NOT NULL,
    "user_id" INTEGER,
    "session_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "column_id" INTEGER,
    "article_id" INTEGER,
    "attachment_id" INTEGER,
    "search_keyword" TEXT,
    "referer" TEXT,
    "device_type" TEXT,
    "event_time" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatRawEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatColumnAccess" (
    "id" SERIAL NOT NULL,
    "column_id" INTEGER NOT NULL,
    "stat_date" TIMESTAMP(3) NOT NULL,
    "stat_hour" INTEGER,
    "pv_count" INTEGER NOT NULL DEFAULT 0,
    "uv_count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatColumnAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatArticleRank" (
    "id" SERIAL NOT NULL,
    "article_id" INTEGER NOT NULL,
    "column_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "stat_date" TIMESTAMP(3) NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "unique_viewers" INTEGER NOT NULL DEFAULT 0,
    "total_view_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatArticleRank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatAttachmentDownload" (
    "id" SERIAL NOT NULL,
    "attachment_id" INTEGER NOT NULL,
    "article_id" INTEGER,
    "column_id" INTEGER,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "stat_date" TIMESTAMP(3) NOT NULL,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "total_download_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StatAttachmentDownload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageCarousel" (
    "id" SERIAL NOT NULL,
    "position_code" TEXT NOT NULL,
    "article_id" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "cover_image_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageCarousel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideItem" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "target_audience" TEXT NOT NULL,
    "business_tag" TEXT NOT NULL,
    "target_object" TEXT NOT NULL,
    "process_steps" TEXT NOT NULL,
    "required_materials" TEXT NOT NULL,
    "time_limit" TEXT NOT NULL,
    "time_limit_days" INTEGER,
    "contact_dept" TEXT NOT NULL,
    "contact_phone" TEXT,
    "contact_address" TEXT,
    "contact_email" TEXT,
    "related_attachments" TEXT NOT NULL DEFAULT '[]',
    "hall_code" TEXT,
    "hall_link" TEXT,
    "contact_person_id" INTEGER,
    "column_id" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "GuideItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Survey" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "survey_type" TEXT NOT NULL DEFAULT 'GENERAL',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "template_id" INTEGER,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "allow_save" BOOLEAN NOT NULL DEFAULT true,
    "max_submit" INTEGER NOT NULL DEFAULT 1,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "cover_image" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyQuestion" (
    "id" SERIAL NOT NULL,
    "survey_id" INTEGER NOT NULL,
    "question_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "options" TEXT,
    "rating_max" INTEGER NOT NULL DEFAULT 5,
    "matrix_rows" TEXT,
    "matrix_columns" TEXT,
    "logic_rules" TEXT,
    "validation_rules" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyDistribution" (
    "id" SERIAL NOT NULL,
    "survey_id" INTEGER NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "share_link" TEXT,
    "access_code" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" SERIAL NOT NULL,
    "survey_id" INTEGER NOT NULL,
    "respondent_id" INTEGER,
    "respondent_name" TEXT,
    "respondent_ip" TEXT,
    "submit_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration_seconds" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyAnswer" (
    "id" SERIAL NOT NULL,
    "response_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "answer_value" TEXT,
    "answer_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "template_type" TEXT NOT NULL,
    "questions_json" TEXT NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE INDEX "Admin_username_idx" ON "Admin"("username");

-- CreateIndex
CREATE INDEX "Admin_role_idx" ON "Admin"("role");

-- CreateIndex
CREATE INDEX "Admin_status_idx" ON "Admin"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AdminToken_token_key" ON "AdminToken"("token");

-- CreateIndex
CREATE INDEX "AdminToken_token_idx" ON "AdminToken"("token");

-- CreateIndex
CREATE INDEX "AdminToken_adminId_idx" ON "AdminToken"("adminId");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_idx" ON "AuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_isViolation_idx" ON "AuditLog"("isViolation");

-- CreateIndex
CREATE UNIQUE INDEX "Column_columnSlug_key" ON "Column"("columnSlug");

-- CreateIndex
CREATE INDEX "Column_parentId_idx" ON "Column"("parentId");

-- CreateIndex
CREATE INDEX "Column_columnSlug_idx" ON "Column"("columnSlug");

-- CreateIndex
CREATE INDEX "Column_status_idx" ON "Column"("status");

-- CreateIndex
CREATE INDEX "Column_responsibleBusiness_idx" ON "Column"("responsibleBusiness");

-- CreateIndex
CREATE INDEX "Column_visibility_idx" ON "Column"("visibility");

-- CreateIndex
CREATE UNIQUE INDEX "Article_articleSlug_key" ON "Article"("articleSlug");

-- CreateIndex
CREATE INDEX "Article_columnId_idx" ON "Article"("columnId");

-- CreateIndex
CREATE INDEX "Article_authorId_idx" ON "Article"("authorId");

-- CreateIndex
CREATE INDEX "Article_status_idx" ON "Article"("status");

-- CreateIndex
CREATE INDEX "Article_type_idx" ON "Article"("type");

-- CreateIndex
CREATE INDEX "Article_secretLevel_idx" ON "Article"("secretLevel");

-- CreateIndex
CREATE INDEX "Article_visibility_idx" ON "Article"("visibility");

-- CreateIndex
CREATE INDEX "Article_articleSlug_idx" ON "Article"("articleSlug");

-- CreateIndex
CREATE INDEX "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_columnId_status_publishedAt_idx" ON "Article"("columnId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_responsibleBusiness_idx" ON "Article"("responsibleBusiness");

-- CreateIndex
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");

-- CreateIndex
CREATE INDEX "Message_type_idx" ON "Message"("type");

-- CreateIndex
CREATE INDEX "Message_isRead_idx" ON "Message"("isRead");

-- CreateIndex
CREATE INDEX "Message_articleId_idx" ON "Message"("articleId");

-- CreateIndex
CREATE INDEX "Message_receiverRole_idx" ON "Message"("receiverRole");

-- CreateIndex
CREATE INDEX "Message_bizType_idx" ON "Message"("bizType");

-- CreateIndex
CREATE INDEX "Message_bizId_idx" ON "Message"("bizId");

-- CreateIndex
CREATE INDEX "Message_priority_idx" ON "Message"("priority");

-- CreateIndex
CREATE INDEX "Message_isDeleted_idx" ON "Message"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_key" ON "RolePermission"("role");

-- CreateIndex
CREATE INDEX "RolePermission_role_idx" ON "RolePermission"("role");

-- CreateIndex
CREATE INDEX "Attachment_articleId_idx" ON "Attachment"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "SensitiveWord_word_key" ON "SensitiveWord"("word");

-- CreateIndex
CREATE INDEX "SensitiveWord_level_idx" ON "SensitiveWord"("level");

-- CreateIndex
CREATE INDEX "SensitiveWord_category_idx" ON "SensitiveWord"("category");

-- CreateIndex
CREATE INDEX "SensitiveWord_isActive_idx" ON "SensitiveWord"("isActive");

-- CreateIndex
CREATE INDEX "SensitiveWord_word_idx" ON "SensitiveWord"("word");

-- CreateIndex
CREATE INDEX "RiskControlLog_sourceType_idx" ON "RiskControlLog"("sourceType");

-- CreateIndex
CREATE INDEX "RiskControlLog_userId_idx" ON "RiskControlLog"("userId");

-- CreateIndex
CREATE INDEX "RiskControlLog_action_idx" ON "RiskControlLog"("action");

-- CreateIndex
CREATE INDEX "RiskControlLog_createdAt_idx" ON "RiskControlLog"("createdAt");

-- CreateIndex
CREATE INDEX "RiskControlLog_articleId_idx" ON "RiskControlLog"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "SysRsaKey_version_key" ON "SysRsaKey"("version");

-- CreateIndex
CREATE INDEX "SysRsaKey_isActive_idx" ON "SysRsaKey"("isActive");

-- CreateIndex
CREATE INDEX "FileResource_column_id_idx" ON "FileResource"("column_id");

-- CreateIndex
CREATE INDEX "FileResource_article_id_idx" ON "FileResource"("article_id");

-- CreateIndex
CREATE INDEX "FileResource_uploader_id_idx" ON "FileResource"("uploader_id");

-- CreateIndex
CREATE INDEX "FileResource_access_level_idx" ON "FileResource"("access_level");

-- CreateIndex
CREATE INDEX "FileResource_secret_level_idx" ON "FileResource"("secret_level");

-- CreateIndex
CREATE INDEX "FileResource_status_idx" ON "FileResource"("status");

-- CreateIndex
CREATE INDEX "FileResource_file_format_idx" ON "FileResource"("file_format");

-- CreateIndex
CREATE INDEX "FileResource_category_idx" ON "FileResource"("category");

-- CreateIndex
CREATE INDEX "StatSearchKeyword_stat_date_idx" ON "StatSearchKeyword"("stat_date");

-- CreateIndex
CREATE INDEX "StatSearchKeyword_search_count_idx" ON "StatSearchKeyword"("search_count");

-- CreateIndex
CREATE UNIQUE INDEX "StatSearchKeyword_keyword_stat_date_key" ON "StatSearchKeyword"("keyword", "stat_date");

-- CreateIndex
CREATE UNIQUE INDEX "Inquiry_inquiry_no_key" ON "Inquiry"("inquiry_no");

-- CreateIndex
CREATE INDEX "Inquiry_status_idx" ON "Inquiry"("status");

-- CreateIndex
CREATE INDEX "Inquiry_business_tag_idx" ON "Inquiry"("business_tag");

-- CreateIndex
CREATE INDEX "Inquiry_assignee_id_idx" ON "Inquiry"("assignee_id");

-- CreateIndex
CREATE INDEX "Inquiry_submitter_type_idx" ON "Inquiry"("submitter_type");

-- CreateIndex
CREATE INDEX "Inquiry_is_timeout_idx" ON "Inquiry"("is_timeout");

-- CreateIndex
CREATE INDEX "Inquiry_is_public_idx" ON "Inquiry"("is_public");

-- CreateIndex
CREATE INDEX "Inquiry_created_at_idx" ON "Inquiry"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "InquiryRoutingConfig_business_tag_key" ON "InquiryRoutingConfig"("business_tag");

-- CreateIndex
CREATE INDEX "InquiryRoutingConfig_business_tag_idx" ON "InquiryRoutingConfig"("business_tag");

-- CreateIndex
CREATE UNIQUE INDEX "User_union_id_key" ON "User"("union_id");

-- CreateIndex
CREATE INDEX "User_union_id_idx" ON "User"("union_id");

-- CreateIndex
CREATE INDEX "User_sso_user_type_idx" ON "User"("sso_user_type");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "SsoUserBinding_admin_id_idx" ON "SsoUserBinding"("admin_id");

-- CreateIndex
CREATE INDEX "SsoUserBinding_union_id_idx" ON "SsoUserBinding"("union_id");

-- CreateIndex
CREATE INDEX "SsoUserBinding_sso_user_type_idx" ON "SsoUserBinding"("sso_user_type");

-- CreateIndex
CREATE INDEX "SsoUserBinding_status_idx" ON "SsoUserBinding"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SsoUserBinding_union_id_key" ON "SsoUserBinding"("union_id");

-- CreateIndex
CREATE UNIQUE INDEX "SsoUserBinding_admin_id_key" ON "SsoUserBinding"("admin_id");

-- CreateIndex
CREATE UNIQUE INDEX "SsoConfig_config_key_key" ON "SsoConfig"("config_key");

-- CreateIndex
CREATE INDEX "SsoConfig_config_key_idx" ON "SsoConfig"("config_key");

-- CreateIndex
CREATE INDEX "StatRawEvent_event_type_idx" ON "StatRawEvent"("event_type");

-- CreateIndex
CREATE INDEX "StatRawEvent_column_id_idx" ON "StatRawEvent"("column_id");

-- CreateIndex
CREATE INDEX "StatRawEvent_article_id_idx" ON "StatRawEvent"("article_id");

-- CreateIndex
CREATE INDEX "StatRawEvent_event_time_idx" ON "StatRawEvent"("event_time");

-- CreateIndex
CREATE INDEX "StatRawEvent_session_id_idx" ON "StatRawEvent"("session_id");

-- CreateIndex
CREATE INDEX "StatColumnAccess_column_id_idx" ON "StatColumnAccess"("column_id");

-- CreateIndex
CREATE INDEX "StatColumnAccess_stat_date_idx" ON "StatColumnAccess"("stat_date");

-- CreateIndex
CREATE UNIQUE INDEX "StatColumnAccess_column_id_stat_date_stat_hour_key" ON "StatColumnAccess"("column_id", "stat_date", "stat_hour");

-- CreateIndex
CREATE INDEX "StatArticleRank_article_id_idx" ON "StatArticleRank"("article_id");

-- CreateIndex
CREATE INDEX "StatArticleRank_column_id_idx" ON "StatArticleRank"("column_id");

-- CreateIndex
CREATE INDEX "StatArticleRank_stat_date_idx" ON "StatArticleRank"("stat_date");

-- CreateIndex
CREATE INDEX "StatArticleRank_view_count_idx" ON "StatArticleRank"("view_count");

-- CreateIndex
CREATE UNIQUE INDEX "StatArticleRank_article_id_stat_date_key" ON "StatArticleRank"("article_id", "stat_date");

-- CreateIndex
CREATE INDEX "StatAttachmentDownload_attachment_id_idx" ON "StatAttachmentDownload"("attachment_id");

-- CreateIndex
CREATE INDEX "StatAttachmentDownload_column_id_idx" ON "StatAttachmentDownload"("column_id");

-- CreateIndex
CREATE INDEX "StatAttachmentDownload_stat_date_idx" ON "StatAttachmentDownload"("stat_date");

-- CreateIndex
CREATE INDEX "StatAttachmentDownload_download_count_idx" ON "StatAttachmentDownload"("download_count");

-- CreateIndex
CREATE UNIQUE INDEX "StatAttachmentDownload_attachment_id_stat_date_key" ON "StatAttachmentDownload"("attachment_id", "stat_date");

-- CreateIndex
CREATE INDEX "HomepageCarousel_position_code_idx" ON "HomepageCarousel"("position_code");

-- CreateIndex
CREATE INDEX "HomepageCarousel_sort_order_idx" ON "HomepageCarousel"("sort_order");

-- CreateIndex
CREATE INDEX "HomepageCarousel_status_idx" ON "HomepageCarousel"("status");

-- CreateIndex
CREATE UNIQUE INDEX "HomepageCarousel_position_code_article_id_key" ON "HomepageCarousel"("position_code", "article_id");

-- CreateIndex
CREATE UNIQUE INDEX "GuideItem_slug_key" ON "GuideItem"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "GuideItem_hall_code_key" ON "GuideItem"("hall_code");

-- CreateIndex
CREATE INDEX "GuideItem_slug_idx" ON "GuideItem"("slug");

-- CreateIndex
CREATE INDEX "GuideItem_target_audience_idx" ON "GuideItem"("target_audience");

-- CreateIndex
CREATE INDEX "GuideItem_business_tag_idx" ON "GuideItem"("business_tag");

-- CreateIndex
CREATE INDEX "GuideItem_status_idx" ON "GuideItem"("status");

-- CreateIndex
CREATE INDEX "GuideItem_column_id_idx" ON "GuideItem"("column_id");

-- CreateIndex
CREATE INDEX "GuideItem_sort_order_idx" ON "GuideItem"("sort_order");

-- CreateIndex
CREATE INDEX "GuideItem_created_by_idx" ON "GuideItem"("created_by");

-- CreateIndex
CREATE INDEX "GuideItem_target_audience_business_tag_status_idx" ON "GuideItem"("target_audience", "business_tag", "status");

-- CreateIndex
CREATE INDEX "Survey_status_idx" ON "Survey"("status");

-- CreateIndex
CREATE INDEX "Survey_created_by_idx" ON "Survey"("created_by");

-- CreateIndex
CREATE INDEX "Survey_created_at_idx" ON "Survey"("created_at");

-- CreateIndex
CREATE INDEX "Survey_survey_type_idx" ON "Survey"("survey_type");

-- CreateIndex
CREATE INDEX "SurveyQuestion_survey_id_idx" ON "SurveyQuestion"("survey_id");

-- CreateIndex
CREATE INDEX "SurveyQuestion_survey_id_sort_order_idx" ON "SurveyQuestion"("survey_id", "sort_order");

-- CreateIndex
CREATE INDEX "SurveyDistribution_survey_id_idx" ON "SurveyDistribution"("survey_id");

-- CreateIndex
CREATE INDEX "SurveyResponse_survey_id_idx" ON "SurveyResponse"("survey_id");

-- CreateIndex
CREATE INDEX "SurveyResponse_respondent_id_idx" ON "SurveyResponse"("respondent_id");

-- CreateIndex
CREATE INDEX "SurveyResponse_submit_time_idx" ON "SurveyResponse"("submit_time");

-- CreateIndex
CREATE INDEX "SurveyAnswer_response_id_idx" ON "SurveyAnswer"("response_id");

-- CreateIndex
CREATE INDEX "SurveyAnswer_question_id_idx" ON "SurveyAnswer"("question_id");

-- CreateIndex
CREATE INDEX "SurveyTemplate_template_type_idx" ON "SurveyTemplate"("template_type");

-- AddForeignKey
ALTER TABLE "AdminToken" ADD CONSTRAINT "AdminToken_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Column" ADD CONSTRAINT "Column_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Column"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "Column"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SsoUserBinding" ADD CONSTRAINT "SsoUserBinding_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomepageCarousel" ADD CONSTRAINT "HomepageCarousel_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomepageCarousel" ADD CONSTRAINT "HomepageCarousel_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "FileResource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideItem" ADD CONSTRAINT "GuideItem_column_id_fkey" FOREIGN KEY ("column_id") REFERENCES "Column"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyQuestion" ADD CONSTRAINT "SurveyQuestion_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyDistribution" ADD CONSTRAINT "SurveyDistribution_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyAnswer" ADD CONSTRAINT "SurveyAnswer_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "SurveyResponse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyAnswer" ADD CONSTRAINT "SurveyAnswer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "SurveyQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
