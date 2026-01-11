# Crypto City Game Mechanics

## Overview
Crypto City is an isometric city-building game with DeFi protocol integration.

## Buildings

### Standard Buildings
- **Residential**: Houses, apartments - generate population
- **Commercial**: Shops, offices - generate income
- **Industrial**: Factories - produce resources

### DeFi Protocol Buildings
- **DEX (Exchange)**: Swap visualization, liquidity pools
- **Lending Protocol**: Borrow/lend mechanics, interest rates
- **Staking Hub**: Stake tokens, earn rewards
- **Yield Farm**: LP token staking, farming rewards

### CT Culture Buildings
- **Meme Billboard**: Display trending memes
- **Twitter/X Hub**: Social feed integration
- **Community Center**: DAO governance building

## Game Economy

### Resources
- `$CITY` - Main currency
- `Population` - Worker count
- `Energy` - Power for buildings

### Income Generation
```
Income = Σ(building.output × population_modifier × time)
```

## Building Placement
- Grid-based 64x64 tile system
- Multi-tile buildings (1x1 to 4x4)
- Collision detection for placement validation
- Snap-to-grid with visual preview

## Controls
- **Click**: Select/place building
- **Drag**: Pan camera
- **Scroll**: Zoom in/out
- **R**: Rotate building
