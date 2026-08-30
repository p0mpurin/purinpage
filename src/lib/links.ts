export interface LinkItem {
    name: string;
    url: string;
    icon?: string;
    description?: string;
}

export interface CategoryData {
    title: string;
    kanji: string;
    romaji: string;
    tagline: string;
    icon: string;
    links: LinkItem[];
}

const bulletIcon = "/icons/torrents.jpg";

export const categoryLinks: Record<string, CategoryData> = {
    favorites: {
        title: "Favorites",
        kanji: "星",
        romaji: "Favorites / Bookmarks",
        tagline: "Your starred links & custom personal bookmarks",
        icon: "/icons/favorites.jpg",
        links: [],
    },
    movies: {
        title: "Movies & TV",
        kanji: "映画",
        romaji: "Eiga / Cinema",
        tagline: "High-definition cinema streaming & TV archives",
        icon: "/icons/movies.jpg",
        links: [
            { name: "Soap2Night", url: "https://hokejatv.com/movies.html", icon: bulletIcon },
            { name: "LookMovie", url: "https://www.lookmovie2.to/", icon: bulletIcon },
            { name: "Cineby", url: "https://www.cineby.gd/", icon: bulletIcon },
            { name: "DoraWatch", url: "https://dorawatch.one/home/", icon: bulletIcon },
            { name: "WMovies", url: "https://wmovies.one/", icon: bulletIcon },
            { name: "HydraHD", url: "https://hydrahd.ru/", icon: bulletIcon },
            { name: "FlickyStream", url: "https://flickystream.ru/", icon: bulletIcon },
            { name: "Cinema.bz", url: "https://cinema.bz/", icon: bulletIcon },
            { name: "Goojara", url: "https://ww1.goojara.to/", icon: bulletIcon },
            { name: "Mapple", url: "https://mapple.mov/", icon: bulletIcon },
            { name: "PopcornMovies", url: "https://popcornmovies.org/", icon: bulletIcon },
            { name: "PressPlay", url: "https://pressplay.top/", icon: bulletIcon },
            { name: "FMovies", url: "https://fmovies.co/", icon: bulletIcon },
            { name: "NunFlix", url: "https://nunflix.li/", icon: bulletIcon },
            { name: "RidoMovies", url: "https://ridomovies.tv/", icon: bulletIcon },
            { name: "123MoviesFree", url: "https://ww7.123moviesfree.net/home/", icon: bulletIcon },
            { name: "VidPlay", url: "https://vidplay.top/", icon: bulletIcon },
            { name: "YesMovies", url: "https://ww.yesmovies.ag/", icon: bulletIcon },
            { name: "PrimeWire", url: "https://www.primewire.mov/home", icon: bulletIcon },
        ],
    },
    anime: {
        title: "Anime",
        kanji: "アニメ",
        romaji: "Anime / Broadcast",
        tagline: "Seasonal anime broadcasts, streams & raw releases",
        icon: "/icons/anime.jpg",
        links: [
            { name: "hianime.to", url: "https://hianime.to/", icon: bulletIcon },
            { name: "anime.nexus", url: "https://anime.nexus/", icon: bulletIcon },
            { name: "miruro.to", url: "https://www.miruro.to/", icon: bulletIcon },
            { name: "9animetv.to", url: "https://9animetv.to/", icon: bulletIcon },
            { name: "anitaku.io", url: "https://anitaku.io/", icon: bulletIcon },
            { name: "gogoanime.org.vc", url: "https://wvv.gogoanime.org.vc/", icon: bulletIcon },
            { name: "animepahe.ru", url: "https://animepahe.ru/", icon: bulletIcon },
            { name: "animension.to", url: "https://animension.to/", icon: bulletIcon },
            { name: "kaido.to", url: "https://kaido.to/", icon: bulletIcon },
            { name: "aniwave.se", url: "https://aniwave.se/", icon: bulletIcon },
            { name: "animesuge.to", url: "https://animesuge.to/", icon: bulletIcon },
            { name: "marin.moe", url: "https://marin.moe/", icon: bulletIcon },
        ],
    },
    torrents: {
        title: "Torrents",
        kanji: "急流",
        romaji: "Kyūryū / P2P Swarm",
        tagline: "Decentralized P2P swarms, indexers & trackers",
        icon: "/icons/torrents.jpg",
        links: [
            { name: "1337x", url: "https://1337x.to/", icon: bulletIcon },
            { name: "Nyaa.si", url: "https://nyaa.si/", icon: bulletIcon },
            { name: "TorrentGalaxy", url: "https://torrentgalaxy.to/", icon: bulletIcon },
            { name: "FitGirl Repacks", url: "https://fitgirl-repacks.site/", icon: bulletIcon },
            { name: "ThePirateBay", url: "https://thepiratebay.org/index.html", icon: bulletIcon },
            { name: "YTS.mx", url: "https://yts.mx/", icon: bulletIcon },
            { name: "RuTracker", url: "https://rutracker.org/", icon: bulletIcon },
            { name: "LimeTorrents", url: "https://www.limetorrents.lol/", icon: bulletIcon },
            { name: "EZTV", url: "https://eztv.re/", icon: bulletIcon },
            { name: "SubsPlease", url: "https://subsplease.org/", icon: bulletIcon },
        ],
    },
    manga: {
        title: "Manga & Comics",
        kanji: "漫画",
        romaji: "Manga / Archives",
        tagline: "Scans, webtoons, light novels & raw archives",
        icon: "/icons/manga.jpg",
        links: [
            { name: "MangaFire", url: "https://mangafire.to/", icon: bulletIcon },
            { name: "MangaDex", url: "https://mangadex.org/", icon: bulletIcon },
            { name: "MangaReader", url: "https://mangareader.to/", icon: bulletIcon },
            { name: "ReadComicsOnline", url: "https://readcomiconline.li/", icon: bulletIcon },
            { name: "Asura Scans", url: "https://asuracomic.net/", icon: bulletIcon },
            { name: "Flame Comics", url: "https://flamecomics.xyz/", icon: bulletIcon },
            { name: "TCB Scans", url: "https://tcbscans.me/", icon: bulletIcon },
        ],
    },
    piracy: {
        title: "Piracy Mega",
        kanji: "海賊",
        romaji: "Kaizoku / Vault",
        tagline: "FMHY, community vaults & mega resources",
        icon: "/icons/piracy.jpg",
        links: [
            { name: "FMHY Wiki", url: "https://fmhy.net/", icon: bulletIcon },
            { name: "Piracy Megathread", url: "https://rentry.co/megathread", icon: bulletIcon },
            { name: "Champagne Piracy Directory", url: "https://champagne.pages.dev/", icon: bulletIcon },
            { name: "Awesome Piracy", url: "https://awesome-piracy.pages.dev/", icon: bulletIcon },
            { name: "Ripper Store", url: "https://ripper.store/", icon: bulletIcon },
        ],
    },
    software: {
        title: "Software",
        kanji: "電脳",
        romaji: "Dennō / Programs",
        tagline: "Repacks, open-source utilities & developer kits",
        icon: "/icons/software.jpg",
        links: [
            { name: "Massgrave (MAS)", url: "https://massgrave.dev/", icon: bulletIcon },
            { name: "FileCR", url: "https://filecr.com/en/", icon: bulletIcon },
            { name: "M0nkrus", url: "https://w14.monkrus.ws/", icon: bulletIcon },
            { name: "Sanet.st", url: "https://sanet.st/soft/", icon: bulletIcon },
            { name: "FMHY Software Vault", url: "https://fmhy.net/system-tools", icon: bulletIcon },
        ],
    },
    games: {
        title: "Games",
        kanji: "遊戯",
        romaji: "Yūgi / Game Hub",
        tagline: "Scene releases, repacks, ROMs & emulators",
        icon: "/icons/games.jpg",
        links: [
            { name: "FitGirl Repacks", url: "https://fitgirl-repacks.site/", icon: bulletIcon },
            { name: "DODI Repacks", url: "https://dodi-repacks.site/", icon: bulletIcon },
            { name: "SteamRIP", url: "https://steamrip.com/", icon: bulletIcon },
            { name: "GOG Games", url: "https://gog-games.to/", icon: bulletIcon },
            { name: "OnlineFix", url: "https://online-fix.me/", icon: bulletIcon },
            { name: "Vimm's Lair", url: "https://vimm.net/", icon: bulletIcon },
            { name: "CS.RIN.RU", url: "https://cs.rin.ru/forum/", icon: bulletIcon },
        ],
    },
    music: {
        title: "Music & Audio",
        kanji: "音楽",
        romaji: "Ongaku / Sonic",
        tagline: "Lossless FLAC, streaming & discographies",
        icon: "/icons/music.jpg",
        links: [
            { name: "Free-MP3-Download", url: "https://free-mp3-download.net/", icon: bulletIcon },
            { name: "Squid.wtfnz", url: "https://squid.wtfnz.pw/", icon: bulletIcon },
            { name: "Slav Art", url: "https://slavart.gamesdrive.net/", icon: bulletIcon },
            { name: "DoubleDouble", url: "https://doubledouble.top/", icon: bulletIcon },
            { name: "RuTracker Audio", url: "https://rutracker.org/forum/viewforum.php?f=1198", icon: bulletIcon },
        ],
    },
    books: {
        title: "Books & Papers",
        kanji: "書籍",
        romaji: "Shoseki / Library",
        tagline: "Academic journals, textbooks, EPUBs & audiobooks",
        icon: "/icons/books.jpg",
        links: [
            { name: "Anna's Archive", url: "https://annas-archive.org/", icon: bulletIcon },
            { name: "LibGen", url: "https://libgen.is/", icon: bulletIcon },
            { name: "Sci-Hub", url: "https://sci-hub.se/", icon: bulletIcon },
            { name: "OceanofPDF", url: "https://oceanofpdf.com/", icon: bulletIcon },
            { name: "AudiobookBay", url: "https://audiobookbay.lu/", icon: bulletIcon },
        ],
    },
    cyber: {
        title: "Cyber Security",
        kanji: "防衛",
        romaji: "Bōei / Defense",
        tagline: "Pen-testing labs, telemetry blockers & security hubs",
        icon: "/icons/cyber.jpg",
        links: [
            { name: "PrivacyGuides", url: "https://www.privacyguides.org/", icon: bulletIcon },
            { name: "VirusTotal", url: "https://www.virustotal.com/", icon: bulletIcon },
            { name: "DNSLeakTest", url: "https://www.dnsleaktest.com/", icon: bulletIcon },
            { name: "HaveIBeenPwned", url: "https://haveibeenpwned.com/", icon: bulletIcon },
            { name: "BrowserLeaks", url: "https://browserleaks.com/", icon: bulletIcon },
        ],
    },
    streaming: {
        title: "Live TV & Sports",
        kanji: "放送",
        romaji: "Hōsō / Relay",
        tagline: "Live global television networks & sports streams",
        icon: "/icons/streaming.jpg",
        links: [
            { name: "StreamEast", url: "https://streameast.gd/", icon: bulletIcon },
            { name: "TheTVApp", url: "https://thetvapp.to/", icon: bulletIcon },
            { name: "DaddyLiveHD", url: "https://daddylive.mp/", icon: bulletIcon },
            { name: "Sportsurge", url: "https://sportsurge.net/", icon: bulletIcon },
            { name: "IPTV-Org", url: "https://iptv-org.github.io/", icon: bulletIcon },
        ],
    },
    design: {
        title: "Art & Assets",
        kanji: "美術",
        romaji: "Bijutsu / Studio",
        tagline: "Wallpapers, vectors, 3D models & sound effects",
        icon: "/icons/design.jpg",
        links: [
            { name: "Wallhaven", url: "https://wallhaven.cc/", icon: bulletIcon },
            { name: "Freesound", url: "https://freesound.org/", icon: bulletIcon },
            { name: "Kenney Assets", url: "https://kenney.nl/assets", icon: bulletIcon },
            { name: "Poly Pizza", url: "https://poly.pizza/", icon: bulletIcon },
        ],
    },
    tools: {
        title: "Web Tools",
        kanji: "道具",
        romaji: "Dōgu / Toolkit",
        tagline: "Cobalt downloaders, link sanitizers & DNS testers",
        icon: "/icons/tools.jpg",
        links: [
            { name: "Cobalt.tools", url: "https://cobalt.tools/", icon: bulletIcon },
            { name: "CyberChef", url: "https://gchq.github.io/CyberChef/", icon: bulletIcon },
            { name: "Temp-Mail", url: "https://temp-mail.org/", icon: bulletIcon },
            { name: "File.io", url: "https://www.file.io/", icon: bulletIcon },
            { name: "WebTorrent IO", url: "https://webtorrent.io/", icon: bulletIcon },
        ],
    },
};
