import { Router, Request, Response } from 'express';
import { getCurrentUser } from '../../platform/sessionAuth';
import { AuthorizationPolicy, isOrganizationalUserRole } from '../../platform/authorization';
import { AppError } from '../../platform/errors';
import { userRepository } from './userRepository';
import { adminSettingsRepo } from '../admin/adminSettingsRepository';
import { sanitizeUserForApi } from '../admin/adminModule';
import { extractExpectedVersion } from '../../platform/httpUtils';
import { outbox } from '../../platform/outbox';
import { auditChain } from '../../platform/auditChain';
import { AlumniProfileSettingsConfig } from '../../../types';
import { normalizeDigits } from '../../platform/persianNormalizer';

const SETTINGS_KEY = 'alumni_profile_settings';

const DEFAULT_PROFILE_SETTINGS: AlumniProfileSettingsConfig = {
  allowAlumniProfileCompletion: true,
  noticeText: 'تکمیل و ویرایش اطلاعات هویتی و سوابق علمی در این بخش با تایید مدیریت مرکز فعال است. چهار فیلد هویتی پایه (نام، کد ملی، شماره تماس و کد مرکز) همواره فقط خواندنی هستند.',
  version: 1,
};

const SELF_SERVICE_IDENTITY_FIELDS = new Set([
  'siteTitle',
  'profilePictureUrl',
  'email',
  'birthDate',
  'fatherName',
  'idNumber',
  'maritalStatus',
  'childrenCount',
  'residentialAddress',
  'academicDegree',
  'thesisTitle',
  'supervisorProfessor',
  'seminaryLevel',
  'seminarySchool',
  'universityDegree',
  'universityName',
  'fieldOfStudy',
  'academicHonors',
  'associationMembershipDate',
  'associationResponsibility',
  'associationContributions',
  'personnelId',
  'judicialGrade',
  'courtBranch',
  'province',
  'employmentStatus',
  'currentJudicialPost',
  'serviceYears',
  'judicialSpecialty',
  'organization',
  'graduationYear',
]);

async function loadProfileSettings(): Promise<AlumniProfileSettingsConfig> {
  const record = await adminSettingsRepo.getRecord<AlumniProfileSettingsConfig>(SETTINGS_KEY);
  if (!record) {
    return { ...DEFAULT_PROFILE_SETTINGS };
  }
  return {
    ...DEFAULT_PROFILE_SETTINGS,
    ...(record.value || {}),
    version: record.version || 1,
    updatedBy: record.lastModifiedBy || record.value?.updatedBy,
    updatedAt: record.updatedAt || record.value?.updatedAt,
  };
}

