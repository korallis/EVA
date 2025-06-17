/**
 * Activity Selection Service - Core engine for EVE career guidance and skill recommendations
 * Analyzes all EVE activities and generates optimized skill plans for character progression
 */

export interface Activity {
  id: string;
  name: string;
  description: string;
  category: ActivityCategory;
  tiers: ActivityTier[];
  requiredSkills: SkillRequirement[];
  recommendedShips: RecommendedShip[];
  securityRequirements: SecurityRequirement;
  estimatedISKPerHour: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  tags: string[];
}

export interface ActivityTier {
  id: string;
  name: string;
  level: number;
  description: string;
  requirements: {
    minimumSP?: number;
    securityStatus?: number;
    standings?: { faction: string; minimum: number }[];
    certifications?: string[];
  };
  recommendedShips: RecommendedShip[];
  estimatedISKPerHour: number;
  skillBonusMultiplier: number;
}

export interface ActivityCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export interface SkillRequirement {
  skillId: number;
  skillName: string;
  minimumLevel: number;
  recommendedLevel: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  impact: 'Performance' | 'Access' | 'Safety' | 'Efficiency';
  description: string;
}

export interface RecommendedShip {
  typeId: number;
  typeName: string;
  effectiveness: number; // 0-100 score for this activity
  role: 'Primary' | 'Alternative' | 'Budget' | 'Advanced';
  requiredSkills: SkillRequirement[];
  estimatedCost: number;
  advantages: string[];
  disadvantages: string[];
}

export interface SecurityRequirement {
  allowedSecurity: 'Highsec' | 'Lowsec' | 'Nullsec' | 'Wormhole' | 'Any';
  warningLevel: 'Safe' | 'Moderate' | 'Dangerous' | 'Extreme';
  tips: string[];
}

export interface SkillPlan {
  id: string;
  name: string;
  activityId: string;
  targetTier?: string;
  targetShips: RecommendedShip[];
  skillPriorities: SkillPlanItem[];
  totalTrainingTime: number; // milliseconds
  milestones: SkillMilestone[];
  alternativePaths: AlternativePath[];
}

export interface SkillPlanItem {
  skillId: number;
  skillName: string;
  fromLevel: number;
  toLevel: number;
  trainingTime: number; // milliseconds
  priority: number; // 1-10, higher is more important
  prerequisiteIds: number[];
  impact: string;
  reasoning: string;
}

export interface SkillMilestone {
  name: string;
  description: string;
  trainingTimeFromStart: number;
  unlockedCapabilities: string[];
  skillsCompleted: number[];
}

export interface AlternativePath {
  name: string;
  description: string;
  skillPriorities: SkillPlanItem[];
  totalTrainingTime: number;
  tradeoffs: string[];
}

class ActivitySelectionService {
  private activities: Activity[] = [];
  private skillDatabase: Map<number, any> = new Map();
  private shipDatabase: Map<number, any> = new Map();

  constructor() {
    this.initializeActivities();
  }

