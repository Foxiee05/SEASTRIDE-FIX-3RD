import fs from 'fs';

let content = fs.readFileSync('src/components/TreasureHuntScreen.tsx', 'utf8');

const replacements = {
  ">Claim & Continue Hunting<": ">{t(\"claim_and_continue\")}<",
  ">Got It!<": ">{t(\"got_it\")}<",
  "* Secret item drops are unlisted from the shop catalog until plundered from a legendary chest. Once found, they immediately unlock in your decoration inventory.": "{t(\"treasure_drop_note\")}",
  ">Close<": ">{t(\"close\")}<",
  ">2 KM RADAR<": ">{t(\"2_km_radar\")}<",
  "Server: <span": "{t(\"server\")}: <span",
  "| Active:": "| {t(\"active\")}:",
  ">LIVE GPS<": ">{t(\"live_gps\")}<",
  ">Daily Stash<": ">{t(\"daily_stash\")}<",
  ">You<": ">{t(\"you\")}<",
};

for (const [key, value] of Object.entries(replacements)) {
    content = content.replaceAll(key, value);
}

fs.writeFileSync('src/components/TreasureHuntScreen.tsx', content);
