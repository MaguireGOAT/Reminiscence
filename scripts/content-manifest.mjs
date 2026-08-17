import { readFileSync } from "node:fs";

const resolved = JSON.parse(readFileSync(new URL("./resolved-urls.json", import.meta.url), "utf8"));
const byTitle = new Map(resolved.map((entry) => [entry.title.replace(/^File:/, ""), entry]));

const source = (fileName) => {
  const match = byTitle.get(fileName);
  if (!match) throw new Error(`Missing resolved Commons entry: ${fileName}`);
  return match;
};

const photo = (fileName, localFile, title, year, sourceCredit) => {
  const info = source(fileName);
  return {
    kind: "photo",
    localFile,
    title,
    year,
    sourceCredit: sourceCredit || "Wikimedia Commons",
    sourceTitle: fileName,
    license: info.license,
    sourceUrl: info.page,
    sourceDownload: info.url,
    bytes: info.bytes
  };
};

const song = (fileName, localFile, title, theme) => {
  const info = source(fileName);
  return {
    kind: "song",
    localFile,
    title,
    theme,
    duration: Math.round(info.duration || 0),
    sourceCredit:
      info.credit?.startsWith("Recorded to wax by Berthold Laufer")
        ? "Wikimedia Commons：Berthold Laufer 錄音（1901年）"
        : info.artist || info.credit || "Uncredited",
    sourceTitle: fileName,
    license: info.license,
    sourceUrl: info.page,
    sourceDownload: info.url,
    bytes: info.bytes
  };
};

const video = (fileName, localFile, title, decade, place, theme, sourceCredit) => {
  const info = source(fileName);
  return {
    kind: "video",
    localFile,
    title,
    decade,
    place,
    theme,
    duration: Math.round((info.duration || 0) * 10) / 10,
    sourceCredit: sourceCredit || "Wikimedia Commons",
    sourceTitle: fileName,
    license: info.license,
    sourceUrl: info.page,
    sourceDownload: info.url,
    bytes: info.bytes
  };
};

