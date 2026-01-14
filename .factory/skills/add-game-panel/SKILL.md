---
name: add-game-panel
description: Create a new dialog panel with state management. Use when adding settings, stats, or feature panels to the game UI.
---

# Add Game Panel

Complete workflow for adding a new dialog panel to CryptoCity.

## Inputs Required

| Input | Description | Example |
|-------|-------------|---------|
| Panel Name | PascalCase name | "AchievementsPanel" |
| Panel ID | lowercase identifier | "achievements" |
| Purpose | What the panel does | "Display unlocked achievements" |
| State Needed | What data to display | "achievements list, unlock dates" |

## Steps

### 1. Create Panel Component

Create `src/components/game/panels/AchievementsPanel.tsx`:

```typescript
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGame } from '@/context/GameContext';

interface AchievementsPanelProps {
  onClose: () => void;
}

export function AchievementsPanel({ onClose }: AchievementsPanelProps) {
  const { state } = useGame();
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Achievements</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Panel content here */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 2. Export from Index

Edit `src/components/game/panels/index.ts`:

```typescript
// Add to exports
export { AchievementsPanel } from './AchievementsPanel';
```

### 3. Add Panel Type

Edit `src/components/game/types.ts`:

```typescript
export type PanelType = 
  | 'none'
  | 'budget'
  // ... existing panels
  | 'achievements';  // Add new panel
```

### 4. Add to Game Component

Edit `src/components/Game.tsx`:

```typescript
import { AchievementsPanel } from './game/panels';

// In the render, add conditional:
{activePanel === 'achievements' && (
  <AchievementsPanel onClose={() => setActivePanel('none')} />
)}
```

### 5. Add Trigger Button

**Option A: Sidebar (Desktop)**

Edit `src/components/game/Sidebar.tsx`:

```typescript
<Button
  variant="ghost"
  onClick={() => setActivePanel('achievements')}
>
  <Trophy className="w-4 h-4 mr-2" />
  Achievements
</Button>
```

**Option B: Mobile Toolbar**

Edit `src/components/mobile/MobileToolbar.tsx`:

```typescript
{ id: 'achievements', icon: Trophy, label: 'Achievements' },
```

### 6. Write Tests

Create `tests/achievementsPanel.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('AchievementsPanel', () => {
  test('opens when clicking achievements button', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="achievements-button"]');
    await expect(page.locator('text=Achievements')).toBeVisible();
  });

  test('closes when clicking outside', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="achievements-button"]');
    await page.click('.fixed.inset-0'); // overlay
    await expect(page.locator('text=Achievements')).not.toBeVisible();
  });
});
```

### 7. Verify Integration

```bash
# Build check
npm run build

# Run tests
npx playwright test tests/achievementsPanel.spec.ts

# Visual verification
npm run dev
# Click button and verify panel opens/closes
```

## Panel Patterns

### With Tabs

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs defaultValue="all">
  <TabsList>
    <TabsTrigger value="all">All</TabsTrigger>
    <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
  </TabsList>
  <TabsContent value="all">...</TabsContent>
  <TabsContent value="unlocked">...</TabsContent>
</Tabs>
```

### With Data Table

```typescript
<ScrollArea className="h-[400px]">
  <table className="w-full">
    <thead>
      <tr>
        <th>Name</th>
        <th>Progress</th>
      </tr>
    </thead>
    <tbody>
      {items.map(item => (
        <tr key={item.id}>
          <td>{item.name}</td>
          <td>{item.progress}%</td>
        </tr>
      ))}
    </tbody>
  </table>
</ScrollArea>
```

### With Form

```typescript
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

<form onSubmit={handleSubmit}>
  <Input value={value} onChange={e => setValue(e.target.value)} />
  <Slider value={[sliderValue]} onValueChange={([v]) => setSliderValue(v)} />
  <Button type="submit">Save</Button>
</form>
```

## Success Criteria

- [ ] Panel component created with correct structure
- [ ] Exported from panels/index.ts
- [ ] Panel type added to types.ts
- [ ] Conditional render added to Game.tsx
- [ ] Trigger button added to Sidebar/Toolbar
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Panel opens/closes correctly
- [ ] Panel content displays correctly

## Style Guidelines

- Use `max-w-2xl` for standard panels, `max-w-4xl` for wide content
- Add `max-h-[80vh] overflow-y-auto` for scrollable content
- Use `space-y-4` for consistent section spacing
- Match existing panel styling in project