  private initializeActivities() {
    this.activities = [
      // ==============================
      // MISSION RUNNING
      // ==============================
      {
        id: 'mission-running',
        name: 'Mission Running',
        description: 'Complete missions for NPC agents to earn ISK, loyalty points, and standings',
        category: {
          id: 'pve',
          name: 'PvE Combat',
          icon: '🎯',
          description: 'Player vs Environment combat activities',
          color: 'var(--accent-orange)'
        },
        tiers: [
          {
            id: 'level-1',
            name: 'Level 1 Missions',
            level: 1,
            description: 'Beginner missions in highsec, perfect for new pilots',
            requirements: {},
            recommendedShips: [
              { typeId: 588, typeName: 'Merlin', effectiveness: 85, role: 'Primary', requiredSkills: [], estimatedCost: 2000000, advantages: ['Cheap', 'Easy to fit'], disadvantages: ['Limited tank'] },
              { typeId: 589, typeName: 'Cormorant', effectiveness: 90, role: 'Primary', requiredSkills: [], estimatedCost: 5000000, advantages: ['Good damage', 'Drone bay'], disadvantages: ['Slow'] }
            ],
            estimatedISKPerHour: 15000000,
            skillBonusMultiplier: 1.0
          },
          {
            id: 'level-2',
            name: 'Level 2 Missions',
            level: 2,
            description: 'Intermediate missions requiring improved ships and skills',
            requirements: { minimumSP: 1000000 },
            recommendedShips: [
              { typeId: 621, typeName: 'Caracal', effectiveness: 88, role: 'Primary', requiredSkills: [], estimatedCost: 15000000, advantages: ['Excellent range', 'Good tank'], disadvantages: ['Application issues'] },
              { typeId: 620, typeName: 'Bellicose', effectiveness: 75, role: 'Alternative', requiredSkills: [], estimatedCost: 8000000, advantages: ['Target painting', 'Flexible'], disadvantages: ['Lower DPS'] }
            ],
            estimatedISKPerHour: 35000000,
            skillBonusMultiplier: 1.2
          },
          {
            id: 'level-3',
            name: 'Level 3 Missions',
            level: 3,
            description: 'Challenging missions requiring battlecruisers or skilled cruiser pilots',
            requirements: { minimumSP: 5000000 },
            recommendedShips: [
              { typeId: 622, typeName: 'Drake', effectiveness: 92, role: 'Primary', requiredSkills: [], estimatedCost: 80000000, advantages: ['Excellent tank', 'Long range'], disadvantages: ['Slow', 'Application'] },
              { typeId: 17715, typeName: 'Drake Navy Issue', effectiveness: 95, role: 'Advanced', requiredSkills: [], estimatedCost: 250000000, advantages: ['Superior stats', 'Versatile'], disadvantages: ['Expensive'] }
            ],
            estimatedISKPerHour: 65000000,
            skillBonusMultiplier: 1.5
          },
          {
            id: 'level-4',
            name: 'Level 4 Missions',
            level: 4,
            description: 'Elite missions requiring battleships and advanced skills',
            requirements: { minimumSP: 15000000 },
            recommendedShips: [
              { typeId: 624, typeName: 'Raven', effectiveness: 88, role: 'Primary', requiredSkills: [], estimatedCost: 180000000, advantages: ['High DPS', 'Good range'], disadvantages: ['Slow', 'Big target'] },
              { typeId: 17738, typeName: 'Raven Navy Issue', effectiveness: 94, role: 'Advanced', requiredSkills: [], estimatedCost: 450000000, advantages: ['Superior performance', 'Flexible'], disadvantages: ['Very expensive'] },
              { typeId: 17920, typeName: 'Golem', effectiveness: 98, role: 'Advanced', requiredSkills: [], estimatedCost: 2500000000, advantages: ['Marauder bonuses', 'Exceptional'], disadvantages: ['Requires advanced skills'] }
            ],
            estimatedISKPerHour: 120000000,
            skillBonusMultiplier: 2.0
          },
          {
            id: 'level-5',
            name: 'Level 5 Missions',
            level: 5,
            description: 'Extreme missions typically requiring multiple pilots or capitals',
            requirements: { minimumSP: 50000000 },
            recommendedShips: [
              { typeId: 17920, typeName: 'Golem', effectiveness: 85, role: 'Primary', requiredSkills: [], estimatedCost: 2500000000, advantages: ['Marauder bonuses'], disadvantages: ['Still challenging solo'] },
              { typeId: 23757, typeName: 'Phoenix', effectiveness: 95, role: 'Advanced', requiredSkills: [], estimatedCost: 4000000000, advantages: ['Dreadnought power'], disadvantages: ['Overkill, expensive'] }
            ],
            estimatedISKPerHour: 200000000,
            skillBonusMultiplier: 3.0
          }
        ],
        requiredSkills: [
          { skillId: 3300, skillName: 'Gunnery', minimumLevel: 3, recommendedLevel: 5, priority: 'Critical', impact: 'Performance', description: 'Core weapon skill for most mission ships' },
          { skillId: 3301, skillName: 'Missile Launcher Operation', minimumLevel: 3, recommendedLevel: 5, priority: 'Critical', impact: 'Performance', description: 'Essential for Caldari mission ships' },
          { skillId: 3348, skillName: 'Navigation', minimumLevel: 3, recommendedLevel: 4, priority: 'High', impact: 'Efficiency', description: 'Speed and agility for mission running' },
          { skillId: 3413, skillName: 'Shield Operation', minimumLevel: 3, recommendedLevel: 5, priority: 'High', impact: 'Safety', description: 'Shield tanking for most mission ships' }
        ],
        recommendedShips: [],
        securityRequirements: {
          allowedSecurity: 'Highsec',
          warningLevel: 'Safe',
          tips: ['Stay in 0.5+ security space', 'Watch for war declarations', 'Use overview settings optimized for NPCs']
        },
        estimatedISKPerHour: 80000000,
        difficulty: 'Beginner',
        tags: ['PvE', 'ISK Making', 'Safe', 'Solo']
      },

      // ==============================
      // MINING
      // ==============================
      {
        id: 'mining',
        name: 'Mining',
        description: 'Extract valuable ores and minerals from asteroids for industrial use',
        category: {
          id: 'industry',
          name: 'Industry',
          icon: '⛏️',
          description: 'Resource gathering and manufacturing',
          color: 'var(--accent-teal)'
        },
        tiers: [
          {
            id: 'venture-mining',
            name: 'Venture Mining',
            level: 1,
            description: 'Basic mining with the versatile Venture frigate',
            requirements: {},
            recommendedShips: [
              { typeId: 32880, typeName: 'Venture', effectiveness: 95, role: 'Primary', requiredSkills: [], estimatedCost: 800000, advantages: ['Built-in warp core stabs', 'Good for beginners'], disadvantages: ['Limited cargo'] }
            ],
            estimatedISKPerHour: 8000000,
            skillBonusMultiplier: 1.0
          },
          {
            id: 'barge-mining',
            name: 'Mining Barge Operations',
            level: 2,
            description: 'Professional mining with specialized barges',
            requirements: { minimumSP: 2000000 },
            recommendedShips: [
              { typeId: 17476, typeName: 'Procurer', effectiveness: 85, role: 'Primary', requiredSkills: [], estimatedCost: 25000000, advantages: ['High tank', 'Good for lowsec'], disadvantages: ['Low yield'] },
              { typeId: 17478, typeName: 'Retriever', effectiveness: 90, role: 'Primary', requiredSkills: [], estimatedCost: 30000000, advantages: ['Large ore hold'], disadvantages: ['Fragile'] },
              { typeId: 17480, typeName: 'Covetor', effectiveness: 95, role: 'Primary', requiredSkills: [], estimatedCost: 35000000, advantages: ['Highest yield'], disadvantages: ['Very fragile'] }
            ],
            estimatedISKPerHour: 25000000,
            skillBonusMultiplier: 1.5
          },
          {
            id: 'exhumer-mining',
            name: 'Exhumer Operations',
            level: 3,
            description: 'Elite mining with advanced exhumer ships',
            requirements: { minimumSP: 8000000 },
            recommendedShips: [
              { typeId: 22544, typeName: 'Skiff', effectiveness: 88, role: 'Primary', requiredSkills: [], estimatedCost: 350000000, advantages: ['Incredible tank', 'Good for hostile space'], disadvantages: ['Lower yield'] },
              { typeId: 22546, typeName: 'Mackinaw', effectiveness: 92, role: 'Primary', requiredSkills: [], estimatedCost: 400000000, advantages: ['Massive ore hold', 'Ice mining bonus'], disadvantages: ['Moderate tank'] },
              { typeId: 22548, typeName: 'Hulk', effectiveness: 98, role: 'Primary', requiredSkills: [], estimatedCost: 450000000, advantages: ['Maximum yield'], disadvantages: ['Paper thin tank'] }
            ],
            estimatedISKPerHour: 45000000,
            skillBonusMultiplier: 2.0
          },
          {
            id: 'capital-mining',
            name: 'Capital Mining',
            level: 4,
            description: 'Industrial scale mining with Rorqual support',
            requirements: { minimumSP: 50000000 },
            recommendedShips: [
              { typeId: 28352, typeName: 'Rorqual', effectiveness: 100, role: 'Advanced', requiredSkills: [], estimatedCost: 8000000000, advantages: ['Massive yield bonuses', 'Fleet support'], disadvantages: ['Huge target', 'Requires capital skills'] }
            ],
            estimatedISKPerHour: 150000000,
            skillBonusMultiplier: 3.0
          }
        ],
        requiredSkills: [
          { skillId: 3386, skillName: 'Mining', minimumLevel: 4, recommendedLevel: 5, priority: 'Critical', impact: 'Performance', description: 'Core mining skill for yield' },
          { skillId: 3389, skillName: 'Astrogeology', minimumLevel: 3, recommendedLevel: 5, priority: 'High', impact: 'Performance', description: 'Advanced mining techniques' },
          { skillId: 22578, skillName: 'Mining Barge', minimumLevel: 1, recommendedLevel: 4, priority: 'High', impact: 'Access', description: 'Required for mining barges' }
        ],
        recommendedShips: [],
        securityRequirements: {
          allowedSecurity: 'Any',
          warningLevel: 'Moderate',
          tips: ['Higher security = safer but lower value ores', 'Nullsec has the best ores but highest risk', 'Always align to a safe spot']
        },
        estimatedISKPerHour: 35000000,
        difficulty: 'Beginner',
        tags: ['Industry', 'Peaceful', 'ISK Making', 'Solo']
      },

      // ==============================
      // PVP COMBAT
      // ==============================
      {
        id: 'pvp-combat',
        name: 'PvP Combat',
        description: 'Engage in player vs player combat across various fleet sizes and tactics',
        category: {
          id: 'pvp',
          name: 'PvP Combat',
          icon: '⚔️',
          description: 'Player vs Player combat and warfare',
          color: '#ff4444'
        },
        tiers: [
          {
            id: 'frigate-pvp',
            name: 'Frigate PvP',
            level: 1,
            description: 'Fast-paced small ship combat, perfect for learning',
            requirements: {},
            recommendedShips: [
              { typeId: 587, typeName: 'Rifter', effectiveness: 85, role: 'Primary', requiredSkills: [], estimatedCost: 5000000, advantages: ['Classic brawler', 'Forgiving'], disadvantages: ['Outdated'] },
              { typeId: 598, typeName: 'Tristan', effectiveness: 90, role: 'Primary', requiredSkills: [], estimatedCost: 8000000, advantages: ['Drone damage', 'Versatile'], disadvantages: ['Squishy'] },
              { typeId: 11978, typeName: 'Dramiel', effectiveness: 95, role: 'Advanced', requiredSkills: [], estimatedCost: 80000000, advantages: ['Speed demon', 'Excellent solo'], disadvantages: ['Expensive'] }
            ],
            estimatedISKPerHour: 0, // PvP doesn't generate reliable ISK
            skillBonusMultiplier: 1.0
          },
          {
            id: 'cruiser-pvp',
            name: 'Cruiser PvP',
            level: 2,
            description: 'Medium-scale engagements with versatile cruiser platforms',
            requirements: { minimumSP: 5000000 },
            recommendedShips: [
              { typeId: 17918, typeName: 'Loki', effectiveness: 92, role: 'Advanced', requiredSkills: [], estimatedCost: 800000000, advantages: ['T3C versatility', 'Cloaking'], disadvantages: ['Very expensive'] },
              { typeId: 620, typeName: 'Bellicose', effectiveness: 78, role: 'Primary', requiredSkills: [], estimatedCost: 25000000, advantages: ['Target painting', 'Fleet support'], disadvantages: ['Lower solo power'] }
            ],
            estimatedISKPerHour: 0,
            skillBonusMultiplier: 1.5
          },
          {
            id: 'battleship-pvp',
            name: 'Battleship PvP',
            level: 3,
            description: 'Heavy combat with powerful battleship platforms',
            requirements: { minimumSP: 15000000 },
            recommendedShips: [
              { typeId: 24688, typeName: 'Typhoon Fleet Issue', effectiveness: 88, role: 'Primary', requiredSkills: [], estimatedCost: 400000000, advantages: ['High damage', 'Good tank'], disadvantages: ['Slow', 'Big target'] },
              { typeId: 17738, typeName: 'Raven Navy Issue', effectiveness: 85, role: 'Alternative', requiredSkills: [], estimatedCost: 450000000, advantages: ['Long range missiles'], disadvantages: ['Kiting vulnerable'] }
            ],
            estimatedISKPerHour: 0,
            skillBonusMultiplier: 2.0
          }
        ],
        requiredSkills: [
          { skillId: 3300, skillName: 'Gunnery', minimumLevel: 4, recommendedLevel: 5, priority: 'Critical', impact: 'Performance', description: 'Weapon damage and fitting' },
          { skillId: 3348, skillName: 'Navigation', minimumLevel: 4, recommendedLevel: 5, priority: 'Critical', impact: 'Performance', description: 'Speed and maneuverability' },
          { skillId: 3449, skillName: 'Capacitor Management', minimumLevel: 3, recommendedLevel: 4, priority: 'High', impact: 'Performance', description: 'Cap stability in combat' }
        ],
        recommendedShips: [],
        securityRequirements: {
          allowedSecurity: 'Any',
          warningLevel: 'Dangerous',
          tips: ['Expect to lose ships regularly', 'Practice in Faction Warfare first', 'Learn to manage risk vs reward']
        },
        estimatedISKPerHour: 0,
        difficulty: 'Intermediate',
        tags: ['PvP', 'Combat', 'High Risk', 'Skill Intensive']
      },

      // ==============================
      // EXPLORATION
      // ==============================
      {
        id: 'exploration',
        name: 'Exploration',
        description: 'Scan cosmic signatures for valuable sites, relics, and data',
        category: {
          id: 'exploration',
          name: 'Exploration',
          icon: '🔍',
          description: 'Discovering hidden sites and treasures',
          color: 'var(--primary-cyan)'
        },
        tiers: [
          {
            id: 'basic-scanning',
            name: 'Basic Scanning',
            level: 1,
            description: 'Learn to use probe scanners and find cosmic signatures',
            requirements: {},
            recommendedShips: [
              { typeId: 605, typeName: 'Imicus', effectiveness: 85, role: 'Primary', requiredSkills: [], estimatedCost: 5000000, advantages: ['Scanning bonuses', 'Cheap'], disadvantages: ['Fragile'] },
              { typeId: 606, typeName: 'Heron', effectiveness: 88, role: 'Primary', requiredSkills: [], estimatedCost: 6000000, advantages: ['Good scanning', 'Caldari reliability'], disadvantages: ['Weak combat'] }
            ],
            estimatedISKPerHour: 30000000,
            skillBonusMultiplier: 1.0
          },
          {
            id: 'covert-ops',
            name: 'Covert Operations',
            level: 2,
            description: 'Advanced exploration with cloaking and improved scanning',
            requirements: { minimumSP: 3000000 },
            recommendedShips: [
              { typeId: 11182, typeName: 'Buzzard', effectiveness: 95, role: 'Primary', requiredSkills: [], estimatedCost: 50000000, advantages: ['Covert cloak', 'Excellent scanning'], disadvantages: ['Zero combat ability'] },
              { typeId: 11188, typeName: 'Helios', effectiveness: 93, role: 'Alternative', requiredSkills: [], estimatedCost: 45000000, advantages: ['Fast align', 'Good scanning'], disadvantages: ['Paper thin'] }
            ],
            estimatedISKPerHour: 60000000,
            skillBonusMultiplier: 1.8
          },
          {
            id: 'wormhole-exploration',
            name: 'Wormhole Exploration',
            level: 3,
            description: 'Dangerous but lucrative exploration in wormhole space',
            requirements: { minimumSP: 8000000 },
            recommendedShips: [
              { typeId: 29248, typeName: 'Astero', effectiveness: 92, role: 'Primary', requiredSkills: [], estimatedCost: 120000000, advantages: ['Combat capable', 'Drone bay'], disadvantages: ['Expensive for an explorer'] },
              { typeId: 17918, typeName: 'Loki', effectiveness: 88, role: 'Advanced', requiredSkills: [], estimatedCost: 800000000, advantages: ['Can fight and explore', 'Very survivable'], disadvantages: ['Overkill and expensive'] }
            ],
            estimatedISKPerHour: 150000000,
            skillBonusMultiplier: 2.5
          }
        ],
        requiredSkills: [
          { skillId: 13278, skillName: 'Survey', minimumLevel: 3, recommendedLevel: 4, priority: 'Critical', impact: 'Access', description: 'Required for probe scanning' },
          { skillId: 25739, skillName: 'Archaeology', minimumLevel: 3, recommendedLevel: 4, priority: 'High', impact: 'Performance', description: 'Relic site hacking success' },
          { skillId: 21718, skillName: 'Hacking', minimumLevel: 3, recommendedLevel: 4, priority: 'High', impact: 'Performance', description: 'Data site hacking success' }
        ],
        recommendedShips: [],
        securityRequirements: {
          allowedSecurity: 'Any',
          warningLevel: 'Moderate',
          tips: ['Nullsec and wormholes have better loot', 'Always be ready to warp out', 'Use directional scanner constantly']
        },
        estimatedISKPerHour: 80000000,
        difficulty: 'Intermediate',
        tags: ['Exploration', 'Solo', 'ISK Making', 'Stealth']
      },

      // ==============================
      // TRADING
      // ==============================
      {
        id: 'trading',
        name: 'Trading',
        description: 'Buy low, sell high across EVE markets for profit',
        category: {
          id: 'business',
          name: 'Business',
          icon: '📈',
          description: 'Market trading and business operations',
          color: 'var(--accent-orange)'
        },
        tiers: [
          {
            id: 'station-trading',
            name: 'Station Trading',
            level: 1,
            description: 'Trade from a single station using market orders',
            requirements: {},
            recommendedShips: [], // No ships needed for station trading
            estimatedISKPerHour: 25000000,
            skillBonusMultiplier: 1.0
          },
          {
            id: 'regional-trading',
            name: 'Regional Trading',
            level: 2,
            description: 'Transport goods between systems and regions',
            requirements: { minimumSP: 2000000 },
            recommendedShips: [
              { typeId: 648, typeName: 'Badger', effectiveness: 80, role: 'Primary', requiredSkills: [], estimatedCost: 2000000, advantages: ['Large cargo', 'Cheap'], disadvantages: ['Slow', 'Vulnerable'] },
              { typeId: 649, typeName: 'Tayra', effectiveness: 85, role: 'Primary', requiredSkills: [], estimatedCost: 8000000, advantages: ['Better tank', 'Good cargo'], disadvantages: ['Still vulnerable'] }
            ],
            estimatedISKPerHour: 50000000,
            skillBonusMultiplier: 1.5
          },
          {
            id: 'hauling-operations',
            name: 'Hauling Operations',
            level: 3,
            description: 'Large scale freight operations with freighters',
            requirements: { minimumSP: 15000000 },
            recommendedShips: [
              { typeId: 20183, typeName: 'Charon', effectiveness: 95, role: 'Primary', requiredSkills: [], estimatedCost: 1200000000, advantages: ['Massive cargo', 'Good align'], disadvantages: ['Huge gank target'] },
              { typeId: 28850, typeName: 'Bowhead', effectiveness: 88, role: 'Alternative', requiredSkills: [], estimatedCost: 2500000000, advantages: ['Ship maintenance bay', 'Specialized'], disadvantages: ['Very expensive'] }
            ],
            estimatedISKPerHour: 100000000,
            skillBonusMultiplier: 2.0
          }
        ],
        requiredSkills: [
          { skillId: 16622, skillName: 'Trade', minimumLevel: 3, recommendedLevel: 5, priority: 'Critical', impact: 'Performance', description: 'More market orders' },
          { skillId: 18580, skillName: 'Broker Relations', minimumLevel: 3, recommendedLevel: 4, priority: 'High', impact: 'Efficiency', description: 'Lower broker fees' },
          { skillId: 16595, skillName: 'Accounting', minimumLevel: 3, recommendedLevel: 4, priority: 'High', impact: 'Efficiency', description: 'Lower transaction taxes' }
        ],
        recommendedShips: [],
        securityRequirements: {
          allowedSecurity: 'Any',
          warningLevel: 'Moderate',
          tips: ['Watch for freight ganks on trade routes', 'Use courier contracts for risky moves', 'Diversify your trading locations']
        },
        estimatedISKPerHour: 60000000,
        difficulty: 'Intermediate',
        tags: ['Business', 'ISK Making', 'Market', 'Low Risk']
      }
    ];
  }

