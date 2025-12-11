import pool from '../../config/database';
import { timelineService } from './timeline.service';
import { notificationsService } from './notifications.service';
import { goalsService } from './goals.service';

/**
 * Weekly timeline recalculation job
 * This runs for all users with active goals
 */
export async function runWeeklyTimelineRecalculation(): Promise<{
  usersProcessed: number;
  totalProjections: number;
  totalNotifications: number;
}> {
  console.log('[CRON] Starting weekly timeline recalculation...');
  const startTime = Date.now();

  let usersProcessed = 0;
  let totalProjections = 0;
  let totalNotifications = 0;

  try {
    // Get all users with active goals
    const usersResult = await pool.query(`
      SELECT DISTINCT user_id
      FROM goals
      WHERE status = 'active'
    `);

    const userIds = usersResult.rows.map(row => row.user_id);
    console.log(`[CRON] Found ${userIds.length} users with active goals`);

    for (const userId of userIds) {
      try {
        // Get previous projections for comparison
        const goals = await goalsService.getGoals(userId, { status: 'active' });
        const previousProjections = new Map<number, { projectedCompletion: string | null }>();

        for (const goal of goals) {
          const prev = await timelineService.getPreviousProjection(goal.id);
          if (prev) {
            previousProjections.set(goal.id, prev);
          }
        }

        // Recalculate timelines
        const { projections, notifications } =
          await timelineService.recalculateUserTimelines(userId, previousProjections);

        // Store new snapshots
        for (const projection of projections) {
          await timelineService.storeTimelineSnapshot(projection.goalId, projection);
        }

        // Create notifications for significant changes
        for (const notification of notifications) {
          await notificationsService.createTimelineNotification(userId, notification);
        }

        usersProcessed++;
        totalProjections += projections.length;
        totalNotifications += notifications.length;

        // Log progress every 100 users
        if (usersProcessed % 100 === 0) {
          console.log(`[CRON] Processed ${usersProcessed}/${userIds.length} users`);
        }
      } catch (userError) {
        console.error(`[CRON] Error processing user ${userId}:`, userError);
        // Continue with next user
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`[CRON] Weekly recalculation complete in ${duration.toFixed(2)}s`);
    console.log(`[CRON] Users: ${usersProcessed}, Projections: ${totalProjections}, Notifications: ${totalNotifications}`);

    return { usersProcessed, totalProjections, totalNotifications };
  } catch (error) {
    console.error('[CRON] Fatal error in weekly recalculation:', error);
    throw error;
  }
}

/**
 * Check for significant expense changes and trigger notifications
 * This runs daily to detect ±20% month-over-month changes
 */
export async function runDailyExpenseChangeCheck(): Promise<{
  usersChecked: number;
  significantChanges: number;
}> {
  console.log('[CRON] Starting daily expense change check...');
  const startTime = Date.now();

  let usersChecked = 0;
  let significantChanges = 0;

  try {
    // Get all users with active goals and income profiles
    const usersResult = await pool.query(`
      SELECT DISTINCT g.user_id
      FROM goals g
      INNER JOIN user_income_profile uip ON g.user_id = uip.user_id
      WHERE g.status = 'active'
    `);

    const userIds = usersResult.rows.map(row => row.user_id);

    for (const userId of userIds) {
      try {
        const expenseChange = await timelineService.detectExpenseChange(userId);
        usersChecked++;

        if (expenseChange.isSignificantChange) {
          significantChanges++;

          // Trigger timeline recalculation for users with significant changes
          const goals = await goalsService.getGoals(userId, { status: 'active' });
          const previousProjections = new Map<number, { projectedCompletion: string | null }>();

          for (const goal of goals) {
            const prev = await timelineService.getPreviousProjection(goal.id);
            if (prev) {
              previousProjections.set(goal.id, prev);
            }
          }

          const { projections, notifications } =
            await timelineService.recalculateUserTimelines(userId, previousProjections);

          for (const projection of projections) {
            await timelineService.storeTimelineSnapshot(projection.goalId, projection);
          }

          for (const notification of notifications) {
            await notificationsService.createTimelineNotification(userId, notification);
          }

          console.log(`[CRON] User ${userId}: Expense change ${expenseChange.percentageChange.toFixed(1)}% (${expenseChange.direction})`);
        }
      } catch (userError) {
        console.error(`[CRON] Error checking user ${userId}:`, userError);
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`[CRON] Daily expense check complete in ${duration.toFixed(2)}s`);
    console.log(`[CRON] Users checked: ${usersChecked}, Significant changes: ${significantChanges}`);

    return { usersChecked, significantChanges };
  } catch (error) {
    console.error('[CRON] Fatal error in daily expense check:', error);
    throw error;
  }
}

/**
 * Setup pg_cron jobs for timeline recalculation
 * This should be run once during database setup
 */
export async function setupCronJobs(): Promise<void> {
  console.log('[CRON] Setting up pg_cron jobs...');

  try {
    // Weekly timeline recalculation - runs every Sunday at 2 AM
    await pool.query(`
      SELECT cron.schedule(
        'weekly-timeline-recalculation',
        '0 2 * * 0',
        $$SELECT pg_notify('timeline_recalculation', 'weekly')$$
      )
    `);

    // Daily expense change check - runs every day at 3 AM
    await pool.query(`
      SELECT cron.schedule(
        'daily-expense-check',
        '0 3 * * *',
        $$SELECT pg_notify('expense_change_check', 'daily')$$
      )
    `);

    console.log('[CRON] pg_cron jobs scheduled successfully');
  } catch (error) {
    // pg_cron might not be available in all environments
    console.warn('[CRON] Could not setup pg_cron jobs:', error);
    console.warn('[CRON] Use an external scheduler (node-cron, etc.) as fallback');
  }
}

// If running directly, execute the weekly job
if (require.main === module) {
  runWeeklyTimelineRecalculation()
    .then(result => {
      console.log('Job completed:', result);
      process.exit(0);
    })
    .catch(err => {
      console.error('Job failed:', err);
      process.exit(1);
    });
}
