import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ShipBrowser from './pages/ShipBrowser';
import ModuleBrowser from './pages/ModuleBrowser';
import FittingRecommendations from './pages/FittingRecommendations';
import FittingAssistant from './pages/FittingAssistant';
import SkillPlanner from './pages/SkillPlanner';
import Character from './pages/Character';
import Settings from './pages/Settings';
import MarketAnalytics from './pages/MarketAnalytics';
import IndustryManagement from './pages/IndustryManagement';
import CombatAnalytics from './pages/CombatAnalytics';
import CommunicationHub from './pages/CommunicationHub';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/ships" element={<ShipBrowser />} />
      <Route path="/modules" element={<ModuleBrowser />} />
      <Route path="/fitting-recommendations" element={<FittingRecommendations />} />
      <Route path="/fitting-assistant" element={<FittingAssistant />} />
      <Route path="/skill-planner" element={<SkillPlanner />} />
      <Route path="/character" element={<Character />} />
      <Route path="/market-analytics" element={<MarketAnalytics />} />
      <Route path="/industry-management" element={<IndustryManagement />} />
      <Route path="/combat-analytics" element={<CombatAnalytics />} />
      <Route path="/communication-hub" element={<CommunicationHub />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
};

export default AppRoutes;