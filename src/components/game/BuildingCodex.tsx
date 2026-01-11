'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Search, X } from 'lucide-react';
import {
  BUILDING_DISPLAY_INFO,
  getAllCategories,
  getCategoryDisplayInfo,
  getBuildingsByCategory,
  type BuildingCategory,
  type BuildingDisplayInfo,
} from '@/games/isocity/types/buildingDisplayNames';
import type { BuildingType } from '@/games/isocity/types/buildings';

interface BuildingCodexProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BuildingEntryProps {
  buildingType: BuildingType;
  info: BuildingDisplayInfo;
  onClick: () => void;
  isSelected: boolean;
}

function BuildingEntry({ buildingType, info, onClick, isSelected }: BuildingEntryProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isSelected
          ? 'border-amber-500 bg-amber-500/10'
          : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{info.icon}</span>
        <span className="font-medium text-sm">{info.displayName}</span>
      </div>
      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{info.description}</p>
    </button>
  );
}

function BuildingDetails({ buildingType, info }: { buildingType: BuildingType; info: BuildingDisplayInfo }) {
  const categoryInfo = getCategoryDisplayInfo(info.category);
  
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-4xl">{info.icon}</span>
        <div>
          <h3 className="text-xl font-bold text-amber-400">{info.displayName}</h3>
          <Badge variant="outline" className="mt-1">
            {categoryInfo.icon} {categoryInfo.displayName}
          </Badge>
        </div>
      </div>
      
      {/* Description */}
      <div className="p-3 bg-gray-800/50 rounded-lg">
        <p className="text-sm text-gray-300">{info.description}</p>
      </div>
      
      {/* Lore */}
      <div className="border-l-2 border-amber-500/50 pl-3 py-2">
        <p className="text-sm italic text-gray-400">"{info.lore}"</p>
      </div>
      
      {/* Internal ID (for devs/advanced users) */}
      <div className="text-xs text-gray-600 font-mono">
        Internal ID: {buildingType}
      </div>
    </div>
  );
}

export function BuildingCodex({ isOpen, onClose }: BuildingCodexProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BuildingCategory | 'all'>('all');
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType | null>(null);
  
  const categories = useMemo(() => getAllCategories(), []);
  
  const filteredBuildings = useMemo(() => {
    const buildings = selectedCategory === 'all' 
      ? Object.keys(BUILDING_DISPLAY_INFO) as BuildingType[]
      : getBuildingsByCategory(selectedCategory);
    
    if (!search.trim()) return buildings;
    
    const searchLower = search.toLowerCase();
    return buildings.filter(type => {
      const info = BUILDING_DISPLAY_INFO[type];
      return (
        info.displayName.toLowerCase().includes(searchLower) ||
        info.description.toLowerCase().includes(searchLower) ||
        info.lore.toLowerCase().includes(searchLower) ||
        type.toLowerCase().includes(searchLower)
      );
    });
  }, [selectedCategory, search]);
  
  const selectedInfo = selectedBuilding ? BUILDING_DISPLAY_INFO[selectedBuilding] : null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 bg-gray-900 border-gray-700">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-500" />
              <DialogTitle className="text-xl">
                <span className="text-amber-400">THE GUIDE:</span>{' '}
                <span className="text-white">Building Codex</span>
              </DialogTitle>
            </div>
            <div className="text-xs text-gray-500 animate-pulse hover:text-amber-500 transition-colors">
              DON'T PANIC
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex h-[calc(100%-80px)]">
          {/* Left Panel - Building List */}
          <div className="w-1/2 border-r border-gray-700 flex flex-col">
            {/* Search */}
            <div className="p-3 border-b border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search buildings..."
                  className="pl-10 bg-gray-800 border-gray-600"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Category Tabs */}
            <div className="p-2 border-b border-gray-700 overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                  className="text-xs"
                >
                  All
                </Button>
                {categories.map(cat => {
                  const info = getCategoryDisplayInfo(cat);
                  return (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedCategory(cat)}
                      className="text-xs"
                    >
                      {info.icon}
                    </Button>
                  );
                })}
              </div>
            </div>
            
            {/* Building List */}
            <ScrollArea className="flex-1 p-2">
              <div className="grid gap-2">
                {filteredBuildings.map(type => (
                  <BuildingEntry
                    key={type}
                    buildingType={type}
                    info={BUILDING_DISPLAY_INFO[type]}
                    onClick={() => setSelectedBuilding(type)}
                    isSelected={selectedBuilding === type}
                  />
                ))}
                {filteredBuildings.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No buildings found</p>
                    <p className="text-xs mt-1">Try a different search term</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="p-2 border-t border-gray-700 text-xs text-gray-500 text-center">
              {filteredBuildings.length} buildings
            </div>
          </div>
          
          {/* Right Panel - Details */}
          <div className="w-1/2 bg-gray-800/30">
            {selectedBuilding && selectedInfo ? (
              <BuildingDetails buildingType={selectedBuilding} info={selectedInfo} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a building to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
