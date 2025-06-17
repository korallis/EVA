import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import pages (to be created)
import Dashboard from '../pages/Dashboard';
import ShipBrowser from '../pages/ShipBrowser';
import ModuleBrowser from '../pages/ModuleBrowser';
import FittingRecommendations from '../pages/FittingRecommendations';
import SkillPlanner from '../pages/SkillPlanner';
import CharacterInfo from '../pages/CharacterInfo';
import Settings from '../pages/Settings';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/ships" element={<ShipBrowser />} />
      <Route path="/modules" element={<ModuleBrowser />} />
      <Route path="/fitting-recommendations" element={<FittingRecommendations />} />
      <Route path="/skill-planner" element={<SkillPlanner />} />
      <Route path="/character" element={<CharacterInfo />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
};

export default AppRoutes;