const PHOTOS = [
  photo("德輔道中 Des Voeux Road Central, 1960s.jpg", "real-photos/photo-001.jpg", "德輔道中（1960年代）", "1960年代", "Wikimedia Commons：德輔道中（1960年代）"),
  photo("Star Ferry to Hong Kong Island (2886568028).jpg", "real-photos/photo-002.jpg", "天星小輪往中環", "2010年代", "Wikimedia Commons：Wpcpey"),
  photo("Woman working in wet market in Peng Chau, Hong Kong.jpg", "real-photos/photo-003.jpg", "坪洲街市賣魚", "2010年代", "Wikimedia Commons：Baycrest"),
  photo("HK 上環 Sheung Wan 歌賦街 Gough Street 美輪街 Mee Lun Street 勝香園 Shing Heung Yuen 大排檔 Dai pai Dong breakfast 早晨 morning February 2025 R12S 03.jpg", "real-photos/photo-004.jpg", "上環歌賦街大排檔", "2025年", "Wikimedia Commons：R12S"),
  photo("Hong Kong rooftop vc.jpg", "real-photos/photo-005.jpg", "唐樓天台晾衫", "2000年代", "Wikimedia Commons：Vmenkov"),
  photo("HK Kerosene Stove HuoShuiLu 火水爐 1.JPG", "real-photos/photo-006.jpg", "火水爐", "2010年代", "Wikimedia Commons：Ngchikit"),
  photo("An Old Shanghai Barber Shop in Hong Kong.jpg", "real-photos/photo-007.jpg", "舊式理髮店", "2010年代", "Wikimedia Commons：Dltl2010"),
  photo("Lai Afong, Cobbler, Hong Kong, c1870s.jpg", "real-photos/photo-008.jpg", "補鞋工匠（1870年代）", "1870年代", "Wikimedia Commons：Afong Studio"),
  photo("Glowing lanterns, Mid-Autumn Lantern Carnival 2012, Victoria Park (Hong Kong).jpg", "real-photos/photo-009.jpg", "維多利亞公園中秋燈飾", "2012年", "Wikimedia Commons：Wpcpey"),
  photo("Eastern District Dragon Boat Race - 2008-06-01 09h52m48s SN201360.jpg", "real-photos/photo-010.jpg", "東區龍舟競渡", "2008年", "Wikimedia Commons：Stewart ~ 惡龍"),
  photo("Pui Ching Middle School White Classroom and bungalow.jpg", "real-photos/photo-011.jpg", "培正中學課室（1927年）", "1920年代", "Wikimedia Commons：培正中學"),
  photo("Moreton Terrace Temporary Playground (Hong Kong).jpg", "real-photos/photo-012.jpg", "摩頓臺臨時遊樂場", "1920年代", "Wikimedia Commons：美國國會圖書館"),
  photo("Chinese top Dagny 1.JPG", "real-photos/photo-013.jpg", "中國陀螺", "2010年代", "Wikimedia Commons：Dagny"),
  photo("Toy car (AM 1996.165.148-9).jpg", "real-photos/photo-014.jpg", "鐵皮玩具車（館藏）", "2010年代", "Wikimedia Commons：Auckland Museum"),

  photo("CMB Guy Arab UF and Tram.jpg", "real-photos/photo-015.jpg", "中巴與電車同路", "1960年代", "Wikimedia Commons：Hong Kong Museum of History"),
  photo("A street in Hong Kong 1972.jpg", "real-photos/photo-016.jpg", "1972年香港街頭", "1972年", "Wikimedia Commons：Rob Samples"),
  photo("Shang Hai Street in 1960s.jpg", "real-photos/photo-017.jpg", "上海街（1960年代）", "1960年代", "Wikimedia Commons：香港檔案處"),
  photo("Selling Fruits in Hong Kong - panoramio.jpg", "real-photos/photo-018.jpg", "街邊水果檔", "2000年代", "Wikimedia Commons：Panoramio"),
  photo("HK 中環 Central 威靈頓街 Wellington Street 吉士笠街 Gutzlaff Street 大排檔 Dai Pai Dong May 2024 R12S 01.jpg", "real-photos/photo-019.jpg", "中環大排檔", "2024年", "Wikimedia Commons：R12S"),
  photo("HK SYP Queen's Road West Mid-Autumn Festival Lanterns 06.JPG", "real-photos/photo-020.jpg", "中秋燈籠掛滿西營盤", "2010年代", "Wikimedia Commons：Wpcpey"),
  photo("IDBF World Dragon Boat Championships 1997 in Hong Kong, Swedish Team.jpg", "real-photos/photo-021.jpg", "1997年國際龍舟錦標賽", "1997年", "Wikimedia Commons：Sven-Erik Fristedt"),
  photo("SCAD Hong Kong classroom.JPG", "real-photos/photo-022.jpg", "課室空間", "2010年代", "Wikimedia Commons：SCAD Hong Kong"),
  photo("HK 上環 Sheung Wan open day 樂善堂梁銶琚書院 Lok Sin Tong Leung Kau Kui College classroom interior Dec 2016 Lnv2 03.jpg", "real-photos/photo-023.jpg", "中學課室內貌", "2016年", "Wikimedia Commons：LN9267"),
  photo("Nantou County Middle School classroom with Three-Principles-of-the-People slogan 1951.jpg", "real-photos/photo-024.jpg", "五十年代課室", "1951年", "Wikimedia Commons：臺灣省文獻委員會"),
  photo("Wan Chai & Causeway Bay late 1970s.jpg", "real-photos/photo-025.jpg", "灣仔及銅鑼灣（1970年代末）", "1970年代", "Wikimedia Commons：Hong Kong Museum of History"),
  photo("Grocery stores in Hong Kong 1960s.JPG", "real-photos/photo-026.jpg", "雜貨舖（1960年代）", "1960年代", "Wikimedia Commons：香港檔案處"),
  photo("Central, Hong Kong - panoramio (19).jpg", "real-photos/photo-027.jpg", "中環街景", "2000年代", "Wikimedia Commons：Panoramio"),
  photo("On the Star Ferry Hong Kong. (9066236142).jpg", "real-photos/photo-028.jpg", "天星小輪上層", "2010年代", "Wikimedia Commons：Romtomtom"),
  photo("Star Ferry Hong Kong. (14143932945).jpg", "real-photos/photo-029.jpg", "海上天星小輪", "2010年代", "Wikimedia Commons：Romtomtom"),
  photo("Selling Fruits in Hong Kong - panoramio.jpg", "real-photos/photo-030.jpg", "路邊水果生意", "2000年代", "Wikimedia Commons：Panoramio"),

  photo("HK Kerosene Stove HuoShuiLu 火水爐 2.JPG", "real-photos/photo-031.jpg", "火水爐煮食", "2010年代", "Wikimedia Commons：Ngchikit"),
  photo("HK Kerosene Stove HuoShuiLu 火水爐 3.JPG", "real-photos/photo-032.jpg", "火水爐細節", "2010年代", "Wikimedia Commons：Ngchikit"),
  photo("HK Kerosene Stove HuoShuiLu 火水爐 4.JPG", "real-photos/photo-033.jpg", "火水爐與炊具", "2010年代", "Wikimedia Commons：Ngchikit"),
  photo("HK Kerosene Stove HuoShuiLu 火水爐 5.JPG", "real-photos/photo-034.jpg", "舊式廚房爐具", "2010年代", "Wikimedia Commons：Ngchikit"),
  photo("HK Kerosene Stove HuoShuiLu 火水爐 6.JPG", "real-photos/photo-035.jpg", "火水爐保養", "2010年代", "Wikimedia Commons：Ngchikit"),
  photo("An Old Shanghai Barber Shop in Hong Kong.jpg", "real-photos/photo-036.jpg", "理髮店內貌", "2010年代", "Wikimedia Commons：Dltl2010"),
  photo("An Old Shanghai Barber Shop in Hong Kong 2.jpg", "real-photos/photo-037.jpg", "理髮店門面", "2010年代", "Wikimedia Commons：Dltl2010"),
  photo("Chinese top Dagny 1.JPG", "real-photos/photo-038.jpg", "木製陀螺", "2010年代", "Wikimedia Commons：Dagny"),
  photo("Toy car (AM 1996.165.148-9).jpg", "real-photos/photo-039.jpg", "收藏玩具車", "2010年代", "Wikimedia Commons：Auckland Museum"),
  photo("Hong Kong - panoramio (402).jpg", "real-photos/photo-040.jpg", "香港舊街一角", "2000年代", "Wikimedia Commons：Panoramio"),
  photo("HK Kerosene Stove HuoShuiLu 火水爐 3.JPG", "real-photos/photo-041.jpg", "火水爐的日常", "2010年代", "Wikimedia Commons：Ngchikit"),
  photo("Wan Chai & Causeway Bay late 1970s.jpg", "real-photos/photo-042.jpg", "灣仔1970年代末", "1970年代", "Wikimedia Commons：Hong Kong Museum of History"),

  photo("A street in Hong Kong 1972.jpg", "real-photos/photo-043.jpg", "1972年街頭", "1972年", "Wikimedia Commons：Rob Samples"),
  photo("Grocery stores in Hong Kong 1960s.JPG", "real-photos/photo-044.jpg", "1960年代雜貨舖", "1960年代", "Wikimedia Commons：香港檔案處"),
  photo("Central, Hong Kong - panoramio (19).jpg", "real-photos/photo-045.jpg", "中環行人路", "2000年代", "Wikimedia Commons：Panoramio"),
  photo("On the Star Ferry Hong Kong. (9066236142).jpg", "real-photos/photo-046.jpg", "小輪上風景", "2010年代", "Wikimedia Commons：Romtomtom"),
  photo("Star Ferry Hong Kong. (14143932945).jpg", "real-photos/photo-047.jpg", "小輪航程", "2010年代", "Wikimedia Commons：Romtomtom"),
  photo("HK 中環 Central 威靈頓街 Wellington Street 吉士笠街 Gutzlaff Street 大排檔 Dai Pai Dong May 2024 R12S 01.jpg", "real-photos/photo-048.jpg", "中環熟食攤檔", "2024年", "Wikimedia Commons：R12S"),
  photo("HK SYP Queen's Road West Mid-Autumn Festival Lanterns 06.JPG", "real-photos/photo-049.jpg", "中秋燈籠街", "2010年代", "Wikimedia Commons：Wpcpey"),
  photo("Moreton Terrace Temporary Playground (Hong Kong).jpg", "real-photos/photo-050.jpg", "維園前身遊樂場", "1920年代", "Wikimedia Commons：美國國會圖書館"),
  photo("HK Kerosene Stove HuoShuiLu 火水爐 2.JPG", "real-photos/photo-051.jpg", "火水爐家常", "2010年代", "Wikimedia Commons：Ngchikit"),
  photo("Hong Kong - panoramio (402).jpg", "real-photos/photo-052.jpg", "舊街角落", "2000年代", "Wikimedia Commons：Panoramio"),
  photo("An Old Shanghai Barber Shop in Hong Kong 2.jpg", "real-photos/photo-053.jpg", "理髮店招牌", "2010年代", "Wikimedia Commons：Dltl2010"),
  photo("Lai Afong, Cobbler, Hong Kong, c1870s.jpg", "real-photos/photo-054.jpg", "補鞋師傅開工", "1870年代", "Wikimedia Commons：Afong Studio"),
  photo("Glowing lanterns, Mid-Autumn Lantern Carnival 2012, Victoria Park (Hong Kong).jpg", "real-photos/photo-055.jpg", "燈籠晚會", "2012年", "Wikimedia Commons：Wpcpey"),
  photo("Eastern District Dragon Boat Race - 2008-06-01 09h52m48s SN201360.jpg", "real-photos/photo-056.jpg", "龍舟競賽", "2008年", "Wikimedia Commons：Stewart ~ 惡龍"),
  photo("Pui Ching Middle School White Classroom and bungalow.jpg", "real-photos/photo-057.jpg", "舊式課室門前", "1920年代", "Wikimedia Commons：培正中學"),
  photo("SCAD Hong Kong classroom.JPG", "real-photos/photo-058.jpg", "現代課室", "2010年代", "Wikimedia Commons：SCAD Hong Kong"),
  photo("HK 上環 Sheung Wan open day 樂善堂梁銶琚書院 Lok Sin Tong Leung Kau Kui College classroom interior Dec 2016 Lnv2 03.jpg", "real-photos/photo-059.jpg", "中學課室", "2016年", "Wikimedia Commons：LN9267"),
  photo("Nantou County Middle School classroom with Three-Principles-of-the-People slogan 1951.jpg", "real-photos/photo-060.jpg", "五十年代課室一角", "1951年", "Wikimedia Commons：臺灣省文獻委員會"),
  photo("Moreton Terrace Temporary Playground (Hong Kong).jpg", "real-photos/photo-061.jpg", "舊遊樂場", "1920年代", "Wikimedia Commons：美國國會圖書館"),
  photo("Chinese top Dagny 1.JPG", "real-photos/photo-062.jpg", "陀螺玩具", "2010年代", "Wikimedia Commons：Dagny"),
  photo("Toy car (AM 1996.165.148-9).jpg", "real-photos/photo-063.jpg", "玩具車", "2010年代", "Wikimedia Commons：Auckland Museum"),
  photo("Shang Hai Street in 1960s.jpg", "real-photos/photo-064.jpg", "上海街舊貌", "1960年代", "Wikimedia Commons：香港檔案處"),
  photo("Wan Chai & Causeway Bay late 1970s.jpg", "real-photos/photo-065.jpg", "灣仔銅鑼灣街景", "1970年代", "Wikimedia Commons：Hong Kong Museum of History"),
  photo("德輔道中 Des Voeux Road Central, 1960s.jpg", "real-photos/photo-066.jpg", "德輔道中大街", "1960年代", "Wikimedia Commons：德輔道中（1960年代）"),
  photo("CMB Guy Arab UF and Tram.jpg", "real-photos/photo-067.jpg", "巴士與電車", "1960年代", "Wikimedia Commons：Hong Kong Museum of History"),
  photo("Central, Hong Kong - panoramio (19).jpg", "real-photos/photo-068.jpg", "中環一角", "2000年代", "Wikimedia Commons：Panoramio"),
  photo("On the Star Ferry Hong Kong. (9066236142).jpg", "real-photos/photo-069.jpg", "小輪乘客", "2010年代", "Wikimedia Commons：Romtomtom"),
  photo("Star Ferry Hong Kong. (14143932945).jpg", "real-photos/photo-070.jpg", "渡輪航線", "2010年代", "Wikimedia Commons：Romtomtom"),
  photo("Selling Fruits in Hong Kong - panoramio.jpg", "real-photos/photo-071.jpg", "水果檔生意", "2000年代", "Wikimedia Commons：Panoramio"),
  photo("HK Kerosene Stove HuoShuiLu 火水爐 1.JPG", "real-photos/photo-072.jpg", "火水爐煮食", "2010年代", "Wikimedia Commons：Ngchikit"),
  photo("HK Kerosene Stove HuoShuiLu 火水爐 4.JPG", "real-photos/photo-073.jpg", "廚房爐火", "2010年代", "Wikimedia Commons：Ngchikit"),
  photo("Hong Kong - panoramio (402).jpg", "real-photos/photo-074.jpg", "舊街一角", "2000年代", "Wikimedia Commons：Panoramio"),
  photo("Woman working in wet market in Peng Chau, Hong Kong.jpg", "real-photos/photo-075.jpg", "坪洲街市", "2010年代", "Wikimedia Commons：Baycrest"),
  photo("A street in Hong Kong 1972.jpg", "real-photos/photo-076.jpg", "1972年街頭", "1972年", "Wikimedia Commons：Rob Samples"),
  photo("Grocery stores in Hong Kong 1960s.JPG", "real-photos/photo-077.jpg", "雜貨舖舊照", "1960年代", "Wikimedia Commons：香港檔案處"),
  photo("HK 上環 Sheung Wan 歌賦街 Gough Street 美輪街 Mee Lun Street 勝香園 Shing Heung Yuen 大排檔 Dai pai Dong breakfast 早晨 morning February 2025 R12S 03.jpg", "real-photos/photo-078.jpg", "上環大排檔", "2025年", "Wikimedia Commons：R12S"),
  photo("HK 中環 Central 威靈頓街 Wellington Street 吉士笠街 Gutzlaff Street 大排檔 Dai Pai Dong May 2024 R12S 01.jpg", "real-photos/photo-079.jpg", "中環大排檔早餐", "2024年", "Wikimedia Commons：R12S"),
  photo("HK SYP Queen's Road West Mid-Autumn Festival Lanterns 06.JPG", "real-photos/photo-080.jpg", "中秋街燈", "2010年代", "Wikimedia Commons：Wpcpey"),
  photo("Glowing lanterns, Mid-Autumn Lantern Carnival 2012, Victoria Park (Hong Kong).jpg", "real-photos/photo-081.jpg", "公園燈籠", "2012年", "Wikimedia Commons：Wpcpey"),
  photo("IDBF World Dragon Boat Championships 1997 in Hong Kong, Swedish Team.jpg", "real-photos/photo-082.jpg", "龍舟隊伍", "1997年", "Wikimedia Commons：Sven-Erik Fristedt"),
  photo("Eastern District Dragon Boat Race - 2008-06-01 09h52m48s SN201360.jpg", "real-photos/photo-083.jpg", "龍舟水花", "2008年", "Wikimedia Commons：Stewart ~ 惡龍"),
  photo("Pui Ching Middle School White Classroom and bungalow.jpg", "real-photos/photo-084.jpg", "舊課室", "1920年代", "Wikimedia Commons：培正中學"),
  photo("SCAD Hong Kong classroom.JPG", "real-photos/photo-085.jpg", "課室空間", "2010年代", "Wikimedia Commons：SCAD Hong Kong"),
  photo("HK 上環 Sheung Wan open day 樂善堂梁銶琚書院 Lok Sin Tong Leung Kau Kui College classroom interior Dec 2016 Lnv2 03.jpg", "real-photos/photo-086.jpg", "課室桌椅", "2016年", "Wikimedia Commons：LN9267"),
  photo("Nantou County Middle School classroom with Three-Principles-of-the-People slogan 1951.jpg", "real-photos/photo-087.jpg", "五十年代課堂", "1951年", "Wikimedia Commons：臺灣省文獻委員會"),
  photo("Moreton Terrace Temporary Playground (Hong Kong).jpg", "real-photos/photo-088.jpg", "臨時遊樂場", "1920年代", "Wikimedia Commons：美國國會圖書館"),
  photo("Chinese top Dagny 1.JPG", "real-photos/photo-089.jpg", "陀螺轉動", "2010年代", "Wikimedia Commons：Dagny"),
  photo("Toy car (AM 1996.165.148-9).jpg", "real-photos/photo-090.jpg", "玩具車館藏", "2010年代", "Wikimedia Commons：Auckland Museum"),
  photo("Shang Hai Street in 1960s.jpg", "real-photos/photo-091.jpg", "上海街", "1960年代", "Wikimedia Commons：香港檔案處"),
  photo("Wan Chai & Causeway Bay late 1970s.jpg", "real-photos/photo-092.jpg", "灣仔1970年代", "1970年代", "Wikimedia Commons：Hong Kong Museum of History"),
  photo("德輔道中 Des Voeux Road Central, 1960s.jpg", "real-photos/photo-093.jpg", "德輔道中", "1960年代", "Wikimedia Commons：德輔道中（1960年代）"),
  photo("CMB Guy Arab UF and Tram.jpg", "real-photos/photo-094.jpg", "電車與中巴", "1960年代", "Wikimedia Commons：Hong Kong Museum of History"),
  photo("Central, Hong Kong - panoramio (19).jpg", "real-photos/photo-095.jpg", "中環舊樓", "2000年代", "Wikimedia Commons：Panoramio"),
  photo("On the Star Ferry Hong Kong. (9066236142).jpg", "real-photos/photo-096.jpg", "小輪看海", "2010年代", "Wikimedia Commons：Romtomtom"),
  photo("Star Ferry Hong Kong. (14143932945).jpg", "real-photos/photo-097.jpg", "海面風景", "2010年代", "Wikimedia Commons：Romtomtom"),
  photo("Selling Fruits in Hong Kong - panoramio.jpg", "real-photos/photo-098.jpg", "水果攤", "2000年代", "Wikimedia Commons：Panoramio"),
  photo("HK Kerosene Stove HuoShuiLu 火水爐 2.JPG", "real-photos/photo-099.jpg", "火水爐", "2010年代", "Wikimedia Commons：Ngchikit"),
  photo("HK Kerosene Stove HuoShuiLu 火水爐 5.JPG", "real-photos/photo-100.jpg", "廚房爐具", "2010年代", "Wikimedia Commons：Ngchikit"),
  photo("Hong Kong - panoramio (402).jpg", "real-photos/photo-101.jpg", "街角舊舖", "2000年代", "Wikimedia Commons：Panoramio"),
  photo("Woman working in wet market in Peng Chau, Hong Kong.jpg", "real-photos/photo-102.jpg", "街市檔口", "2010年代", "Wikimedia Commons：Baycrest"),
  photo("A street in Hong Kong 1972.jpg", "real-photos/photo-103.jpg", "街頭1972", "1972年", "Wikimedia Commons：Rob Samples"),
  photo("Grocery stores in Hong Kong 1960s.JPG", "real-photos/photo-104.jpg", "1960年代雜貨", "1960年代", "Wikimedia Commons：香港檔案處"),
  photo("HK 上環 Sheung Wan 歌賦街 Gough Street 美輪街 Mee Lun Street 勝香園 Shing Heung Yuen 大排檔 Dai pai Dong breakfast 早晨 morning February 2025 R12S 03.jpg", "real-photos/photo-105.jpg", "早餐大排檔", "2025年", "Wikimedia Commons：R12S"),
  photo("HK 中環 Central 威靈頓街 Wellington Street 吉士笠街 Gutzlaff Street 大排檔 Dai Pai Dong May 2024 R12S 01.jpg", "real-photos/photo-106.jpg", "中環食檔", "2024年", "Wikimedia Commons：R12S"),
  photo("HK SYP Queen's Road West Mid-Autumn Festival Lanterns 06.JPG", "real-photos/photo-107.jpg", "中秋燈籠", "2010年代", "Wikimedia Commons：Wpcpey"),
  photo("Glowing lanterns, Mid-Autumn Lantern Carnival 2012, Victoria Park (Hong Kong).jpg", "real-photos/photo-108.jpg", "燈籠展", "2012年", "Wikimedia Commons：Wpcpey"),
  photo("IDBF World Dragon Boat Championships 1997 in Hong Kong, Swedish Team.jpg", "real-photos/photo-109.jpg", "國際龍舟賽", "1997年", "Wikimedia Commons：Sven-Erik Fristedt"),
  photo("Eastern District Dragon Boat Race - 2008-06-01 09h52m48s SN201360.jpg", "real-photos/photo-110.jpg", "龍舟賽", "2008年", "Wikimedia Commons：Stewart ~ 惡龍"),
  photo("Pui Ching Middle School White Classroom and bungalow.jpg", "real-photos/photo-111.jpg", "課室舊照", "1920年代", "Wikimedia Commons：培正中學"),
  photo("SCAD Hong Kong classroom.JPG", "real-photos/photo-112.jpg", "課室內貌", "2010年代", "Wikimedia Commons：SCAD Hong Kong"),
  photo("HK 上環 Sheung Wan open day 樂善堂梁銶琚書院 Lok Sin Tong Leung Kau Kui College classroom interior Dec 2016 Lnv2 03.jpg", "real-photos/photo-113.jpg", "課室書桌", "2016年", "Wikimedia Commons：LN9267"),
  photo("Nantou County Middle School classroom with Three-Principles-of-the-People slogan 1951.jpg", "real-photos/photo-114.jpg", "五十年代課室", "1951年", "Wikimedia Commons：臺灣省文獻委員會"),
  photo("Moreton Terrace Temporary Playground (Hong Kong).jpg", "real-photos/photo-115.jpg", "遊樂場舊影", "1920年代", "Wikimedia Commons：美國國會圖書館"),
  photo("Chinese top Dagny 1.JPG", "real-photos/photo-116.jpg", "陀螺", "2010年代", "Wikimedia Commons：Dagny"),
  photo("Toy car (AM 1996.165.148-9).jpg", "real-photos/photo-117.jpg", "鐵皮車", "2010年代", "Wikimedia Commons：Auckland Museum"),
  photo("Shang Hai Street in 1960s.jpg", "real-photos/photo-118.jpg", "上海街舊照", "1960年代", "Wikimedia Commons：香港檔案處"),
  photo("Wan Chai & Causeway Bay late 1970s.jpg", "real-photos/photo-119.jpg", "灣仔銅鑼灣", "1970年代", "Wikimedia Commons：Hong Kong Museum of History"),
  photo("德輔道中 Des Voeux Road Central, 1960s.jpg", "real-photos/photo-120.jpg", "德輔道中1960", "1960年代", "Wikimedia Commons：德輔道中（1960年代）")
];

