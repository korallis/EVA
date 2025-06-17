import { ipcMain } from 'electron';
import { ESI_CONFIG } from '../../../shared/constants';
import { authService } from './authHandlers';
import { esiCache, CACHE_CONFIGS } from '../../../services/cacheService';
import { esiService } from '../EsiService';

class ESIHandlers {
  constructor() {
    this.registerHandlers();
  }

  private registerHandlers() {
    ipcMain.handle('esi:getCharacterSkills', async (event, characterId?: string) => {
      console.log('🎓 Getting character skills...');
      
      const authData = authService.getAuthData();
      if (!authData) {
        throw new Error('Not authenticated');
      }
      
      const charId = characterId || authData.character_id.toString();
      
      return esiCache.getOrSet(`skills:${charId}`, async () => {
        try {
          const response = await fetch(
            `${ESI_CONFIG.BASE_URL}/characters/${charId}/skills/`,
            {
              headers: {
                'Authorization': `Bearer ${authData.access_token}`,
                'User-Agent': ESI_CONFIG.USER_AGENT
              }
            }
          );
          
          if (!response.ok) {
            throw new Error(`ESI request failed: ${response.status} ${response.statusText}`);
          }
          
          const skillsData = await response.json();
          console.log('✅ Skills retrieved:', skillsData.skills?.length || 0, 'skills');
          return skillsData;
        } catch (error) {
          console.error('❌ Failed to get character skills:', error);
          throw error;
        }
      }, CACHE_CONFIGS.ESI_SKILLS.ttl);
    });

    ipcMain.handle('esi:getCharacterSkillQueue', async (event, characterId?: string) => {
      console.log('📚 Getting character skill queue...');
      
      const authData = authService.getAuthData();
      if (!authData) {
        throw new Error('Not authenticated');
      }
      
      const charId = characterId || authData.character_id.toString();
      
      return esiCache.getOrSet(`queue:${charId}`, async () => {
        try {
          const response = await fetch(
            `${ESI_CONFIG.BASE_URL}/characters/${charId}/skillqueue/`,
            {
              headers: {
                'Authorization': `Bearer ${authData.access_token}`,
                'User-Agent': ESI_CONFIG.USER_AGENT
              }
            }
          );
          
          if (!response.ok) {
            throw new Error(`ESI request failed: ${response.status} ${response.statusText}`);
          }
          
          const queueData = await response.json();
          console.log('✅ Skill queue retrieved:', queueData.length || 0, 'skills in queue');
          return queueData;
        } catch (error) {
          console.error('❌ Failed to get skill queue:', error);
          throw error;
        }
      }, CACHE_CONFIGS.ESI_QUEUE.ttl);
    });

    ipcMain.handle('esi:getSkillTypes', async (event, skillIds: number[]) => {
      console.log('📖 Getting skill type information for', skillIds.length, 'skills...');
      
      try {
        const skillPromises = skillIds.map(async (skillId) => {
          const response = await fetch(
            `${ESI_CONFIG.BASE_URL}/universe/types/${skillId}/`,
            {
              headers: {
                'User-Agent': ESI_CONFIG.USER_AGENT
              }
            }
          );
          
          if (!response.ok) {
            console.warn(`⚠️ Failed to get skill type ${skillId}:`, response.status);
            return null;
          }
          
          const typeData = await response.json();
          return {
            type_id: skillId,
            name: typeData.name,
            description: typeData.description,
            group_id: typeData.group_id,
            published: typeData.published
          };
        });
        
        const skills = await Promise.all(skillPromises);
        const validSkills = skills.filter(skill => skill !== null);
        
        console.log('✅ Skill types retrieved:', validSkills.length, 'of', skillIds.length);
        return validSkills;
      } catch (error) {
        console.error('❌ Failed to get skill types:', error);
        throw error;
      }
    });

    ipcMain.handle('esi:getCharacterAssets', async (event, characterId?: string) => {
      console.log('📦 Getting character assets...');
      
      const authData = authService.getAuthData();
      if (!authData) {
        throw new Error('Not authenticated');
      }
      
      const charId = characterId || authData.character_id.toString();
      
      try {
        const response = await fetch(
          `${ESI_CONFIG.BASE_URL}/characters/${charId}/assets/`,
          {
            headers: {
              'Authorization': `Bearer ${authData.access_token}`,
              'User-Agent': ESI_CONFIG.USER_AGENT
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`ESI request failed: ${response.status} ${response.statusText}`);
        }
        
        const assets = await response.json();
        console.log('✅ Assets retrieved:', assets.length || 0, 'items');
        return assets;
      } catch (error) {
        console.error('❌ Failed to get character assets:', error);
        throw error;
      }
    });

    ipcMain.handle('esi:getCharacterWallet', async (event, characterId?: string) => {
      console.log('💰 Getting character wallet...');
      
      const authData = authService.getAuthData();
      if (!authData) {
        throw new Error('Not authenticated');
      }
      
      const charId = characterId || authData.character_id.toString();
      
      try {
        const response = await fetch(
          `${ESI_CONFIG.BASE_URL}/characters/${charId}/wallet/`,
          {
            headers: {
              'Authorization': `Bearer ${authData.access_token}`,
              'User-Agent': ESI_CONFIG.USER_AGENT
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`ESI request failed: ${response.status} ${response.statusText}`);
        }
        
        const balance = await response.json();
        console.log('✅ Wallet balance retrieved');
        return { balance };
      } catch (error) {
        console.error('❌ Failed to get character wallet:', error);
        throw error;
      }
    });

    ipcMain.handle('esi:getCharacterClones', async (event, characterId?: string) => {
      console.log('👥 Getting character clones...');
      try {
        return await esiService.getCharacterClones(characterId ? parseInt(characterId) : undefined);
      } catch (error) {
        console.error('❌ Failed to get character clones:', error);
        throw error;
      }
    });

    ipcMain.handle('esi:getCharacterImplants', async (event, characterId?: string) => {
      console.log('🔧 Getting character implants...');
      
      const authData = authService.getAuthData();
      if (!authData) {
        throw new Error('Not authenticated');
      }
      
      const charId = characterId || authData.character_id.toString();
      
      try {
        const response = await fetch(
          `${ESI_CONFIG.BASE_URL}/characters/${charId}/implants/`,
          {
            headers: {
              'Authorization': `Bearer ${authData.access_token}`,
              'User-Agent': ESI_CONFIG.USER_AGENT
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`ESI request failed: ${response.status} ${response.statusText}`);
        }
        
        const implants = await response.json();
        console.log('✅ Implants retrieved:', implants.length || 0, 'implants');
        return implants;
      } catch (error) {
        console.error('❌ Failed to get character implants:', error);
        throw error;
      }
    });

    ipcMain.handle('esi:getCharacterBlueprints', async (event, characterId?: string) => {
      console.log('📐 Getting character blueprints...');
      
      const authData = authService.getAuthData();
      if (!authData) {
        throw new Error('Not authenticated');
      }
      
      const charId = characterId || authData.character_id.toString();
      
      try {
        const response = await fetch(
          `${ESI_CONFIG.BASE_URL}/characters/${charId}/blueprints/`,
          {
            headers: {
              'Authorization': `Bearer ${authData.access_token}`,
              'User-Agent': ESI_CONFIG.USER_AGENT
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`ESI request failed: ${response.status} ${response.statusText}`);
        }
        
        const blueprints = await response.json();
        console.log('✅ Blueprints retrieved:', blueprints.length || 0, 'blueprints');
        return blueprints;
      } catch (error) {
        console.error('❌ Failed to get character blueprints:', error);
        throw error;
      }
    });

    // ==============================
    // NEW ESI ENDPOINTS (Using Enhanced EsiService)
    // ==============================

    // Market Endpoints (High Priority)
    ipcMain.handle('esi:getCharacterMarketOrders', async (event, characterId?: string) => {
      console.log('📈 Getting character market orders...');
      try {
        return await esiService.getCharacterMarketOrders(characterId ? parseInt(characterId) : undefined);
      } catch (error) {
        console.error('❌ Failed to get character market orders:', error);
        throw error;
      }
    });

    ipcMain.handle('esi:getCharacterMarketOrderHistory', async (event, characterId?: string, page?: number) => {
      console.log('📊 Getting character market order history...');
      try {
        return await esiService.getCharacterMarketOrderHistory(characterId ? parseInt(characterId) : undefined, page);
      } catch (error) {
        console.error('❌ Failed to get character market order history:', error);
        throw error;
      }
    });

    ipcMain.handle('esi:getRegionalMarketOrders', async (event, regionId: number, typeId?: number, page?: number) => {
      console.log('🏪 Getting regional market orders...');
      try {
        return await esiService.getRegionalMarketOrders(regionId, typeId, page);
      } catch (error) {
        console.error('❌ Failed to get regional market orders:', error);
        throw error;
      }
    });

    ipcMain.handle('esi:getMarketPrices', async () => {
      console.log('💰 Getting market prices...');
      try {
        return await esiService.getMarketPrices();
      } catch (error) {
        console.error('❌ Failed to get market prices:', error);
        throw error;
      }
    });

    ipcMain.handle('esi:getMarketHistory', async (event, regionId: number, typeId: number) => {
      console.log('📈 Getting market history...');
      try {
        return await esiService.getMarketHistory(regionId, typeId);
      } catch (error) {
        console.error('❌ Failed to get market history:', error);
        throw error;
      }
    });

    // Wallet Endpoints (High Priority)
    ipcMain.handle('esi:getCharacterWalletJournal', async (event, characterId?: string, page?: number) => {
      console.log('📋 Getting character wallet journal...');
      try {
        return await esiService.getCharacterWalletJournal(characterId ? parseInt(characterId) : undefined, page);
      } catch (error) {
        console.error('❌ Failed to get character wallet journal:', error);
        throw error;
      }
    });

    ipcMain.handle('esi:getCharacterWalletTransactions', async (event, characterId?: string) => {
      console.log('💸 Getting character wallet transactions...');
      try {
        return await esiService.getCharacterWalletTransactions(characterId ? parseInt(characterId) : undefined);
      } catch (error) {
        console.error('❌ Failed to get character wallet transactions:', error);
        throw error;
      }
    });

    // Industry Endpoints (High Priority)
    ipcMain.handle('esi:getCharacterIndustryJobs', async (event, characterId?: string, includeCompleted?: boolean) => {
      console.log('🏭 Getting character industry jobs...');
      try {
        return await esiService.getCharacterIndustryJobs(characterId ? parseInt(characterId) : undefined, includeCompleted);
      } catch (error) {
        console.error('❌ Failed to get character industry jobs:', error);
        throw error;
      }
    });

    ipcMain.handle('esi:getCharacterMiningLedger', async (event, characterId?: string, page?: number) => {
      console.log('⛏️ Getting character mining ledger...');
      try {
        return await esiService.getCharacterMiningLedger(characterId ? parseInt(characterId) : undefined, page);
      } catch (error) {
        console.error('❌ Failed to get character mining ledger:', error);
        throw error;
      }
    });

    // Contracts Endpoints (Medium Priority)
    ipcMain.handle('esi:getCharacterContracts', async (event, characterId?: string, page?: number) => {
      console.log('📋 Getting character contracts...');
      try {
        return await esiService.getCharacterContracts(characterId ? parseInt(characterId) : undefined, page);
      } catch (error) {
        console.error('❌ Failed to get character contracts:', error);
        throw error;
      }
    });

    ipcMain.handle('esi:getContractItems', async (event, characterId: string, contractId: number) => {
      console.log('📦 Getting contract items...');
      try {
        return await esiService.getContractItems(Number(characterId), contractId);
      } catch (error) {
        console.error('❌ Failed to get contract items:', error);
        throw error;
      }
    });

    // Mail Endpoints (Medium Priority)
    ipcMain.handle('esi:getCharacterMail', async (event, characterId?: string, lastMailId?: number) => {
      console.log('📧 Getting character mail...');
      try {
        return await esiService.getCharacterMail(characterId ? parseInt(characterId) : undefined, lastMailId);
      } catch (error) {
        console.error('❌ Failed to get character mail:', error);
        throw error;
      }
    });

    // Contacts Endpoints (Medium Priority)
    ipcMain.handle('esi:getCharacterContacts', async (event, characterId?: string, page?: number) => {
      console.log('👥 Getting character contacts...');
      try {
        return await esiService.getCharacterContacts(characterId ? parseInt(characterId) : undefined, page);
      } catch (error) {
        console.error('❌ Failed to get character contacts:', error);
        throw error;
      }
    });

    // Killmails Endpoints (Medium Priority)
    ipcMain.handle('esi:getCharacterKillmails', async (event, characterId?: string, page?: number) => {
      console.log('⚔️ Getting character killmails...');
      try {
        return await esiService.getCharacterKillmails(characterId ? parseInt(characterId) : undefined, page);
      } catch (error) {
        console.error('❌ Failed to get character killmails:', error);
        throw error;
      }
    });

    ipcMain.handle('esi:getKillmailDetails', async (event, killmailId: number, hash: string) => {
      console.log('💀 Getting killmail details...');
      try {
        return await esiService.getKillmailDetails(killmailId, hash);
      } catch (error) {
        console.error('❌ Failed to get killmail details:', error);
        throw error;
      }
    });

    // Enhanced API methods that need proper handlers
    ipcMain.handle('esi:getCharacterLocation', async (event, characterId?: string) => {
      console.log('📍 Getting character location...');
      try {
        return await esiService.getCharacterLocation(characterId ? parseInt(characterId) : undefined);
      } catch (error) {
        console.error('❌ Failed to get character location:', error);
        throw error;
      }
    });

    ipcMain.handle('esi:getCharacterShip', async (event, characterId?: string) => {
      console.log('🚀 Getting character ship...');
      try {
        return await esiService.getCharacterShip(characterId ? parseInt(characterId) : undefined);
      } catch (error) {
        console.error('❌ Failed to get character ship:', error);
        throw error;
      }
    });

    ipcMain.handle('esi:getCorporationInfo', async (event, corporationId: number) => {
      console.log('🏢 Getting corporation info...');
      try {
        return await esiService.getCorporationInfo(corporationId);
      } catch (error) {
        console.error('❌ Failed to get corporation info:', error);
        throw error;
      }
    });

    ipcMain.handle('esi:getCharacterCorporationHistory', async (event, characterId?: string) => {
      console.log('🏢 Getting character corporation history...');
      try {
        return await esiService.getCharacterCorporationHistory(characterId ? parseInt(characterId) : undefined);
      } catch (error) {
        console.error('❌ Failed to get character corporation history:', error);
        throw error;
      }
    });

    ipcMain.handle('esi:getEnhancedCharacterClones', async (event, characterId?: string) => {
      console.log('🧬 Getting enhanced character clones...');
      try {
        return await esiService.getEnhancedCharacterClones(characterId ? parseInt(characterId) : undefined);
      } catch (error) {
        console.error('❌ Failed to get enhanced character clones:', error);
        throw error;
      }
    });

    ipcMain.handle('esi:getSystemInfo', async (event, systemId: number) => {
      console.log('🌌 Getting system info...');
      try {
        return await esiService.getSystemInfo(systemId);
      } catch (error) {
        console.error('❌ Failed to get system info:', error);
        throw error;
      }
    });

    ipcMain.handle('esi:getStationInfo', async (event, stationId: number) => {
      console.log('🏢 Getting station info...');
      try {
        return await esiService.getStationInfo(stationId);
      } catch (error) {
        console.error('❌ Failed to get station info:', error);
        throw error;
      }
    });

    // Comprehensive Data Refresh
    ipcMain.handle('esi:refreshEnhancedCharacterData', async (event, characterId?: string) => {
      console.log('🔄 Refreshing enhanced character data...');
      try {
        return await esiService.refreshEnhancedCharacterData(characterId ? parseInt(characterId) : undefined);
      } catch (error) {
        console.error('❌ Failed to refresh enhanced character data:', error);
        throw error;
      }
    });
  }
}

export const esiHandlers = new ESIHandlers();