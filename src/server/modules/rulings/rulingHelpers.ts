import { getPool, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { fromIdBuffer } from '../../platform/uuidv7';
import { JudicialRuling, RulingDiscussionItem, RulingsPortalConfig } from '../../../types';

export const DEFAULT_RULINGS_PORTAL_CONFIG: RulingsPortalConfig = {
  layoutMode: 'editorial_split',
  globalCommentsEnabled: true,
  showCreatedAt: true,
  showReviewedAt: true,
  showKeywords: true,
  showPrinciples: true,
  showSummary: true,
  showAttachments: true,
  portalTitle: 'تالار رأی قضایی، نقد علمی و مباحثات فقهی',
  portalSubtitle: 'مطالعه آراء مدلل، استنادات فقهی-حقوقی و گفت‌وگوی تخصصی قضات و پژوهشگران',
  internalTagDefinitions: [
    { id: 'tag_reviewed', label: 'بررسی شد', colorScheme: 'emerald', styleVariant: 'solid', scope: 'internal' },
    { id: 'tag_incomplete', label: 'بررسی ناقص', colorScheme: 'rose', styleVariant: 'soft', scope: 'internal' },
    { id: 'tag_selected', label: 'منتخب', colorScheme: 'amber', styleVariant: 'solid', scope: 'internal' },
    { id: 'tag_showcase', label: 'مناسب ویترین', colorScheme: 'indigo', styleVariant: 'soft', scope: 'internal' },
    { id: 'tag_legacy', label: 'قدیمی', colorScheme: 'slate', styleVariant: 'outline', scope: 'internal' },
    { id: 'tag_used', label: 'استفاده شده در سامانه', colorScheme: 'sky', styleVariant: 'soft', scope: 'internal' },
  ],
  publicLabelDefinitions: [
    { id: 'pub_pick', label: 'برگزیده سامانه', colorScheme: 'amber', styleVariant: 'solid', scope: 'public' },
    { id: 'pub_unity', label: 'رأی وحدت رویه', colorScheme: 'emerald', styleVariant: 'soft', scope: 'public' },
    { id: 'pub_analytical', label: 'تحلیل نوآورانه', colorScheme: 'indigo', styleVariant: 'soft', scope: 'public' },
    { id: 'pub_practical', label: 'کاربردی در شعب', colorScheme: 'sky', styleVariant: 'outline', scope: 'public' },
  ],
  version: 1,
};

export function parseJsonArray<T = any>(val: any, fallback: T[] = []): T[] {
  if (Array.isArray(val)) return val as T[];
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? (parsed as T[]) : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function mapDiscussionRow(row: any): RulingDiscussionItem {
  return {
    id: fromIdBuffer(row.id),
    authorId: row.author_id ? fromIdBuffer(row.author_id) : undefined,
    authorName: row.author_name,
    authorRoleTitle: row.author_role_title,
    comment: row.comment,
    isFeatured: Boolean(row.is_featured),
    timestamp: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    editedAt: row.edited_at ? new Date(row.edited_at).toISOString() : undefined,
  };
}

export function mapRulingRow(
  row: any,
  discussions: RulingDiscussionItem[] = [],
  includeInternalForStaff = true
): JudicialRuling & { version: number } {
  const legalPrinciples = parseJsonArray<string>(row.legal_principles, []);
  const keywords = parseJsonArray<string>(row.keywords, []);
  const attachments = parseJsonArray<string>(row.attachments, []);
  const adminTags = parseJsonArray<string>(row.admin_tags, []);
  const publicLabels = parseJsonArray<string>(row.public_labels, []);
  const likedBy = parseJsonArray<string>(row.liked_by, []);
  const dislikedBy = parseJsonArray<string>(row.disliked_by, []);
  const highlights = parseJsonArray<any>(row.highlights, []);

  // Preserve historical published rows where is_visible_to_alumni wasn't explicitly 0
  const isVisibleToAlumni =
    row.is_visible_to_alumni === undefined || row.is_visible_to_alumni === null
      ? row.status === 'selected'
      : Boolean(row.is_visible_to_alumni);

  const mapped: JudicialRuling & { version: number } = {
    id: fromIdBuffer(row.id),
    title: row.title || '',
    courtBranch: row.court_branch || '',
    judgeName: row.judge_name || '',
    rulingDate: row.ruling_date || '',
    caseType: row.case_type || 'commercial',
    caseTypeTitle: row.case_type_title || 'حقوقی و تجاری',
    summary: row.summary || '',
    legalPrinciples,
    keywords,
    attachments,
    publicLabels,
    isSystemPick: Boolean(row.is_system_pick),
    isVisibleToAlumni,
    commentsEnabled:
      row.comments_enabled === undefined || row.comments_enabled === null
        ? true
        : Boolean(row.comments_enabled),
    displayOrder: Number(row.display_order || 0),
    fullRulingText: row.full_ruling_text || '',
    status: row.status || 'pending_review',
    submittedById: row.submitted_by_id ? fromIdBuffer(row.submitted_by_id) : '',
    submittedByName: row.submitted_by_name || '',
    likesCount: Number(row.likes_count || 0),
    likedBy,
    dislikesCount: Number(row.dislikes_count || 0),
    dislikedBy,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : undefined,
    reviewedByName: row.reviewed_by_name || undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    highlights,
    discussions,
    version: Number(row.version || 1),
  };

  if (includeInternalForStaff) {
    mapped.adminTags = adminTags;
    mapped.internalReviewNote = row.internal_review_note || undefined;
  }

  return mapped;
}

export async function loadRulingsPortalConfig(): Promise<RulingsPortalConfig> {
  ensureDatabaseConnection();
  await ensureDomainTablesAndIndexes();
  const p = getPool();
  const [rows]: any = await p.query(
    `SELECT setting_value, version FROM system_settings WHERE setting_key = 'rulings_portal_config' LIMIT 1`
  );
  if (!rows || rows.length === 0) {
    await p.query(
      `INSERT IGNORE INTO system_settings (setting_key, setting_value, description, version)
       VALUES ('rulings_portal_config', ?, 'تنظیمات تالار رأی قضایی، چیدمان و برچسب‌ها', 1)`,
      [JSON.stringify(DEFAULT_RULINGS_PORTAL_CONFIG)]
    );
    return { ...DEFAULT_RULINGS_PORTAL_CONFIG, version: 1 };
  }

  let parsed: any = rows[0].setting_value;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = {};
    }
  }
  return {
    ...DEFAULT_RULINGS_PORTAL_CONFIG,
    ...(parsed || {}),
    internalTagDefinitions: Array.isArray(parsed?.internalTagDefinitions)
      ? parsed.internalTagDefinitions
      : DEFAULT_RULINGS_PORTAL_CONFIG.internalTagDefinitions,
    publicLabelDefinitions: Array.isArray(parsed?.publicLabelDefinitions)
      ? parsed.publicLabelDefinitions
      : DEFAULT_RULINGS_PORTAL_CONFIG.publicLabelDefinitions,
    version: Number(rows[0].version || 1),
  };
}

export function sanitizePortalConfigForAlumni(config: RulingsPortalConfig): RulingsPortalConfig {
  return {
    ...config,
    internalTagDefinitions: [],
  };
}