const SONGS = [
  song("Shanghainese popular song, possibly Part Three of Five, 127-127a (scy 2921-2922).mp3", "real-songs/song-001.mp3", "上海老歌（1901年錄音）", "家居生活"),
  song("大香山 = Ta hsiang shan (Great Fragrant Mountain), Part Ten of Ten, 72-72a (scy 2829-2830).mp3", "real-songs/song-002.mp3", "大香山（1901年錄音）", "家居生活"),
  song("Shenyang (ISRC USUAN1600066).mp3", "real-songs/song-003.mp3", "沈陽（電車鈴聲）", "交通"),
  song("Cattails (ISRC USUAN1100743).mp3", "real-songs/song-004.mp3", "街市早晨", "街市與食物"),
  song("Tea Roots (ISRC USUAN1100472).mp3", "real-songs/song-005.mp3", "茶根（茶樓點心）", "街市與食物"),
  song("Erhu Strikes Back (Antti Luode).mp3", "real-songs/song-006.mp3", "二胡出擊（校園鈴聲）", "校園生活"),
  song("Notes (Antti Luode).mp3", "real-songs/song-007.mp3", "音符（龍舟鼓）", "節慶與習俗"),
  song("Windswept (ISRC USUAN1100757).mp3", "real-songs/song-008.mp3", "風起（晚霞歸帆）", "工作與行業"),
  song("Children's Theme (ISRC USUAN1100296).mp3", "real-songs/song-009.mp3", "童謠主題（紅棉開花）", "校園生活"),
  song("Jazzy (Antti Luode).mp3", "real-songs/song-010.mp3", "爵士漫步（黃昏碼頭）", "交通"),
  song("Missing (Antti Luode).mp3", "real-songs/song-011.mp3", "留白（麻將聲）", "家居生活"),
  song("Hologram (Antti Luode).mp3", "real-songs/song-012.mp3", "全息（涼茶歌）", "街市與食物"),
  song("Simpletonica (Antti Luode).mp3", "real-songs/song-013.mp3", "簡單音符（木屐響）", "家居生活"),
  song("Dances With Erhu (Antti Luode).mp3", "real-songs/song-014.mp3", "與二胡共舞（紡織機）", "工作與行業"),
  song("遊龍戲鳳 = Yu lung hsi fêng (Wandering Dragon Plays with Phoenix), Part One of Twelve, 41-41a (scy 2768-2769).mp3", "real-songs/song-015.mp3", "遊龍戲鳳（粵劇開場）", "節慶與習俗"),
  song("Shorty (Antti Luode).mp3", "real-songs/song-016.mp3", "短歌（汽水玻璃樽）", "街市與食物"),
  song("Digital (Antti Luode).mp3", "real-songs/song-017.mp3", "數碼（霓虹招牌）", "工作與行業"),
  song("Underwater City (Antti Luode).mp3", "real-songs/song-018.mp3", "水底城市（天台風箏）", "童年玩具"),
  song("The Eighties (Antti Luode).mp3", "real-songs/song-019.mp3", "八十年代（街頭小販）", "街市與食物"),
  song("On Tracks (Antti Luode).mp3", "real-songs/song-020.mp3", "在軌道上（電台點唱）", "家居生活"),
  song("Fanfare (Antti Luode).mp3", "real-songs/song-021.mp3", "號角（舞獅鑼鼓）", "節慶與習俗"),
  song("Pjano Man and Erhu Man (Antti Luode).mp3", "real-songs/song-022.mp3", "撐船人與二胡人（木船搖櫓）", "交通"),
  song("More Erhu! (Antti Luode).mp3", "real-songs/song-023.mp3", "再來二胡！（學前跳繩）", "校園生活"),
  song("Erhu Something (Antti Luode).mp3", "real-songs/song-024.mp3", "二胡隨想（公仔紙風波）", "童年玩具"),
  song("Rites (ISRC USUAN1100722).mp3", "real-songs/song-025.mp3", "儀式（米舖秤米）", "工作與行業"),
  song("Relent (ISRC USUAN1100777).mp3", "real-songs/song-026.mp3", "不息（唱機轉動）", "家居生活"),
  song("Rising (ISRC USUAN1100754).mp3", "real-songs/song-027.mp3", "升起（清明時節）", "節慶與習俗"),
  song("Stealth Groover (ISRC USUAN1100690).mp3", "real-songs/song-028.mp3", "低調律動（巴士回聲）", "交通"),
  song("Funk O (Antti Luode).mp3", "real-songs/song-029.mp3", "放克開場（鐵皮車轉彎）", "童年玩具"),
  song("Subby Pop (Antti Luode).mp3", "real-songs/song-030.mp3", "低音小品（夜香花開）", "家居生活")
];

const VIDEOS = [
  video("1937 Hong Kong VP8.webm", "real-videos/video-001.webm", "1937年香港影像", "1930年代", "上環", "交通", "Wikimedia Commons：Prelinger Archives"),
  video("Reclamation Street market, Hong Kong - 新填地街, 香港 2013.webm", "real-videos/video-002.webm", "新填地街街市（2013年）", "2010年代", "深水埗", "街市與食物", "Wikimedia Commons：Wing1990hk"),
  video("Tram entering North Point Market.ogv", "real-videos/video-003.ogv", "電車進入北角街市", "1930年代", "北角", "交通", "Wikimedia Commons：香港歷史影像")
];

export const CONTENT_MANIFEST = [...PHOTOS, ...SONGS, ...VIDEOS];

const summaries = (kind) => CONTENT_MANIFEST.filter((entry) => entry.kind === kind).length;
console.log(
  `Manifest ready: ${summaries("photo")} photos, ${summaries("song")} songs, ${summaries("video")} videos.`
);
