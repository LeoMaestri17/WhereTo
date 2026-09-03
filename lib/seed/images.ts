/**
 * Every card in this app carries a real photograph — that is the layout. Images are stored as
 * Unsplash photo ids rather than full URLs so the renderer can ask for exactly the width it
 * needs, and so a failure has one place to fall back from (see components/SmartImage.tsx).
 *
 * Each id below was picked against its subject: the Zion photo is Zion, the Griffith photo is
 * the observatory. Swapping in a different photo library means changing `unsplashUrl` only.
 */

export type PhotoId = string;

const UNSPLASH_BASE = 'https://images.unsplash.com/';

export function unsplashUrl(id: PhotoId, width: number, height?: number): string {
  const params = new URLSearchParams({
    auto: 'format',
    fit: 'crop',
    w: String(width),
    q: '72',
  });
  if (height) params.set('h', String(height));
  return `${UNSPLASH_BASE}${id}?${params.toString()}`;
}

/* --------------------------------------------------------------- destinations */

export const PHOTOS = {
  // Day trips out of USC
  santaMonicaPier: 'photo-1514321648849-f4e1d5da98dc',
  santaMonicaBeach: 'photo-1624680511607-bc9387d2e906',
  malibuRoad: 'photo-1654652602981-6a0cbf20f23f',
  malibuBeach: 'photo-1577497997903-3cf7d4440507',
  griffithObservatory: 'photo-1546624356-62f238e38e2a',
  griffithAerial: 'photo-1572975165711-e9636eba67fc',
  huntingtonGarden: 'photo-1709889724410-32e44db96b95',
  japaneseGardenBridge: 'photo-1606481897791-d908424cc9d9',
  disneylandCastle: 'photo-1620055155785-2fc4acd747cb',
  basketballArena: 'photo-1583079806406-91731880e785',
  baseballStadium: 'photo-1651526863031-070aa9bdcb5a',
  artGallery: 'photo-1569783721854-33a99b4c0bae',
  galleryWall: 'photo-1735605917461-4c1b77a6616f',
  veniceBoardwalk: 'photo-1573397286878-0ff40aa140cd',
  venicePalms: 'photo-1725312198242-5fab9901c754',
  hollywoodSign: 'photo-1609924211018-5526c55bad5b',
  dtlaSkylineNight: 'photo-1444723121867-7a241cacace9',
  laFreewayNight: 'photo-1495430288918-03be19c7c485',

  // Weekend trips
  joshuaTree: 'photo-1596625820723-f0f481ff80be',
  joshuaTreeRocks: 'photo-1602857382419-d0fecdf159ef',
  zionRiver: 'photo-1524274165673-750e79bf7e2e',
  zionCanyon: 'photo-1443632864897-14973fa006cf',
  bigSurRoad: 'photo-1446630073557-fca43d580fbe',
  bigSurBridge: 'photo-1594731938743-978ea48d70fe',
  sanDiegoHarbour: 'photo-1519954352454-2d5a7353e277',
  sanDiegoCliffs: 'photo-1573177949680-4da865d64260',
  vegasStrip: 'photo-1581351721010-8cf859cb14a4',
  vegasFountain: 'photo-1668261929011-4ade8c225292',
  goldenGate: 'photo-1501594907352-04cda38ebc29',
  sanFranciscoBridge: 'photo-1516473344662-e3a32406ecad',

  // Thanksgiving break
  newYorkAutumn: 'photo-1512872942423-e9877d94e902',
  brooklynBridge: 'photo-1730471143394-06dbd849aa38',
  mexicoCityDome: 'photo-1547686669-9a8cb1a22d91',
  mexicoCityStreet: 'photo-1585464231875-d9ef1f5ad396',
  vancouverSkyline: 'photo-1559511260-66a654ae982a',
  vancouverMountains: 'photo-1660143158587-bddffa026e06',
  desertHighway: 'photo-1690644932424-63fdff67172d',
  grandCanyon: 'photo-1615551043360-33de8b5f410c',
  antelopeCanyon: 'photo-1534868489953-ef37c20abb25',
  desertCamp: 'photo-1712959111922-6ea8627ab383',

  // Activities and events
  hikingTrail: 'photo-1566353820666-883ec100f41b',
  hikingHills: 'photo-1711602613624-c120441cac86',
  surfing: 'photo-1531352568100-8194a5f7a16e',
  surfBeach: 'photo-1613070561201-b0dccb982856',
  tacoStand: 'photo-1612208176815-e132bcf971b0',
  koreanBbq: 'photo-1661366394743-fe30fe478ef7',
  nightMarket: 'photo-1552912470-ee2e96439539',
  farmersMarket: 'photo-1526399743290-f73cb4022f48',
  concertCrowd: 'photo-1540039155733-5bb30b53aa14',
  smallVenue: 'photo-1565035010268-a3816f98589a',
  rooftopNight: 'photo-1573047330199-9a915400744f',
  thriftStore: 'photo-1521335629791-ce4aec67dd15',
  vintageRack: 'photo-1675537057604-cafeef78a3d6',
  cinema: 'photo-1688678004647-945d5aaf91c1',
  campusWalk: 'photo-1576495199011-eb94736d05d6',
  campusLawn: 'photo-1577985043696-8bd54d9f093f',
  conferenceTalk: 'photo-1544531586-fde5298cdd40',
  conferenceRoom: 'photo-1531058020387-3be344556be6',
  beachCleanup: 'photo-1565803974275-dccd2f933cbb',
  yogaBeach: 'photo-1585059896947-f99dd6c80101',
} as const;

export type PhotoKey = keyof typeof PHOTOS;

/* --------------------------------------------------------------- portraits */

/** 25 portraits, one per seeded cohort member. Order is stable so avatars never shuffle. */
export const PORTRAITS: PhotoId[] = [
  'photo-1534528741775-53994a69daeb',
  'photo-1583692331507-fc0bd348695d',
  'photo-1506863530036-1efeddceb993',
  'photo-1545996124-0501ebae84d0',
  'photo-1521146764736-56c929d59c83',
  'photo-1542909168-82c3e7fdca5c',
  'photo-1552699611-e2c208d5d9cf',
  'photo-1614321375197-c5083895b054',
  'photo-1520529277867-dbf8c5e0b340',
  'photo-1541112324160-e8a425b58dac',
  'photo-1518305860742-0d7119d4567f',
  'photo-1600603406200-5b2a104684ac',
  'photo-1582308280652-03b96657ae28',
  'photo-1615327388641-203faee20165',
  'photo-1633355130553-2d90ad3507d3',
  'photo-1628619488538-f4ce88739f56',
  'photo-1544005313-94ddf0286df2',
  'photo-1629902077041-5509cf0a1a20',
  'photo-1438761681033-6461ffad8d80',
  'photo-1592568454695-4b39d56a2310',
  'photo-1568038479111-87bf80659645',
  'photo-1627778656986-d101645f17e6',
  'photo-1499996860823-5214fcc65f8f',
  'photo-1587397845856-e6cf49176c70',
  'photo-1601412436009-d964bd02edbc',
];
