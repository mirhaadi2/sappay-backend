import { Router } from 'express';
import {
  getNotificationHistoryHandler,
  getPreferencesHandler,
  updatePreferencesHandler,
  getNotificationStatsHandler,
  getTemplatesHandler,
  createTemplateHandler,
  updateTemplateHandler,
  deleteTemplateHandler,
} from './controller';

const router = Router();

/**
 * User notification routes (authenticated users)
 */

// Get notification history
router.get('/history', getNotificationHistoryHandler);

// Get notification statistics
router.get('/stats', getNotificationStatsHandler);

// Get user notification preferences
router.get('/preferences', getPreferencesHandler);

// Update notification preferences
router.put('/preferences', updatePreferencesHandler);

/**
 * Admin routes (notification template management)
 * These should be protected with admin middleware
 */

// Get all templates
router.get('/admin/templates', getTemplatesHandler);

// Create new template
router.post('/admin/templates', createTemplateHandler);

// Update template
router.put('/admin/templates/:templateId', updateTemplateHandler);

// Delete template
router.delete('/admin/templates/:templateId', deleteTemplateHandler);

export default router;
