import {
  ActivityStatus,
  ActivityType,
  type IActivityReminderTemplate,
  type IChecklistItem,
  UserRole,
} from '@jrs/shared';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { type Model, Types } from 'mongoose';
import { TemplateLoaderUtil } from '../../core/utils/template-loader.util';
import {
  Activity,
  type ActivityDocument,
  ActivityReminderTemplate,
  type ActivityReminderTemplateDocument,
  Town,
  type TownDocument,
  User,
  type UserDocument,
} from '../../database/schemas';
import { WhatsAppService } from '../../services/whatsapp.service';
import { NotificationsService } from '../notifications/notifications.service';

const DEFAULT_TEMPLATES: Array<{
  activityType: ActivityType;
  items: IChecklistItem[];
  customInstructionsFr?: string;
  customInstructionsEn?: string;
}> = [
  {
    activityType: ActivityType.MONTHLY_MEETING,
    items: [
      {
        id: '1',
        labelKey: 'opening',
        labelFr:
          'Ouverture : Mot de bienvenue du/de la Responsable & Tour de table',
        labelEn: 'Opening: Welcome address & roll call',
        isRequired: true,
      },
      {
        id: '2',
        labelKey: 'last_report',
        labelFr: 'Lecture et adoption du compte-rendu de la session précédente',
        labelEn: 'Reading and approval of previous session minutes',
        isRequired: true,
      },
      {
        id: '3',
        labelKey: 'service_report',
        labelFr: 'Bilan des actions et projets en cours',
        labelEn: 'Review of ongoing actions and projects',
        isRequired: true,
      },
      {
        id: '4',
        labelKey: 'ag_preparation',
        labelFr: 'Préparation de la prochaine Assemblée Générale (AG)',
        labelEn: 'Preparation for the upcoming General Assembly (AG)',
        isRequired: true,
      },
      {
        id: '5',
        labelKey: 'causerie_speaker',
        labelFr:
          'Session thématique : Confirmation du sujet & de l’intervenant',
        labelEn: 'Thematic session: Topic & speaker confirmation',
        isRequired: true,
      },
      {
        id: '6',
        labelKey: 'divers',
        labelFr: 'Questions diverses & échanges ouverts',
        labelEn: 'Any other business (AOB) & open exchange',
        isRequired: false,
      },
      {
        id: '7',
        labelKey: 'contributions',
        labelFr: 'Cotisations, point financier & trésorerie',
        labelEn: 'Contributions, treasury balance & financial pledges',
        isRequired: true,
      },
      {
        id: '8',
        labelKey: 'closure',
        labelFr: 'Synthèse des résolutions & Clôture de la séance',
        labelEn: 'Summary of resolutions & meeting adjournment',
        isRequired: true,
      },
      {
        id: '9',
        labelKey: 'collation',
        labelFr: 'Collation & moment de convivialité',
        labelEn: 'Refreshments & community gathering',
        isRequired: false,
      },
    ],
    customInstructionsFr:
      'Veillez à imprimer ou partager l’ordre du jour au moins 48h à l’avance.',
    customInstructionsEn:
      'Ensure the agenda is printed or shared with members at least 48 hours prior.',
  },
  {
    activityType: ActivityType.SERVICE,
    items: [
      {
        id: '1',
        labelKey: 'service_template',
        labelFr: 'Validation du déroulé du programme de service',
        labelEn: 'Validation of service program schedule',
        isRequired: true,
      },
      {
        id: '2',
        labelKey: 'collation_assignment',
        labelFr: 'Collation : Désigner le responsable de préparation',
        labelEn: 'Collation: Assign person in charge of preparation',
        isRequired: true,
      },
      {
        id: '3',
        labelKey: 'collation_menu',
        labelFr: 'Collation : Définir la composition du menu & budget',
        labelEn: 'Collation: Finalize menu composition and budget',
        isRequired: true,
      },
      {
        id: '4',
        labelKey: 'logistics_equipment',
        labelFr: 'Matériel, sonorisation et équipement de service',
        labelEn: 'Logistics, sound system and service equipment',
        isRequired: true,
      },
    ],
  },
  {
    activityType: ActivityType.CAUSERIE,
    items: [
      {
        id: '1',
        labelKey: 'theme_confirmation',
        labelFr: 'Définition et validation du thème de causerie',
        labelEn: 'Definition and validation of discussion theme',
        isRequired: true,
      },
      {
        id: '2',
        labelKey: 'speaker_confirmation',
        labelFr: 'Confirmation de l’intervenant / animateur principal',
        labelEn: 'Confirmation of guest speaker / main facilitator',
        isRequired: true,
      },
      {
        id: '3',
        labelKey: 'discussion_guide',
        labelFr: 'Préparation des questions et guide d’échanges',
        labelEn: 'Preparation of discussion questions and moderation guide',
        isRequired: true,
      },
    ],
  },
  {
    activityType: ActivityType.CONFERENCE,
    items: [
      {
        id: '1',
        labelKey: 'reservation_list',
        labelFr:
          'Ouverture et suivi de la liste des réservations / inscriptions',
        labelEn: 'Open and monitor reservations / registration list',
        isRequired: true,
      },
      {
        id: '2',
        labelKey: 'venue_booking',
        labelFr: 'Confirmation et aménagement de la salle de conférence',
        labelEn: 'Confirmation and layout setup of conference hall',
        isRequired: true,
      },
      {
        id: '3',
        labelKey: 'av_sound_check',
        labelFr: 'Vérification de la sonorisation, projection et micro',
        labelEn: 'AV check: sound system, projector, and microphones',
        isRequired: true,
      },
      {
        id: '4',
        labelKey: 'reception_badges',
        labelFr:
          'Organisation de l’accueil et remise des supports aux participants',
        labelEn: 'Reception setup and distribution of attendee materials',
        isRequired: false,
      },
    ],
  },
  {
    activityType: ActivityType.RECREATIONAL,
    items: [
      {
        id: '1',
        labelKey: 'venue_reservation',
        labelFr: 'Réservation de l’espace / terrain de loisir',
        labelEn: 'Reservation of recreational space / grounds',
        isRequired: true,
      },
      {
        id: '2',
        labelKey: 'games_equipment',
        labelFr: 'Préparation du programme des jeux, animations et matériel',
        labelEn: 'Preparation of games schedule, entertainment & sports gear',
        isRequired: true,
      },
      {
        id: '3',
        labelKey: 'refreshments',
        labelFr: 'Organisation des rafraîchissements et ravitaillement',
        labelEn: 'Organization of refreshments and snacks',
        isRequired: true,
      },
    ],
  },
  {
    activityType: ActivityType.AG,
    items: [
      {
        id: '1',
        labelKey: 'convocations',
        labelFr:
          'Envoi des convocations officielles et documents préparatoires',
        labelEn: 'Dispatch official convocations and preparatory documents',
        isRequired: true,
      },
      {
        id: '2',
        labelKey: 'annual_reports',
        labelFr:
          'Finalisation du bilan d’activités et du rapport financier annuel',
        labelEn: 'Finalize annual activity report and financial statement',
        isRequired: true,
      },
      {
        id: '3',
        labelKey: 'agenda_approval',
        labelFr: 'Adoption de l’ordre du jour de l’Assemblée Générale',
        labelEn: 'Adoption of General Assembly agenda',
        isRequired: true,
      },
      {
        id: '4',
        labelKey: 'voting_logistics',
        labelFr:
          'Préparation des bulletins de vote, registre et isoloir (si élection)',
        labelEn:
          'Preparation of ballots, voter register and booth (if elections)',
        isRequired: false,
      },
    ],
  },
  {
    activityType: ActivityType.JPO,
    items: [
      {
        id: '1',
        labelKey: 'invitations_posters',
        labelFr: 'Diffusion des affiches et invitations grand public',
        labelEn: 'Circulate posters and public orientation invitations',
        isRequired: true,
      },
      {
        id: '2',
        labelKey: 'welcome_stands',
        labelFr:
          'Mise en place des stands d’accueil et fiches de renseignement',
        labelEn: 'Set up welcome booths and registration leaflets',
        isRequired: true,
      },
      {
        id: '3',
        labelKey: 'team_briefing',
        labelFr: 'Briefing de l’équipe d’accueil et des présentateurs',
        labelEn: 'Briefing of welcome protocol team and presenters',
        isRequired: true,
      },
    ],
  },
];

