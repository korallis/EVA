declare global {
  interface Window {
    electronAPI: {
      // Authentication API
      auth: {
        start: () => Promise<any>;
        check: () => Promise<any>;
        getCharacter: () => Promise<any>;
        logout: () => Promise<any>;
        onSuccess: (callback: () => void) => void;
        removeAllListeners: () => void;
      };
      
      // ESI API
      esi: {
        // Character Skills
        getCharacterSkills: (characterId: string) => Promise<any>;
        getCharacterSkillQueue: (characterId: string) => Promise<any>;
        getSkillTypes: (skillIds: number[]) => Promise<any>;
        
        // Character Location & Ship
        getCharacterLocation: (characterId?: string) => Promise<any>;
        getCharacterShip: (characterId?: string) => Promise<any>;
        
        // Character Wallet
        getCharacterWallet: (characterId?: string) => Promise<any>;
        
        // Corporation
        getCorporationInfo: (corporationId: number) => Promise<any>;
        getCharacterCorporationHistory: (characterId?: string) => Promise<any>;
        
        // Character Clones & Implants
        getCharacterClones: (characterId?: string) => Promise<any>;
        getCharacterImplants: (characterId?: string) => Promise<any>;
        
        // Universe Data
        getSystemInfo: (systemId: number) => Promise<any>;
        getStationInfo: (stationId: number) => Promise<any>;
      };

      // SDE and Fitting API
      sde: {
        initialize: () => Promise<any>;
        getShips: () => Promise<any>;
        getModules: () => Promise<any>;
        getTypeAttributes: (typeID: number) => Promise<any>;
        getSkillRequirements: (typeID: number) => Promise<any>;
        import: () => Promise<any>;
        clearDatabase: () => Promise<any>;
        checkVersion: () => Promise<any>;
        getInstalledVersion: () => Promise<any>;
        download: () => Promise<any>;
        parse: () => Promise<any>;
        onDownloadProgress: (callback: (progress: any) => void) => void;
        removeDownloadProgressListener: () => void;
      };

      fitting: {
        calculate: (shipData: any, modulesData: any[]) => Promise<any>;
        calculateAdvanced: (shipData: any, weaponsData: any[], targetProfile?: any) => Promise<any>;
        validate: (shipData: any, modulesData: any[]) => Promise<any>;
        save: (fitting: any) => Promise<any>;
        getFittings: () => Promise<any>;
      };

      // Character management API
      characters: {
        getAll: () => Promise<any>;
        getActive: () => Promise<any>;
        setActive: (characterId: number) => Promise<any>;
      };

      // Recommendation API
      recommendations: {
        getShipRecommendations: (activity: string, budget?: number, skillsOnly?: boolean) => Promise<any>;
        getComprehensiveRecommendations: (activity: string, budget?: number, options?: any) => Promise<any>;
        getFittingEffectiveness: (shipTypeId: number, modules: any[], activity: string) => Promise<any>;
        optimizeFitting: (shipTypeId: number, modules: any[], activity: string) => Promise<any>;
        calculateStackingPenalties: (modules: any[]) => Promise<any>;
        getStackingPenaltyTable: (modules: any[]) => Promise<any>;
        getAlternativeShips: (currentShipTypeId: number, activity: string, budget?: number) => Promise<any>;
        getShipComparison: (shipTypeIds: number[], activity: string) => Promise<any>;
        getMarketInsights: (typeIds: number[]) => Promise<any>;
        getBudgetRecommendations: (activity: string, maxBudget: number) => Promise<any>;
        getSkillGapAnalysis: (shipTypeId: number, targetFitting: any[]) => Promise<any>;
        getRecommendationMetrics: () => Promise<any>;
      };
    };
  }
}

export {};