  // Public API methods
  
  getActivities(): Activity[] {
    return this.activities;
  }

  getActivityById(id: string): Activity | undefined {
    return this.activities.find(activity => activity.id === id);
  }

  getActivitiesByCategory(categoryId: string): Activity[] {
    return this.activities.filter(activity => activity.category.id === categoryId);
  }

  getActivityCategories(): ActivityCategory[] {
    const categories = new Map<string, ActivityCategory>();
    this.activities.forEach(activity => {
      categories.set(activity.category.id, activity.category);
    });
    return Array.from(categories.values());
  }

  // Generate skill plan for a specific activity and tier
  generateSkillPlan(
    activityId: string, 
    tierId?: string, 
    characterSkills?: Map<number, number>, 
    characterAttributes?: any
  ): SkillPlan | null {
    const activity = this.getActivityById(activityId);
    if (!activity) return null;

    const tier = tierId ? activity.tiers.find(t => t.id === tierId) : activity.tiers[0];
    if (!tier) return null;

    // Combine activity and tier skill requirements
    const allRequiredSkills = [
      ...activity.requiredSkills,
      ...tier.recommendedShips.flatMap(ship => ship.requiredSkills)
    ];

    // Remove duplicates and prioritize
    const uniqueSkills = this.deduplicateSkills(allRequiredSkills);
    
    // Generate optimized training order
    const skillPriorities = this.optimizeSkillOrder(uniqueSkills, characterSkills, characterAttributes);
    
    // Calculate milestones
    const milestones = this.generateMilestones(skillPriorities, tier);
    
    // Generate alternative paths
    const alternativePaths = this.generateAlternativePaths(uniqueSkills, characterSkills);

    const totalTrainingTime = skillPriorities.reduce((total, skill) => total + skill.trainingTime, 0);

    return {
      id: `${activityId}-${tierId || 'default'}-${Date.now()}`,
      name: `${activity.name} - ${tier.name}`,
      activityId,
      targetTier: tierId,
      targetShips: tier.recommendedShips,
      skillPriorities,
      totalTrainingTime,
      milestones,
      alternativePaths
    };
  }