const ACTIVITY_LABELS_FR: Record<ActivityType, string> = {
  [ActivityType.MONTHLY_MEETING]: 'Réunion Mensuelle',
  [ActivityType.SERVICE]: 'Service',
  [ActivityType.CAUSERIE]: 'Causerie Éducative',
  [ActivityType.CONFERENCE]: 'Conférence',
  [ActivityType.RECREATIONAL]: 'Activité Récréative',
  [ActivityType.AG]: 'Assemblée Générale',
  [ActivityType.JPO]: 'Journée Portes Ouvertes',
};

const ACTIVITY_LABELS_EN: Record<ActivityType, string> = {
  [ActivityType.MONTHLY_MEETING]: 'Monthly Meeting',
  [ActivityType.SERVICE]: 'Service',
  [ActivityType.CAUSERIE]: 'Educational Talk',
  [ActivityType.CONFERENCE]: 'Conference',
  [ActivityType.RECREATIONAL]: 'Recreational Activity',
  [ActivityType.AG]: 'General Assembly',
  [ActivityType.JPO]: 'Open House Day',
};

const MONTH_NAMES_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const MONTH_NAMES_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

@Injectable()
export class ActivityReminderService implements OnModuleInit {
  private readonly logger = new Logger(ActivityReminderService.name);

