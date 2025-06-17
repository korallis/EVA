/**
 * Recommendation Service - Renderer-side service for recommendation system
 * Provides clean API for accessing recommendation features from React components
 * Handles IPC communication with main process recommendation handlers
 */

import { 
  ComprehensiveRecommendation,
  UnifiedRecommendationRequest
} from '../../services/recommendationOrchestrator';
import { ShipRecommendation } from '../../services/shipRecommendationEngine';
import { FittingEffectiveness } from '../../services/fittingEffectivenessCalculator';
import { StackingAnalysis } from '../../services/stackingPenaltyEngine';
import { SkillSet, ModuleFit } from '../../services/dogmaEngine';
import { EVALogger } from '../../utils/logger';

const logger = EVALogger.getLogger('RecommendationService');

export interface RecommendationServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Renderer-side Recommendation Service
 * Provides clean API for recommendation system access
 */
export class RecommendationService {
  private initialized = false;

  constructor() {
    logger.info('🎯 Initializing Recommendation Service...');
  }

  /**
   * Initialize the recommendation system
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      logger.info('🔄 Initializing recommendation system...');
      
      // TODO: Implement proper recommendation API bridge
      // For now, mark as initialized since main process handles recommendations
      this.initialized = true;
      logger.info('✅ Recommendation service initialized (using main process handlers)');
      
    } catch (error) {
      logger.error('❌ Recommendation service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive recommendations for an activity
   */
  async getComprehensiveRecommendations(
    request: UnifiedRecommendationRequest
  ): Promise<ComprehensiveRecommendation> {
    await this.ensureInitialized();
    
    try {
      logger.info(`🎯 Requesting comprehensive recommendations for activity: ${request.activityID}`);
      
      const response = await this.invoke<ComprehensiveRecommendation>(
        'recommendation:getComprehensive',
        request
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get comprehensive recommendations');
      }
      
      logger.info(`✅ Received ${response.data.shipRecommendations.length} ship recommendations`);
      return response.data;
      
    } catch (error) {
      logger.error('❌ Comprehensive recommendations request failed:', error);
      throw error;
    }
  }

  /**
   * Get quick ship recommendations
   */
  async getQuickShipRecommendations(
    activityID: string,
    skills: SkillSet,
    budget?: number
  ): Promise<ShipRecommendation[]> {
    await this.ensureInitialized();
    
    try {
      logger.info(`⚡ Requesting quick ship recommendations for: ${activityID}`);
      
      const response = await this.invoke<ShipRecommendation[]>(
        'recommendation:getQuickShips',
        activityID,
        skills,
        budget
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get quick ship recommendations');
      }
      
      logger.info(`✅ Received ${response.data.length} quick recommendations`);
      return response.data;
      
    } catch (error) {
      logger.error('❌ Quick ship recommendations request failed:', error);
      throw error;
    }
  }

  /**
   * Analyze a specific fitting
   */
  async analyzeFitting(
    shipTypeID: number,
    modules: ModuleFit[],
    skills: SkillSet,
    activityID: string
  ): Promise<{
    effectiveness: FittingEffectiveness;
    stackingAnalysis: StackingAnalysis;
    recommendations: string[];
  }> {
    await this.ensureInitialized();
    
    try {
      logger.info(`🔍 Analyzing fitting for ship ${shipTypeID}`);
      
      const response = await this.invoke<{
        effectiveness: FittingEffectiveness;
        stackingAnalysis: StackingAnalysis;
        recommendations: string[];
      }>(
        'recommendation:analyzeFitting',
        shipTypeID,
        modules,
        skills,
        activityID
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to analyze fitting');
      }
      
      logger.info(`✅ Fitting analysis complete - effectiveness: ${response.data.effectiveness.overallScore.toFixed(1)}`);
      return response.data;
      
    } catch (error) {
      logger.error('❌ Fitting analysis failed:', error);
      throw error;
    }
  }

  // Private helper methods
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private async invoke<T>(channel: string, ...args: any[]): Promise<RecommendationServiceResponse<T>> {
    // TODO: Implement proper IPC bridge for recommendations
    // For now, return empty response to prevent compilation errors
    logger.warn(`⚠️ Recommendation service invoke not implemented: ${channel}`);
    return { success: false, error: 'Recommendation service not fully implemented' };
  }
}

// Export singleton instance
export const recommendationService = new RecommendationService();