  // Analyze character suitability for activities
  analyzeCharacterFitness(characterSkills: Map<number, number>): ActivityAnalysis[] {
    return this.activities.map(activity => {
      const suitabilityScores = activity.tiers.map(tier => {
        const requiredSkills = [
          ...activity.requiredSkills,
          ...tier.recommendedShips.flatMap(ship => ship.requiredSkills)
        ];

        let totalScore = 0;
        let maxScore = 0;

        requiredSkills.forEach(skill => {
          const currentLevel = characterSkills.get(skill.skillId) || 0;
          const scoreWeight = this.getSkillPriorityWeight(skill.priority);
          
          totalScore += Math.min(currentLevel, skill.recommendedLevel) * scoreWeight;
          maxScore += skill.recommendedLevel * scoreWeight;
        });

        const suitabilityPercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
        
        return {
          tierId: tier.id,
          tierName: tier.name,
          suitabilityPercentage,
          canAccess: suitabilityPercentage >= 60, // Arbitrary threshold
          missingSkills: requiredSkills.filter(skill => 
            (characterSkills.get(skill.skillId) || 0) < skill.minimumLevel
          )
        };
      });

      const overallSuitability = suitabilityScores.reduce((sum, score) => 
        sum + score.suitabilityPercentage, 0) / suitabilityScores.length;

      return {
        activityId: activity.id,
        activityName: activity.name,
        overallSuitability,
        tierAnalysis: suitabilityScores,
        recommendedStartingTier: suitabilityScores.find(score => score.canAccess)?.tierId || activity.tiers[0].id
      };
    });
  }

