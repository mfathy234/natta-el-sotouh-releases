/* UI text, Arabic first (Egyptian dialect) then English. {0} {1} are filled by t(key, a, b). */

const STR = {
  title: ['نطّة السطوح', 'Natta El Sotouh'],
  tagline: ['اطلع السطوح يا معلّم!', 'Bounce up to the rooftops!'],
  play: ['يلا', 'Play'],
  heroes: ['الشخصيات', 'Heroes'],
  controls: ['التحكم', 'Controls'],
  ctrl_drag: ['سحب الصباع', 'Drag'],
  ctrl_tilt: ['إمالة الموبايل', 'Tilt'],
  ctrl_buttons: ['زرارين', 'Buttons'],
  ctrl_mouse: ['الماوس', 'Mouse'],
  on: ['شغّالة', 'On'],
  off: ['مقفولة', 'Off'],
  langBtn: ['English', 'عربي'],
  best: ['أحسن ارتفاع', 'Best height'],
  coins: ['العملات', 'Coins'],
  m: ['م', 'm'],
  hint_drag: ['اسحب صباعك يمين وشمال', 'Drag your finger left and right'],
  hint_tilt: ['أمِل الموبايل يمين وشمال', 'Tilt your phone left and right'],
  hint_buttons: ['اضغط على اليمين أو الشمال', 'Tap the right or left side'],
  hint_mouse: ['حرّك الماوس يمين وشمال', 'Move the mouse left and right'],
  hint_keys: ['الأسهم أو A / D', 'Arrow keys or A / D'],
  paused: ['وقفة', 'Paused'],
  resume: ['كمّل', 'Resume'],
  menu: ['القايمة', 'Menu'],
  retry: ['تاني', 'Again'],
  height: ['الارتفاع', 'Height'],
  earned: ['عملات الجولة', 'Coins this run'],
  newBest: ['رقم قياسي جديد!', 'New best!'],
  bestIs: ['الأحسن: {0}', 'Best: {0}'],
  back: ['رجوع', 'Back'],
  current: ['الحالي', 'Current'],
  choose: ['اختار', 'Choose'],
  unlockWith: ['افتح بـ {0} عملة', 'Unlock for {0} coins'],
  orReach: ['أو اوصل {0}', 'or reach {0}'],
  unlockedNow: ['اتفتحت بالرقم القياسي!', 'Unlocked by your score!'],
  confirmTitle: ['تفتح {0}؟', 'Unlock {0}?'],
  confirmBody: ['هتدفع {0} عملة وتبقى معاك على طول.', 'You pay {0} coins and keep her for good.'],
  confirmBtn: ['افتح {0} · {1} عملة', 'Unlock {0} · {1} coins'],
  cancel: ['لأ، خلاص', 'Never mind'],
  poor: ['العملات مش كفاية', 'Not enough coins'],
  mute: ['كتم الصوت', 'Mute'],
  pause: ['وقفة', 'Pause'],
  tiltDenied: ['الموبايل مرضيش يسمح بالإمالة', 'Tilt was not allowed on this phone'],
  kite: ['طيارة ورق!', 'Kite!'],
  ful: ['فول! نطّات أعلى', 'Ful! Higher bounces'],
  bead: ['الخرزة بتحميك', 'The bead protects you'],
  shieldBroke: ['الخرزة شالت عنك الضربة', 'The bead took the hit']
};

const LANG = { cur: 'ar' };

function toArabicDigits(s) { return String(s).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]); }
/** Format a number for the current language (Arabic-Indic digits in Arabic). */
const nf = n => (LANG.cur === 'ar' ? toArabicDigits(n) : String(n));

function t(key, ...args) {
  const row = STR[key];
  if (!row) return key;
  const s = row[LANG.cur === 'ar' ? 0 : 1];
  return s.replace(/\{(\d)\}/g, (_, i) => (args[i] == null ? '' : args[i]));
}
const pick = row => (LANG.cur === 'ar' ? row.ar : row.en);