  constructor(
    @InjectModel(Activity.name)
    private readonly activityModel: Model<ActivityDocument>,
    @InjectModel(ActivityReminderTemplate.name)
    private readonly templateModel: Model<ActivityReminderTemplateDocument>,
    @InjectModel(Town.name)
    private readonly townModel: Model<TownDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
    private readonly whatsAppService: WhatsAppService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaultTemplates();
  }

  /**
   * Seed default preparation checklists if they don't exist in the database.
   */
  async seedDefaultTemplates(): Promise<void> {
    for (const def of DEFAULT_TEMPLATES) {
      const exists = await this.templateModel.exists({
        activityType: def.activityType,
      });
      if (!exists) {
        await this.templateModel.create({
          activityType: def.activityType,
          items: def.items,
          customInstructionsFr: def.customInstructionsFr,
          customInstructionsEn: def.customInstructionsEn,
        });
        this.logger.log(`Seeded checklist template for ${def.activityType}`);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Template Management APIs
  // --------------------------------------------------------------------------

  async getTemplates(): Promise<IActivityReminderTemplate[]> {
    const list = await this.templateModel.find().lean().exec();
    return list.map((item) => ({
      id: item._id.toString(),
      activityType: item.activityType,
      items: item.items,
      customInstructionsFr: item.customInstructionsFr,
      customInstructionsEn: item.customInstructionsEn,
      updatedAt: (item as any).updatedAt?.toISOString?.(),
    }));
  }

  async getTemplateByType(
    activityType: ActivityType,
  ): Promise<IActivityReminderTemplate | null> {
    const template = await this.templateModel
      .findOne({ activityType })
      .lean()
      .exec();
    if (!template) return null;
    return {
      id: template._id.toString(),
      activityType: template.activityType,
      items: template.items,
      customInstructionsFr: template.customInstructionsFr,
      customInstructionsEn: template.customInstructionsEn,
      updatedAt: (template as any).updatedAt?.toISOString?.(),
    };
  }

  async updateTemplate(
    activityType: ActivityType,
    dto: {
      items: IChecklistItem[];
      customInstructionsFr?: string;
      customInstructionsEn?: string;
    },
  ): Promise<IActivityReminderTemplate> {
    const updated = await this.templateModel
      .findOneAndUpdate(
        { activityType },
        {
          items: dto.items,
          customInstructionsFr: dto.customInstructionsFr,
          customInstructionsEn: dto.customInstructionsEn,
        },
        { new: true, upsert: true },
      )
      .lean();
    this.notificationsService
      .createNotification({
        target: {
          roles: [UserRole.AP, UserRole.PC],
        },
        level: 'INFO',
        action: 'SYSTEM_ANNOUNCEMENT',
        titleKey: 'notifications:reminderTemplateUpdatedTitle',
        bodyKey: 'notifications:reminderTemplateUpdatedBody',
        bodyParams: { type: activityType },
        resource: {
          entityType: 'ACTIVITY',
          entityId: updated._id.toString(),
          subTab: 'preparation',
        },
        sendPush: true,
      })
      .catch((err) =>
        this.logger.warn(
          `Failed to dispatch reminder template updated notification: ${err.message}`,
        ),
      );

    return {
      id: updated._id.toString(),
      activityType: updated.activityType,
      items: updated.items,
      customInstructionsFr: updated.customInstructionsFr,
      customInstructionsEn: updated.customInstructionsEn,
      updatedAt: (updated as any).updatedAt?.toISOString?.(),
    };
  }

  // --------------------------------------------------------------------------
  // Scheduled Cron Jobs
  // --------------------------------------------------------------------------

  /**
   * Daily milestone check at 08:00 AM UTC (0 8 * * *).
   * Checks for 14-day milestones, 7-day milestones, and missing report warnings.
   */
  @Cron('0 8 * * *')
  async handleDailyMilestones(): Promise<{
    reminders14d: number;
    reminders7d: number;
    reportWarnings: number;
  }> {
    this.logger.log('Starting daily activity milestones & report check...');
    return this.processDailyMilestones();
  }

  /**
   * Monthly digest check on the 1st of every month at 08:00 AM UTC (0 8 1 * *).
   */
  @Cron('0 8 1 * *')
  async handleMonthlyDigest(): Promise<{ townsProcessed: number }> {
    this.logger.log('Starting monthly activities digest dispatch...');
    return this.processMonthlyDigest();
  }

  // --------------------------------------------------------------------------
  // Core Business Logic
  // --------------------------------------------------------------------------

  async processDailyMilestones(): Promise<{
    reminders14d: number;
    reminders7d: number;
    reportWarnings: number;
  }> {
    const now = new Date();
    const appUrl =
      this.configService.get<string>('APP_FRONTEND_URL') ||
      'https://lrc-jrs.org';

    // 1. Process 14-day milestone
    const target14Start = new Date(now);
    target14Start.setDate(target14Start.getDate() + 13);
    target14Start.setUTCHours(12, 0, 0, 0);

    const target14End = new Date(now);
    target14End.setDate(target14End.getDate() + 15);
    target14End.setUTCHours(12, 0, 0, 0);

    const activities14 = await this.activityModel
      .find({
        isDeleted: false,
        status: { $ne: ActivityStatus.CANCELLED },
        startDate: { $gte: target14Start, $lte: target14End },
        remindersSent: { $ne: '2_WEEKS' },
      })
      .exec();

    let count14 = 0;
    for (const act of activities14) {
      const sent = await this.sendActivityMilestoneReminder(
        act,
        '2_WEEKS',
        appUrl,
      );
      if (sent) {
        await this.activityModel.updateOne(
          { _id: act._id },
          { $addToSet: { remindersSent: '2_WEEKS' } },
        );
        count14++;
      }
    }

    // 2. Process 7-day milestone
    const target7Start = new Date(now);
    target7Start.setDate(target7Start.getDate() + 6);
    target7Start.setUTCHours(12, 0, 0, 0);

    const target7End = new Date(now);
    target7End.setDate(target7End.getDate() + 8);
    target7End.setUTCHours(12, 0, 0, 0);

    const activities7 = await this.activityModel
      .find({
        isDeleted: false,
        status: { $ne: ActivityStatus.CANCELLED },
        startDate: { $gte: target7Start, $lte: target7End },
        remindersSent: { $ne: '1_WEEK' },
      })
      .exec();

    let count7 = 0;
    for (const act of activities7) {
      const sent = await this.sendActivityMilestoneReminder(
        act,
        '1_WEEK',
        appUrl,
      );
      if (sent) {
        await this.activityModel.updateOne(
          { _id: act._id },
          { $addToSet: { remindersSent: '1_WEEK' } },
        );
        count7++;
      }
    }

    // 3. Process Post-Activity Missing Report Warning
    // Activities that ended in the past 30 days where no report has been uploaded
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const pastActivities = await this.activityModel
      .find({
        isDeleted: false,
        status: { $ne: ActivityStatus.CANCELLED },
        endDate: { $gte: thirtyDaysAgo, $lte: now },
        remindersSent: { $ne: 'REPORT_UPLOAD_WARNING' },
        $or: [
          { report: { $exists: false } },
          { 'report.fileId': { $exists: false } },
          { 'report.fileId': null },
          { 'report.fileId': '' },
        ],
      })
      .exec();

    let countReports = 0;
    for (const act of pastActivities) {
      // Double check memory model
      if (act.report?.fileId || (act.reports && act.reports.length > 0)) {
        continue;
      }

      const sent = await this.sendReportUploadWarning(act, appUrl);
      if (sent) {
        await this.activityModel.updateOne(
          { _id: act._id },
          { $addToSet: { remindersSent: 'REPORT_UPLOAD_WARNING' } },
        );
        countReports++;
      }
    }

    this.logger.log(
      `Daily milestone completed: ${count14} 14-day reminders, ${count7} 7-day reminders, ${countReports} report warnings sent.`,
    );

    return {
      reminders14d: count14,
      reminders7d: count7,
      reportWarnings: countReports,
    };
  }

  async processMonthlyDigest(): Promise<{ townsProcessed: number }> {
    const now = new Date();
    const appUrl =
      this.configService.get<string>('APP_FRONTEND_URL') ||
      'https://lrc-jrs.org';

    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0),
    );
    const endOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
    );

    const monthNameFr = MONTH_NAMES_FR[now.getUTCMonth()];
    const monthNameEn = MONTH_NAMES_EN[now.getUTCMonth()];
    const yearStr = now.getUTCFullYear().toString();

    // Fetch all scheduled activities in this month
    const activities = await this.activityModel
      .find({
        isDeleted: false,
        status: { $ne: ActivityStatus.CANCELLED },
        startDate: { $gte: startOfMonth, $lte: endOfMonth },
      })
      .sort({ startDate: 1 })
      .exec();

    // Group activities by town (hostTownId, townId, and includedTownIds)
    const activitiesByTown = new Map<string, ActivityDocument[]>();
    for (const act of activities) {
      const townKeys = new Set<string>();
      if (act.hostTownId) townKeys.add(act.hostTownId.toString());
      if (act.townId) townKeys.add(act.townId.toString());
      for (const incId of act.includedTownIds || []) {
        townKeys.add(incId.toString());
      }
      for (const tKey of townKeys) {
        const list = activitiesByTown.get(tKey) || [];
        list.push(act);
        activitiesByTown.set(tKey, list);
      }
    }

    // Process all towns that have PCs
    const towns = await this.townModel.find().exec();
    let townsProcessed = 0;

    for (const town of towns) {
      const townIdStr = town._id.toString();
      const townActivities = activitiesByTown.get(townIdStr) || [];
      const townPcs = await this.getTownCoordinators(town._id);

      if (townPcs.length === 0) continue;

      // 1. Dispatch In-App Notification
      await this.notificationsService.createNotification({
        level: 'INFO',
        action: 'MONTHLY_ACTIVITIES_DIGEST',
        titleKey: 'notifications.activity.monthlyDigest.title',
        titleParams: {
          month: monthNameFr,
          year: yearStr,
        },
        bodyKey: 'notifications.activity.monthlyDigest.body',
        bodyParams: {
          count: townActivities.length,
        },
        target: {
          townId: townIdStr,
          roles: [UserRole.PC],
        },
        resource: {
          entityType: 'ACTIVITY',
          townId: townIdStr,
        },
      });

      // 2. Dispatch WhatsApp digest to each PC in preferred language
      for (const pc of townPcs) {
        const lang = pc.preferredLanguage || 'fr';
        const templatePath =
          lang === 'en'
            ? 'whatsapp/reminders/monthly-digest.en.txt'
            : 'whatsapp/reminders/monthly-digest.fr.txt';

        const formattedActivities = townActivities.map((act, index) => ({
          index: index + 1,
          name: act.title,
          dateFormatted: this.formatDate(act.startDate, lang),
          locationVenue: act.locationVenue,
          typeLabel:
            lang === 'en'
              ? ACTIVITY_LABELS_EN[act.activityType] || act.activityType
              : ACTIVITY_LABELS_FR[act.activityType] || act.activityType,
        }));

        const message = TemplateLoaderUtil.render(templatePath, {
          userName: pc.fullName,
          townName: town.name,
          monthName: lang === 'en' ? monthNameEn : monthNameFr,
          year: yearStr,
          activities: formattedActivities,
          appUrl,
        });

        await this.whatsAppService.sendTextMessage(pc.phoneNumber, message);
      }

      townsProcessed++;
    }

    this.logger.log(
      `Monthly digest dispatch complete for ${townsProcessed} towns.`,
    );
    return { townsProcessed };
  }

