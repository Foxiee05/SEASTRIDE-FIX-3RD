import fs from 'fs';

let content = fs.readFileSync('src/components/RaidBossScreen.tsx', 'utf8');

// Use regex to replace these strings ignoring surrounding whitespaces
const replacements = [
  [/5 Stage Milestones \+ Final Victory Rewards/g, '{t("stage_milestones")}'],
  [/>\s*YOU\s*</g, '>{t("you").toUpperCase()}<'],
  [/>\s*Claimed\s*</g, '>{t("claimed")}<'],
  [/>\s*Claim!\s*</g, '>{t("claim_excl")}<'],
  [/>\s*Missed\s*</g, '>{t("missed")}<'],
  [/>\s*Deal Dmg First\s*</g, '>{t("deal_dmg_first")}<'],
  [/>\s*Locked\s*</g, '>{t("locked")}<'],
  [/>\s*Close\s*</g, '>{t("close")}<'],
  [/>\s*REWARD CLAIMED!\s*</g, '>{t("reward_claimed_excl")}<'],
  [/>\s*Collect Rewards\s*</g, '>{t("collect_rewards")}<'],
  [/>\s*Reward already claimed!\s*</g, '>{t("reward_already_claimed")}<'],
  [/>\s*Claim\s*</g, '>{t("claim")}<'],
  [/>\s*FINAL BOSS REWARD CLAIMED!\s*</g, '>{t("final_boss_reward_claimed")}<'],
  [/>\s*You contributed\s*</g, '>{t("you_contributed")}<'],
  [/>\s*Collect Final Reward\s*</g, '>{t("collect_final_reward")}<'],
  [/>\s*YOUR RAID DAMAGE\s*</g, '>{t("your_raid_damage")}<'],
  [/>\s*1 Walk Step = 1 HP\s*</g, '>{t("walk_step")}<']
];

for (const [regex, value] of replacements) {
    content = content.replace(regex, value);
}

fs.writeFileSync('src/components/RaidBossScreen.tsx', content);

let thContent = fs.readFileSync('src/components/TreasureHuntScreen.tsx', 'utf8');

const thReplacements = [
  [/>\s*Claim & Continue Hunting\s*</g, '>{t("claim_and_continue")}<'],
  [/>\s*Got It!\s*</g, '>{t("got_it")}<'],
  [/>\s*Close\s*</g, '>{t("close")}<'],
  [/>\s*2 KM RADAR\s*</g, '>{t("2_km_radar")}<'],
  [/>\s*LIVE GPS\s*</g, '>{t("live_gps")}<'],
  [/>\s*Daily Stash\s*</g, '>{t("daily_stash")}<'],
  [/>\s*You\s*</g, '>{t("you")}<'],
];

for (const [regex, value] of thReplacements) {
    thContent = thContent.replace(regex, value);
}

fs.writeFileSync('src/components/TreasureHuntScreen.tsx', thContent);
