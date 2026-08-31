// Icônes de cultures (mêmes assets SVG/PNG que la PWA ingénieur agripilot-pwa).
import arachideIcon from '@/assets/icons/arachide.png';
import avocatIcon from '@/assets/icons/avocat.png';
import bananaIcon from '@/assets/icons/banana.svg';
import carotteIcon from '@/assets/icons/carottes.png';
import chouIcon from '@/assets/icons/chou.png';
import citronIcon from '@/assets/icons/citron-vert.png';
import cornIcon from '@/assets/icons/corn.svg';
import cucumberIcon from '@/assets/icons/cucumber.svg';
import eggplantIcon from '@/assets/icons/eggplant.svg';
import fonioIcon from '@/assets/icons/fonio.png';
import ignameIcon from '@/assets/icons/igname.png';
import lettuceIcon from '@/assets/icons/lettuce.svg';
import mangoIcon from '@/assets/icons/mango.svg';
import maniocIcon from '@/assets/icons/manioc.png';
import milletIcon from '@/assets/icons/millet.png';
import niebeIcon from '@/assets/icons/niebe.png';
import okraIcon from '@/assets/icons/okra.svg';
import onionIcon from '@/assets/icons/onion.svg';
import orangeIcon from '@/assets/icons/orange.svg';
import papayaIcon from '@/assets/icons/papaya.svg';
import patateDouceIcon from '@/assets/icons/patate-douce.png';
import pepperIcon from '@/assets/icons/pepper.svg';
import pineappleIcon from '@/assets/icons/pineapple.svg';
import pommeDeTerreIcon from '@/assets/icons/pomme-de-terre.png';
import riceIcon from '@/assets/icons/rice.svg';
import sojaIcon from '@/assets/icons/soja.png';
import sorghoIcon from '@/assets/icons/sorgho.png';
import tomatoIcon from '@/assets/icons/tomato.svg';
import waterMelonIcon from '@/assets/icons/water-melon.svg';

/**
 * Mapping clé-de-recherche → icône. La première entrée qui matche (par
 * `includes`) gagne — ordonné du plus spécifique au plus général pour éviter
 * qu'une clé courte (ex. "mil") n'intercepte une autre culture.
 */
const ICON_KEYS: Array<[string, string]> = [
  // Tubercules (clés longues en premier)
  ['pomme_de_terre', pommeDeTerreIcon],
  ['pomme-de-terre', pommeDeTerreIcon],
  ['pommedeterre', pommeDeTerreIcon],
  ['potato', pommeDeTerreIcon],
  ['patate_douce', patateDouceIcon],
  ['patate-douce', patateDouceIcon],
  ['patatedouce', patateDouceIcon],
  ['sweet_potato', patateDouceIcon],
  ['igname', ignameIcon],
  ['yam', ignameIcon],
  ['manioc', maniocIcon],
  ['cassava', maniocIcon],

  // Céréales (PNG)
  ['fonio', fonioIcon],
  ['sorgho', sorghoIcon],
  ['sorghum', sorghoIcon],
  ['millet', milletIcon],
  ['mil', milletIcon],

  // Légumineuses & oléagineux (PNG)
  ['arachide', arachideIcon],
  ['peanut', arachideIcon],
  ['niebe', niebeIcon],
  ['niébé', niebeIcon],
  ['cowpea', niebeIcon],
  ['soja', sojaIcon],
  ['soya', sojaIcon],
  ['soybean', sojaIcon],

  // Maraîchers racines / feuilles (PNG)
  ['carotte', carotteIcon],
  ['carottes', carotteIcon],
  ['carrot', carotteIcon],
  ['chou', chouIcon],
  ['cabbage', chouIcon],

  // Fruits ajoutés (PNG)
  ['avocat', avocatIcon],
  ['avocado', avocatIcon],
  ['citron', citronIcon],
  ['lime', citronIcon],
  ['lemon', citronIcon],

  // Céréales (SVG)
  ['riz', riceIcon],
  ['rice', riceIcon],
  ['mais', cornIcon],
  ['maïs', cornIcon],
  ['corn', cornIcon],

  // Fruits (SVG)
  ['ananas', pineappleIcon],
  ['pineapple', pineappleIcon],
  ['banane', bananaIcon],
  ['banana', bananaIcon],
  ['mangue', mangoIcon],
  ['mango', mangoIcon],
  ['papaye', papayaIcon],
  ['papaya', papayaIcon],
  ['orange', orangeIcon],

  // Maraîchers (SVG)
  ['tomate', tomatoIcon],
  ['tomato', tomatoIcon],
  ['aubergine', eggplantIcon],
  ['eggplant', eggplantIcon],
  ['oignon', onionIcon],
  ['onion', onionIcon],
  ['piment', pepperIcon],
  ['pepper', pepperIcon],
  ['concombre', cucumberIcon],
  ['cucumber', cucumberIcon],
  ['laitue', lettuceIcon],
  ['lettuce', lettuceIcon],
  ['gombo', okraIcon],
  ['okra', okraIcon],
  ['pasteque', waterMelonIcon],
  ['pastèque', waterMelonIcon],
  ['watermelon', waterMelonIcon],
];

/**
 * Icône la plus proche pour une clé/nom de culture (matching par sous-chaîne,
 * pour absorber `ananas_baronne`, `riz_pluvial`, …). Repli : ananas.
 */
export const getCropIcon = (cropKeyOrName: string): string => {
  const needle = cropKeyOrName.toLowerCase();
  for (const [key, icon] of ICON_KEYS) {
    if (needle.includes(key)) return icon;
  }
  return pineappleIcon;
};