  // Helper methods
  
  private deduplicateSkills(skills: SkillRequirement[]): SkillRequirement[] {
    const skillMap = new Map<number, SkillRequirement>();
    
    skills.forEach(skill => {
      const existing = skillMap.get(skill.skillId);
      if (!existing || this.getSkillPriorityWeight(skill.priority) > this.getSkillPriorityWeight(existing.priority)) {
        skillMap.set(skill.skillId, skill);
      }
    });
    
    return Array.from(skillMap.values());
  }

  private optimizeSkillOrder(
    skills: SkillRequirement[], 
    characterSkills?: Map<number, number>,
    characterAttributes?: any
  ): SkillPlanItem[] {
    // This is a simplified optimization - in a real implementation,
    // this would use complex algorithms to optimize for prerequisites,
    // training time, and impact on capability
    
    const mappedSkills = skills
      .map(skill => {
        const currentLevel = characterSkills?.get(skill.skillId) || 0;
        const targetLevel = skill.recommendedLevel;
        
        if (currentLevel >= targetLevel) {
          return null; // Skip already trained skills
        }

        return {
          skillId: skill.skillId,
          skillName: skill.skillName,
          fromLevel: currentLevel,
          toLevel: targetLevel,
          trainingTime: this.calculateTrainingTime(skill.skillId, currentLevel, targetLevel, characterAttributes),
          priority: this.getSkillPriorityWeight(skill.priority),
          prerequisiteIds: [], // Would be populated from SDE data
          impact: skill.impact,
          reasoning: skill.description
        };
      })
      .filter(item => item !== null) as SkillPlanItem[];
    
    return mappedSkills.sort((a, b) => b.priority - a.priority);
  }