  // --------------------------------------------------------------------------
  // Helper Dispatch Methods
  // --------------------------------------------------------------------------

  private async sendActivityMilestoneReminder(
    activity: ActivityDocument,
    milestone: '2_WEEKS' | '1_WEEK',
    appUrl: string,
  ): Promise<boolean> {
    const town = await this.townModel
      .findById(activity.hostTownId || activity.townId)
      .exec();
    const hostTownName = town?.name || '';
    const townIdStr = (activity.hostTownId || activity.townId).toString();
    const townPcs = await this.getTownCoordinators(
      activity.hostTownId || activity.townId,
    );

    if (townPcs.length === 0) {
      this.logger.warn(
        `No coordinators found for host town ${hostTownName} (${townIdStr}) on activity ${activity.title}`,
      );
    }

    // Resolve template checklist for host town
    const template = await this.templateModel
      .findOne({ activityType: activity.activityType })
      .lean()
      .exec();

    const action =
      milestone === '2_WEEKS'
        ? 'ACTIVITY_REMINDER_2_WEEKS'
        : 'ACTIVITY_REMINDER_1_WEEK';

    // 1. Send in-app notification to host town PC
    await this.notificationsService.createNotification({
      level: milestone === '2_WEEKS' ? 'INFO' : 'WARNING',
      action,
      titleKey:
        milestone === '2_WEEKS'
          ? 'notifications.activity.reminder2Weeks.title'
          : 'notifications.activity.reminder1Week.title',
      titleParams: {
        activityName: activity.title,
      },
      bodyKey:
        milestone === '2_WEEKS'
          ? 'notifications.activity.reminder2Weeks.body'
          : 'notifications.activity.reminder1Week.body',
      bodyParams: {
        activityName: activity.title,
        date: this.formatDate(activity.startDate, 'fr'),
      },
      target: {
        townId: townIdStr,
        roles: [UserRole.PC],
      },
      resource: {
        entityType: 'ACTIVITY',
        entityId: activity._id.toString(),
        townId: townIdStr,
      },
    });

    // 2. Dispatch WhatsApp messages to host town PCs (with checklist/instructions)
    for (const pc of townPcs) {
      const lang = pc.preferredLanguage || 'fr';
      const templateFile =
        milestone === '2_WEEKS'
          ? lang === 'en'
            ? 'whatsapp/reminders/activity-reminder-2weeks.en.txt'
            : 'whatsapp/reminders/activity-reminder-2weeks.fr.txt'
          : lang === 'en'
            ? 'whatsapp/reminders/activity-reminder-1week.en.txt'
            : 'whatsapp/reminders/activity-reminder-1week.fr.txt';

      const checklistItems =
        template?.items?.map((item) =>
          lang === 'en' ? item.labelEn : item.labelFr,
        ) || [];

      const customInstructions =
        lang === 'en'
          ? template?.customInstructionsEn
          : template?.customInstructionsFr;

      const typeLabel =
        lang === 'en'
          ? ACTIVITY_LABELS_EN[activity.activityType] || activity.activityType
          : ACTIVITY_LABELS_FR[activity.activityType] || activity.activityType;

      const message = TemplateLoaderUtil.render(templateFile, {
        userName: pc.fullName,
        activityName: activity.title,
        startDateFormatted: this.formatDate(activity.startDate, lang),
        locationVenue: activity.locationVenue,
        activityTypeLabel: typeLabel,
        checklistItems,
        customInstructions,
        appUrl: `${appUrl}/activities/${activity._id.toString()}`,
      });

      await this.whatsAppService.sendTextMessage(pc.phoneNumber, message);
    }

    // 3. Dispatch Reminders to Participating Towns (includedTownIds)
    // Participating town PCs receive an inter-town activity reminder without preparation checklist
    if (activity.includedTownIds && activity.includedTownIds.length > 0) {
      const daysAhead = milestone === '2_WEEKS' ? '14' : '7';

      for (const incTownId of activity.includedTownIds) {
        const incTownIdStr = incTownId.toString();
        if (incTownIdStr === townIdStr) continue;

        // In-app notification for participating town PCs
        await this.notificationsService.createNotification({
          level: milestone === '2_WEEKS' ? 'INFO' : 'WARNING',
          action: 'ACTIVITY_REMINDER_PARTICIPATING',
          titleKey: 'notifications.activity.reminderParticipating.title',
          titleParams: {
            activityName: activity.title,
          },
          bodyKey: 'notifications.activity.reminderParticipating.body',
          bodyParams: {
            activityName: activity.title,
            hostTown: hostTownName,
            date: this.formatDate(activity.startDate, 'fr'),
          },
          target: {
            townId: incTownIdStr,
            roles: [UserRole.PC],
          },
          resource: {
            entityType: 'ACTIVITY',
            entityId: activity._id.toString(),
            townId: incTownIdStr,
          },
        });

        // WhatsApp notification for participating town PCs
        const participatingPcs = await this.getTownCoordinators(incTownId);
        for (const pc of participatingPcs) {
          const lang = pc.preferredLanguage || 'fr';
          const templateFile =
            lang === 'en'
              ? 'whatsapp/reminders/activity-reminder-participating.en.txt'
              : 'whatsapp/reminders/activity-reminder-participating.fr.txt';

          const typeLabel =
            lang === 'en'
              ? ACTIVITY_LABELS_EN[activity.activityType] ||
                activity.activityType
              : ACTIVITY_LABELS_FR[activity.activityType] ||
                activity.activityType;

          const message = TemplateLoaderUtil.render(templateFile, {
            userName: pc.fullName,
            daysAhead,
            hostTownName,
            activityName: activity.title,
            startDateFormatted: this.formatDate(activity.startDate, lang),
            locationVenue: activity.locationVenue,
            activityTypeLabel: typeLabel,
            notes: activity.notes,
            appUrl: `${appUrl}/activities/${activity._id.toString()}`,
          });

          await this.whatsAppService.sendTextMessage(pc.phoneNumber, message);
        }
      }
    }

    return true;
  }

