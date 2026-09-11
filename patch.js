const fs = require('fs');
const content = fs.readFileSync('src/utils/translations.ts', 'utf8');
const lines = content.split('\n');
const insertIndex = lines.findIndex(l => l.includes('your_damage_share: "Your Damage Share:"')) + 1;

const newLines = `
    claim_and_continue: "Claim & Continue Hunting",
    treasure_hunt_desc: "Each day, between 5 to 15 random treasures spawn exclusively within a 2 km radius of your coordinates and remain anchored in place for 24 hours.",
    treasure_hunt_radar_desc: "Track markers with your live radar and touch chests (≤45m) to plunder them before fellow captains on your server claim them!",
    treasure_drop_note: "* Secret item drops are unlisted from the shop catalog until plundered from a legendary chest. Once found, they immediately unlock in your decoration inventory.",
    live_gps: "LIVE GPS",
    chests_active: "{count} Chests",
    radar_located_msg: "{count} chest(s) located within 2km radar. Walk to touch & collect!",
    radar_scanning_msg: "📡 Radar scanning 2km radius around captain coordinates...",
    touching_chest: "✨ TOUCHING CHEST!",
    walk_within_45m: "Walk within 45m to claim",
    closest_target_desc: "Closest target on your 2 km radar",
    plunder_chest: "Plunder Chest!",
    todays_plundered_loot: "TODAY'S PLUNDERED LOOT",
    daily_stash: "Daily Stash",
    in_shop_inventory: "✓ In Shop Inventory",
    no_treasures_claimed_today: "No treasures claimed yet today. Walk towards the map icons to touch and collect!",
    no_treasure_activity_today: "No treasure activity on {server} yet today. Be the first to claim a chest!",
`.trim().split('\n');

lines.splice(insertIndex, 0, ...newLines);
fs.writeFileSync('src/utils/translations.ts', lines.join('\n'));