  private calculateTrainingTime(skillId: number, fromLevel: number, toLevel: number, attributes?: any): number {
    // Simplified training time calculation
    // Real implementation would use EVE's actual SP requirements and attribute calculations
    const baseTime = 30 * 60 * 1000; // 30 minutes base per level
    const multiplier = Math.pow(2, toLevel - fromLevel);
    return baseTime * multiplier;
  }

  private getSkillPriorityWeight(priority: string): number {
    switch (priority) {
      case 'Critical': return 10;
      case 'High': return 7;
      case 'Medium': return 4;
      case 'Low': return 1;
      default: return 1;
    }
  }

  private generateMilestones(skillPriorities: SkillPlanItem[], tier: ActivityTier): SkillMilestone[] {
    // Generate meaningful training milestones
    const milestones: SkillMilestone[] = [];
    let cumulativeTime = 0;
    const criticalSkills = skillPriorities.filter(skill => skill.priority >= 7);
    
    if (criticalSkills.length > 0) {
      const firstMilestone = Math.floor(criticalSkills.length / 2);
      cumulativeTime = criticalSkills.slice(0, firstMilestone).reduce((sum, skill) => sum + skill.trainingTime, 0);
      
      milestones.push({
        name: 'Basic Competency',
        description: 'You can now attempt this activity with basic effectiveness',
        trainingTimeFromStart: cumulativeTime,
        unlockedCapabilities: [`Access to ${tier.name}`, 'Basic ship fitting options'],
        skillsCompleted: criticalSkills.slice(0, firstMilestone).map(skill => skill.skillId)
      });
    }

    return milestones;
  }