  private async sendReportUploadWarning(
    activity: ActivityDocument,
    appUrl: string,
  ): Promise<boolean> {
    const townIdStr = (activity.hostTownId || activity.townId).toString();
    const townPcs = await this.getTownCoordinators(
      activity.hostTownId || activity.townId,
    );

    // 1. In-app notification
    await this.notificationsService.createNotification({
      level: 'WARNING',
      action: 'REPORT_UPLOAD_WARNING',
      titleKey: 'notifications.activity.reportWarning.title',
      titleParams: {
        activityName: activity.title,
      },
      bodyKey: 'notifications.activity.reportWarning.body',
      bodyParams: {
        activityName: activity.title,
      },
      target: {
        townId: townIdStr,
        roles: [UserRole.PC],
      },
      resource: {
        entityType: 'REPORT',
        entityId: activity._id.toString(),
        townId: townIdStr,
        subTab: 'report',
      },
    });

    // 2. Dispatch WhatsApp warning to PCs
    for (const pc of townPcs) {
      const lang = pc.preferredLanguage || 'fr';
      const templateFile =
        lang === 'en'
          ? 'whatsapp/reminders/activity-report-warning.en.txt'
          : 'whatsapp/reminders/activity-report-warning.fr.txt';

      const message = TemplateLoaderUtil.render(templateFile, {
        userName: pc.fullName,
        activityName: activity.title,
        endDateFormatted: this.formatDate(activity.endDate, lang),
        locationVenue: activity.locationVenue,
        appUrl: `${appUrl}/activities/${activity._id.toString()}`,
      });

      await this.whatsAppService.sendTextMessage(pc.phoneNumber, message);
    }

    return true;
  }

  private async getTownCoordinators(
    townId: Types.ObjectId,
  ): Promise<UserDocument[]> {
    return this.userModel
      .find({
        homeTownId: townId,
        $or: [{ role: UserRole.PC }, { isActivePC: true }],
      })
      .exec();
  }

  private formatDate(date: Date, lang: 'fr' | 'en'): string {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', options);
  }
}