export function createUserRouter(): Router {
  const router = Router();

  // Global Toggle Read (All authenticated users)
  router.get('/alumni-profile-settings', async (req: Request, res: Response, next) => {
    try {
      getCurrentUser(req);
      const settings = await loadProfileSettings();
      res.json(settings);
    } catch (err) {
      next(err);
    }
  });

  // Global Toggle Update (Admin / Alumni Manager Only, Strict OCC)
  router.put('/alumni-profile-settings', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        ['admin', 'super_admin', 'alumni_manager', 'supervisor']
      );

      const expectedVersion = extractExpectedVersion(req, false);
      const existingRecord = await adminSettingsRepo.getRecord<AlumniProfileSettingsConfig>(SETTINGS_KEY);

      if (existingRecord && expectedVersion !== undefined && Number(existingRecord.version) !== Number(expectedVersion)) {
        throw AppError.conflict(
          'تنظیمات تکمیل اطلاعات دانش‌آموختگان هم‌زمان توسط مدیر دیگری تغییر یافته است.',
          'CONCURRENT_MODIFICATION_CONFLICT'
        );
      }

      const nextValue: AlumniProfileSettingsConfig = {
        allowAlumniProfileCompletion: Boolean(req.body?.allowAlumniProfileCompletion),
        noticeText: typeof req.body?.noticeText === 'string' ? req.body.noticeText.trim() : DEFAULT_PROFILE_SETTINGS.noticeText,
        updatedBy: u.fullName,
        updatedAt: new Date().toISOString(),
        version: existingRecord ? Number(existingRecord.version) + 1 : 1,
      };

      let finalVersion = 1;
      if (existingRecord) {
        const baseVer = expectedVersion !== undefined ? Number(expectedVersion) : Number(existingRecord.version);
        const upd = await adminSettingsRepo.updateOptimistic(SETTINGS_KEY, nextValue, baseVer, u.fullName);
        finalVersion = upd.newVersion;
      } else {
        await adminSettingsRepo.saveSetting(SETTINGS_KEY, nextValue, 'Alumni Identity Card Completion Toggle', u.fullName);
        finalVersion = 1;
      }

      const savedSettings: AlumniProfileSettingsConfig = {
        ...nextValue,
        version: finalVersion,
      };

      outbox.enqueue('user.alumni_profile_settings_updated', {
        resourceId: SETTINGS_KEY,
        version: finalVersion,
        updates: savedSettings,
        actorId: u.id,
        actorName: u.fullName,
      });

      auditChain.appendEntry({
        eventType: 'SYSTEM_CONFIG_UPDATED',
        actorId: u.id,
        actorName: u.fullName,
        actorRole: u.role,
        ip: req.ip || '127.0.0.1',
        details: `امکان تکمیل اطلاعات هویتی توسط دانش‌آموختگان به حالت [${savedSettings.allowAlumniProfileCompletion ? 'فعال' : 'غیرفعال'}] تغییر یافت.`,
        severity: 'warning',
      });

      res.json(savedSettings);
    } catch (err) {
      next(err);
    }
  });

  // Self-Service Identity Card Read
  router.get('/me/identity', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const [dbUser, settings] = await Promise.all([
        userRepository.findById(u.id),
        loadProfileSettings(),
      ]);

      if (!dbUser) {
        throw AppError.notFound('پروفایل کاربری');
      }

      res.json({
        user: sanitizeUserForApi(dbUser),
        settings,
      });
    } catch (err) {
      next(err);
    }
  });

  // Self-Service Identity Card Update (Strict 4-core-field lock + Admin Completion Toggle + OCC)
  router.put('/me/identity', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const settings = await loadProfileSettings();
      const isOfficial = isOrganizationalUserRole(u.role);

      if (!isOfficial && !settings.allowAlumniProfileCompletion) {
        throw AppError.forbidden(
          'امکان تکمیل و ویرایش اطلاعات هویتی در حال حاضر توسط مدیریت مرکز غیرفعال شده است.',
          'ALUMNI_PROFILE_COMPLETION_DISABLED'
        );
      }

      const dbUser = await userRepository.findById(u.id);
      if (!dbUser) {
        throw AppError.notFound('کاربر');
      }

      const expectedVersion = extractExpectedVersion(req, true);
      const body = req.body || {};

      // Enforce immutable core identity fields for non-officials
      const forbiddenCoreFields = ['fullName', 'nationalId', 'phone', 'centerCode'];
      if (!isOfficial) {
        for (const f of forbiddenCoreFields) {
          if (body[f] !== undefined && String(body[f]).trim() !== String((dbUser as any)[f] || '').trim()) {
            throw AppError.forbidden(
              'چهار فیلد پایه هویتی (نام و نام خانوادگی، کد ملی، شماره تماس و کد مرکز) صرفاً توسط مدیر سامانه قابل تغییر است.',
              'CORE_IDENTITY_FIELD_LOCKED'
            );
          }
        }
      }

      const filteredUpdates: Record<string, any> = {};
      for (const [key, val] of Object.entries(body)) {
        if (SELF_SERVICE_IDENTITY_FIELDS.has(key) && val !== undefined) {
          if (typeof val === 'string') {
            filteredUpdates[key] = key === 'graduationYear' ? normalizeDigits(val).trim() : val.trim();
          } else {
            filteredUpdates[key] = val;
          }
        }
      }

      if (Object.keys(filteredUpdates).length === 0) {
        res.json({
          user: sanitizeUserForApi(dbUser),
          settings,
        });
        return;
      }

      const updatedUser = await userRepository.updateUserOptimistic(u.id, filteredUpdates, expectedVersion);
      const sanitized = sanitizeUserForApi(updatedUser);

      outbox.enqueue('user.updated', {
        userId: updatedUser.id,
        resourceId: updatedUser.id,
        version: updatedUser.version,
        updates: sanitized,
        actorId: u.id,
        actorName: u.fullName,
      });

      res.json({
        user: sanitized,
        settings,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