  private generateAlternativePaths(skills: SkillRequirement[], characterSkills?: Map<number, number>): AlternativePath[] {
    // Generate alternative training paths (e.g., different weapon systems, tank types)
    return [
      {
        name: 'Speed Focus',
        description: 'Prioritize mobility and speed over raw power',
        skillPriorities: [], // Would be populated with navigation-focused skills
        totalTrainingTime: 0,
        tradeoffs: ['Lower damage output', 'Better survivability', 'More versatile']
      },
      {
        name: 'Tank Focus', 
        description: 'Prioritize survivability over all else',
        skillPriorities: [], // Would be populated with tank-focused skills
        totalTrainingTime: 0,
        tradeoffs: ['Lower damage potential', 'Much safer', 'Longer mission times']
      }
    ];
  }
}

// Additional interfaces for character analysis
export interface ActivityAnalysis {
  activityId: string;
  activityName: string;
  overallSuitability: number; // 0-100 percentage
  tierAnalysis: TierAnalysis[];
  recommendedStartingTier: string;
}

export interface TierAnalysis {
  tierId: string;
  tierName: string;
  suitabilityPercentage: number;
  canAccess: boolean;
  missingSkills: SkillRequirement[];
}

// Export singleton instance
export const activitySelectionService = new ActivitySelectionService();