# Clashline Arena

A polished 1v1 fighting game starter made with plain JavaScript + Canvas.

## What is already in this prototype

- Menu flow: title, mode select, fighter select, stage select, match, results
- Modes:
  - Versus (2 local players)
  - Arcade (Player 1 vs CPU)
  - Training (infinite timer + quick reset)
- 2 photo-based fighters with distinct speed/power/defense stats
- 3 stylized stages with procedural texture layers
- Round system (best of 3), KO, time out, and win counters
- Arcade ladder progression (3 CPU stages + running score)
- Mid-match pickups (meter orb and heal orb)
- Built-in procedural audio: music, combat hits, UI clicks, KO and pickup SFX
- Core combat systems:
  - movement, jump, gravity
  - light/heavy/special attacks with hit stun
  - blocking + chip damage
  - simple combo counter
  - super meter + stronger special scaling
- Responsive UI/HUD and particle effects

## Run it

1. Open this folder in VS Code.
2. Add your uploaded fighter photos as:
  - `assets/fighter1.png`
  - `assets/fighter2.png`
3. Start any static server in this folder.
4. Open `index.html` in your browser.

Quick options:

- VS Code Live Server extension
- `python -m http.server 8080`
- `npx serve .`

## Audio

- Press `M` to mute/unmute all sound.
- Audio starts after your first key press (browser autoplay rules).

## Next upgrade ideas

- Add sprite sheets and frame-accurate hitboxes
- Add throw system and air attacks
- Add rollback/netcode architecture for online play
- Add story ladder and unlockable fighters
- Add sound effects and announcer voices
