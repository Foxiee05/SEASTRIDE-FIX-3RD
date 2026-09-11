import fs from 'fs';

const content = fs.readFileSync('src/utils/translations.ts', 'utf8');

const englishAdditions = `
    every_footstep_deals: "Every footstep deals",
    hp_damage: "1 HP damage",
    to_the_leviathan: "to the leviathan and earns you a share of the sealed bounty!",
    switch_server: "Switch Server",
    fleet_damage_rankings: "Fleet Damage Rankings",
    raid_milestone_rewards: "Raid Milestone Rewards",
    stage_milestones: "5 Stage Milestones + Final Victory Rewards",
    your_dmg: "Your Dmg:",
    missed: "Missed",
    deal_dmg_first: "Deal Dmg First",
    reward_claimed_excl: "REWARD CLAIMED!",
    collect_rewards: "Collect Rewards",
    reward_already_claimed: "Reward already claimed!",
    deal_at_least_1_hp: "Deal at least 1 HP damage in battle to claim!",
    need_paren: "(Need",
    final_boss_reward_claimed: "FINAL BOSS REWARD CLAIMED!",
    you_contributed: "You contributed",
    collect_final_reward: "Collect Final Reward",
    your_raid_damage: "YOUR RAID DAMAGE",
    walk_step: "1 Walk Step = 1 HP",
    claim_excl: "Claim!",
`;

const vietnameseAdditions = `
    every_footstep_deals: "Mỗi bước đi gây",
    hp_damage: "1 HP sát thương",
    to_the_leviathan: "lên quái vật và nhận tỷ lệ phần thưởng bị phong ấn!",
    switch_server: "Đổi Máy Chủ",
    fleet_damage_rankings: "Xếp Hạng Sát Thương Hạm Đội",
    raid_milestone_rewards: "Phần Thưởng Cột Mốc Đột Kích",
    stage_milestones: "5 Cột Mốc + Phần Thưởng Chiến Thắng Cuối",
    your_dmg: "ST của bạn:",
    missed: "Đã Lỡ",
    deal_dmg_first: "Cần Đánh Trước",
    reward_claimed_excl: "ĐÃ NHẬN THƯỞNG!",
    collect_rewards: "Nhận Phần Thưởng",
    reward_already_claimed: "Phần thưởng đã được nhận!",
    deal_at_least_1_hp: "Gây ít nhất 1 HP sát thương trong trận chiến để nhận!",
    need_paren: "(Cần",
    final_boss_reward_claimed: "ĐÃ NHẬN THƯỞNG TIÊU DIỆT TRÙM!",
    you_contributed: "Bạn đã đóng góp",
    collect_final_reward: "Nhận Phần Thưởng Cuối",
    your_raid_damage: "SÁT THƯƠNG ĐỘT KÍCH CỦA BẠN",
    walk_step: "1 Bước Đi = 1 HP",
    claim_excl: "Nhận!",
`;

// Find where to insert English additions
const englishMatch = content.match(/claim_and_continue: "Claim & Continue Hunting",/);
let newContent = content.replace(
    'claim_and_continue: "Claim & Continue Hunting",',
    englishAdditions + '\n    claim_and_continue: "Claim & Continue Hunting",'
);

// Find where to insert Vietnamese additions
newContent = newContent.replace(
    'claim_and_continue: "Nhận & Tiếp Tục Săn",',
    vietnameseAdditions + '\n    claim_and_continue: "Nhận & Tiếp Tục Săn",'
);

fs.writeFileSync('src/utils/translations.ts', newContent);
