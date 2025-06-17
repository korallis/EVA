/**
 * Recommendation Handlers - IPC handlers for recommendation system
 * Provides secure communication between renderer and main process
 * Handles ship recommendations, fitting analysis, and skill planning
 */

import { ipcMain } from 'electron';
import { recommendationOrchestrator } from '../../../services/recommendationOrchestrator';
import { shipRecommendationEngine } from '../../../services/shipRecommendationEngine';
import { fittingEffectivenessCalculator } from '../../../services/fittingEffectivenessCalculator';
import { stackingPenaltyEngine } from '../../../services/stackingPenaltyEngine';
import { EVALogger } from '../../../utils/logger';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from '../../../utils/errorHandler';

const logger = EVALogger.getLogger('RecommendationHandlers');

/**
 * Recommendation IPC Handlers
 * Provides secure access to recommendation system from renderer process
 */
export class RecommendationHandlers {
  constructor() {
    this.initializeHandlers();
    logger.info('🎯 Recommendation IPC handlers initialized');
  }

  private initializeHandlers(): void {
    // Comprehensive recommendations
    ipcMain.handle('recommendation:getComprehensive', async (event, request) => {
      try {
        logger.info(`🎯 Handling comprehensive recommendation request for activity: ${request.activityID}`);
        
        const result = await recommendationOrchestrator.generateComprehensiveRecommendations(request);
        logger.info(`✅ Generated comprehensive recommendations: ${result.shipRecommendations.length} ships`);
        
        return {
          success: true,
          data: result
        };
      } catch (error) {
        logger.error('❌ Comprehensive recommendation request failed:', error);
        ErrorHandler.handleError(
          'RecommendationHandlers',
          'Comprehensive recommendation request failed',
          ErrorCategory.IPC,
          ErrorSeverity.HIGH,
          error as Error,
          { request }
        );
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Quick ship recommendations
    ipcMain.handle('recommendation:getQuickShips', async (event, activityID, skills, budget) => {
      try {
        logger.info(`⚡ Handling quick ship recommendation request for activity: ${activityID}`);
        
        const result = await recommendationOrchestrator.getQuickShipRecommendations(
          activityID,
          skills,
          budget
        );
        
        logger.info(`✅ Generated quick ship recommendations: ${result.length} ships`);
        
        return {
          success: true,
          data: result
        };
      } catch (error) {
        logger.error('❌ Quick ship recommendation request failed:', error);
        ErrorHandler.handleError(
          'RecommendationHandlers',
          'Quick ship recommendation request failed',
          ErrorCategory.IPC,
          ErrorSeverity.MEDIUM,
          error as Error,
          { activityID, budget }
        );
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Fitting analysis
    ipcMain.handle('recommendation:analyzeFitting', async (event, shipTypeID, modules, skills, activityID) => {
      try {
        logger.info(`🔍 Analyzing fitting for ship ${shipTypeID} with ${modules.length} modules`);
        
        const result = await recommendationOrchestrator.analyzeFitting(
          shipTypeID,
          modules,
          skills,
          activityID
        );
        
        logger.info(`✅ Fitting analysis complete - effectiveness: ${result.effectiveness.overallScore.toFixed(1)}`);
        
        return {
          success: true,
          data: result
        };
      } catch (error) {
        logger.error('❌ Fitting analysis failed:', error);
        ErrorHandler.handleError(
          'RecommendationHandlers',
          'Fitting analysis failed',
          ErrorCategory.CALCULATION,
          ErrorSeverity.MEDIUM,
          error as Error,
          { shipTypeID, moduleCount: modules.length }
        );
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Ship comparison
    ipcMain.handle('recommendation:compareShips', async (event, shipTypeIDs, activityID, skills) => {
      try {
        logger.info(`⚖️ Comparing ${shipTypeIDs.length} ships for activity: ${activityID}`);
        
        const result = await recommendationOrchestrator.compareShipsForActivity(
          shipTypeIDs,
          activityID,
          skills
        );
        
        logger.info(`✅ Ship comparison complete: ${result.length} ships analyzed`);
        
        return {
          success: true,
          data: result
        };
      } catch (error) {
        logger.error('❌ Ship comparison failed:', error);
        ErrorHandler.handleError(
          'RecommendationHandlers',
          'Ship comparison failed',
          ErrorCategory.CALCULATION,
          ErrorSeverity.MEDIUM,
          error as Error,
          { shipTypeIDs, activityID }
        );
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Budget-based recommendations
    ipcMain.handle('recommendation:getByBudget', async (event, activityID, skills, budgetTiers) => {
      try {
        logger.info(`💰 Getting budget-tiered recommendations for activity: ${activityID}`);
        
        const result = await recommendationOrchestrator.getRecommendationsByBudget(
          activityID,
          skills,
          budgetTiers
        );
        
        const totalRecommendations = Array.from(result.values()).reduce((sum, recs) => sum + recs.length, 0);
        logger.info(`✅ Budget recommendations complete: ${totalRecommendations} ships across ${result.size} tiers`);
        
        // Convert Map to Object for JSON serialization
        const resultObj = Object.fromEntries(result);
        
        return {
          success: true,
          data: resultObj
        };
      } catch (error) {
        logger.error('❌ Budget recommendation request failed:', error);
        ErrorHandler.handleError(
          'RecommendationHandlers',
          'Budget recommendation request failed',
          ErrorCategory.CALCULATION,
          ErrorSeverity.MEDIUM,
          error as Error,
          { activityID, budgetTiers }
        );
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Stacking penalty analysis
    ipcMain.handle('recommendation:analyzeStacking', async (event, modules) => {
      try {
        logger.info(`📉 Analyzing stacking penalties for ${modules.length} modules`);
        
        const result = stackingPenaltyEngine.calculateStackingPenalties(modules);
        
        logger.info(`✅ Stacking analysis complete - efficiency: ${result.efficiencyPercentage.toFixed(1)}%`);
        
        return {
          success: true,
          data: result
        };
      } catch (error) {
        logger.error('❌ Stacking penalty analysis failed:', error);
        ErrorHandler.handleError(
          'RecommendationHandlers',
          'Stacking penalty analysis failed',
          ErrorCategory.CALCULATION,
          ErrorSeverity.LOW,
          error as Error,
          { moduleCount: modules.length }
        );
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Get stacking penalty table
    ipcMain.handle('recommendation:getStackingTable', async (event, maxPosition = 10) => {
      try {
        logger.debug(`📊 Getting stacking penalty table for ${maxPosition} positions`);
        
        const result = stackingPenaltyEngine.getStackingPenaltyTable(maxPosition);
        
        return {
          success: true,
          data: result
        };
      } catch (error) {
        logger.error('❌ Stacking penalty table request failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Fitting effectiveness calculation
    ipcMain.handle('recommendation:calculateEffectiveness', async (event, shipTypeId, modules, skills, activityId) => {
      try {
        logger.info(`📊 Calculating fitting effectiveness for ship ${shipTypeId}`);
        
        const result = await fittingEffectivenessCalculator.calculateFittingEffectiveness(
          shipTypeId,
          modules,
          skills,
          activityId
        );
        
        logger.info(`✅ Effectiveness calculation complete - score: ${result.overallScore.toFixed(1)}`);
        
        return {
          success: true,
          data: result
        };
      } catch (error) {
        logger.error('❌ Effectiveness calculation failed:', error);
        ErrorHandler.handleError(
          'RecommendationHandlers',
          'Effectiveness calculation failed',
          ErrorCategory.CALCULATION,
          ErrorSeverity.MEDIUM,
          error as Error,
          { shipTypeId, activityId }
        );
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Activity comparison
    ipcMain.handle('recommendation:compareActivities', async (event, shipTypeId, modules, skills, activities) => {
      try {
        logger.info(`🎯 Comparing ship across ${activities.length} activities`);
        
        const result = await fittingEffectivenessCalculator.compareFittingAcrossActivities(
          shipTypeId,
          modules,
          skills,
          activities
        );
        
        logger.info(`✅ Activity comparison complete: ${result.length} activities analyzed`);
        
        return {
          success: true,
          data: result
        };
      } catch (error) {
        logger.error('❌ Activity comparison failed:', error);
        ErrorHandler.handleError(
          'RecommendationHandlers',
          'Activity comparison failed',
          ErrorCategory.CALCULATION,
          ErrorSeverity.MEDIUM,
          error as Error,
          { shipTypeId, activities }
        );
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Initialize recommendation systems
    ipcMain.handle('recommendation:initialize', async (event) => {
      try {
        logger.info('🔄 Initializing recommendation systems...');
        
        await recommendationOrchestrator.initialize();
        
        logger.info('✅ Recommendation systems initialized successfully');
        
        return {
          success: true,
          data: { initialized: true }
        };
      } catch (error) {
        logger.error('❌ Recommendation system initialization failed:', error);
        ErrorHandler.handleError(
          'RecommendationHandlers',
          'Recommendation system initialization failed',
          ErrorCategory.INITIALIZATION,
          ErrorSeverity.CRITICAL,
          error as Error,
          { component: 'RecommendationSystems' }
        );
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Clear recommendation cache
    ipcMain.handle('recommendation:clearCache', async (event) => {
      try {
        logger.info('🗑️ Clearing recommendation cache...');
        
        recommendationOrchestrator.clearCache();
        
        logger.info('✅ Recommendation cache cleared');
        
        return {
          success: true,
          data: { cleared: true }
        };
      } catch (error) {
        logger.error('❌ Cache clearing failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Get performance metrics
    ipcMain.handle('recommendation:getPerformanceMetrics', async (event) => {
      try {
        const metrics = recommendationOrchestrator.getPerformanceMetrics();
        
        return {
          success: true,
          data: metrics
        };
      } catch (error) {
        logger.error('❌ Performance metrics request failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    // Health check
    ipcMain.handle('recommendation:healthCheck', async (event) => {
      try {
        logger.debug('🔍 Performing recommendation system health check...');
        
        // Basic health check - could be expanded
        const health = {
          orchestrator: 'healthy',
          shipEngine: 'healthy',
          effectivenessCalculator: 'healthy',
          stackingEngine: 'healthy',
          timestamp: Date.now()
        };
        
        return {
          success: true,
          data: health
        };
      } catch (error) {
        logger.error('❌ Health check failed:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }
}

// Export singleton instance
export const recommendationHandlers = new RecommendationHandlers();