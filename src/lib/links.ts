export interface LinkItem {
    name: string;
    url: string;
    icon?: string;
    description?: string;
}

export interface CategoryData {
    title: string;
    icon: string;
    links: LinkItem[];
}

const bulletIcon = "https://i.pinimg.com/736x/cc/1b/bc/cc1bbc4f8fdb20a4db4b2e5938f8cc0f.jpg";


export const categoryLinks: Record<string, CategoryData> = {
    movies: {
        title: "Movies & TV",
        icon: "https://i.pinimg.com/1200x/41/d3/fd/41d3fd957b27e82f1351c7c5c5be50c7.jpg",
        links: [
            { name: "Soap2Night", url: "https://hokejatv.com/movies.html", icon: bulletIcon },
            { name: "DoraWatch", url: "https://dorawatch.one/home/", icon: bulletIcon },
            { name: "WMovies", url: "https://wmovies.one/", icon: bulletIcon },
            { name: "HydraHD", url: "https://hydrahd.ru/", icon: bulletIcon },
            { name: "Cineby", url: "https://www.cineby.gd/", icon: bulletIcon },
            { name: "FlickyStream", url: "https://flickystream.ru/", icon: bulletIcon },
            { name: "YFlix", url: "https://yflix.to/home", icon: bulletIcon },
            { name: "Cinema.bz", url: "https://cinema.bz/", icon: bulletIcon },
            { name: "TMovie", url: "https://tmovie.tv/", icon: bulletIcon },
            { name: "Goojara", url: "https://ww1.goojara.to/", icon: bulletIcon },
            { name: "VeloraTV", url: "https://veloratv.ru/", icon: bulletIcon },
            { name: "Mapple", url: "https://mapple.mov/", icon: bulletIcon },
            { name: "PopcornMovies", url: "https://popcornmovies.org/", icon: bulletIcon },
            { name: "GoMovies", url: "https://gomovies.gg/", icon: bulletIcon },
            { name: "OnionPlay", url: "https://onionplay.bz/", icon: bulletIcon },
            { name: "LookMovie", url: "https://www.lookmovie2.to/", icon: bulletIcon },
            { name: "PressPlay", url: "https://pressplay.top/", icon: bulletIcon },
            { name: "MoviesJoy", url: "https://moviesjoytv.to/", icon: bulletIcon },
            { name: "FMovies", url: "https://fmovies.co/", icon: bulletIcon },
            { name: "Soap2DayHD", url: "https://ww3.soap2dayhdz.com/", icon: bulletIcon },
            { name: "ProjectFreeTV", url: "https://projectfreetv.sx/", icon: bulletIcon },
            { name: "SFlix", url: "https://sflix.ps/", icon: bulletIcon },
            { name: "TheFlixer", url: "https://theflixertv.to/", icon: bulletIcon },
            { name: "MyFlixerz", url: "https://myflixerz.to/", icon: bulletIcon },
            { name: "HDToday", url: "https://hdtoday.tv/", icon: bulletIcon },
            { name: "FlixHQ", url: "https://flixhq.to/", icon: bulletIcon },
            { name: "HuraWatch", url: "https://hurawatch.cc/", icon: bulletIcon },
            { name: "NunFlix", url: "https://nunflix.li/", icon: bulletIcon },
            { name: "RidoMovies", url: "https://ridomovies.tv/", icon: bulletIcon },
            { name: "123MoviesFree", url: "https://ww7.123moviesfree.net/home/", icon: bulletIcon },
            { name: "HDToday (Alt)", url: "https://hdtoday.cc/", icon: bulletIcon },
            { name: "VidPlay", url: "https://vidplay.top/", icon: bulletIcon },
            { name: "Putlocker", url: "https://putlocker.pe/", icon: bulletIcon },
            { name: "YesMovies", url: "https://ww.yesmovies.ag/", icon: bulletIcon },
            { name: "WatchSeries", url: "https://watchseries.pe/", icon: bulletIcon },
            { name: "PrimeWire", url: "https://www.primewire.mov/home", icon: bulletIcon },
            { name: "Watch32", url: "https://watch32.sx/", icon: bulletIcon },
            { name: "Flicker Addon", url: "https://flickeraddon.pages.dev/", icon: bulletIcon },
            { name: "StreamM4U", url: "https://streamm4u.com.co/home", icon: bulletIcon },
        ],
    },
    anime: {
        title: "Anime",
        icon: "https://i.pinimg.com/736x/bf/44/f9/bf44f9d770ebc7aeeffc33e5c425f362.jpg",
        links: [
            { name: "anime.nexus", url: "https://anime.nexus/", icon: bulletIcon },
            { name: "hianime.to", url: "https://hianime.to/", icon: bulletIcon },
            { name: "9animetv.to", url: "https://9animetv.to/", icon: bulletIcon },
            { name: "miruro.to", url: "https://www.miruro.to/", icon: bulletIcon },
            { name: "anitaku.io", url: "https://anitaku.io/", icon: bulletIcon },
            { name: "anikai.to", url: "https://anikai.to/", icon: bulletIcon },
            { name: "gogoanime.org.vc", url: "https://wvv.gogoanime.org.vc/", icon: bulletIcon },
            { name: "anigo.to", url: "https://anigo.to/", icon: bulletIcon },
            { name: "kickass-anime.ro", url: "https://kickass-anime.ro/", icon: bulletIcon },
            { name: "aniwatchtv.to", url: "https://aniwatchtv.to/", icon: bulletIcon },
            { name: "animegg.org", url: "https://www.animegg.org/", icon: bulletIcon },
            { name: "animestream.net", url: "https://anime.uniquestream.net/", icon: bulletIcon },
            { name: "kissanime.com.ru", url: "https://kissanime.com.ru/", icon: bulletIcon },
            { name: "allmanga.to", url: "https://allmanga.to/", icon: bulletIcon },
            { name: "aniworld.to", url: "https://aniworld.to/", icon: bulletIcon },
            { name: "wcostream.tv", url: "https://www.wcostream.tv/", icon: bulletIcon },
            { name: "justanime.to", url: "https://justanime.to/", icon: bulletIcon },
            { name: "123animes.ru", url: "https://w1.123animes.ru/", icon: bulletIcon },
        ],
    },

    "asian-drama": {
        title: "Asian Drama",
        icon: "https://i.pinimg.com/736x/0a/ae/e2/0aaee2de2c5271ae2b333f6adb5f7571.jpg",
        links: [
            { name: "asiaflix.net", url: "https://asiaflix.net/home", icon: bulletIcon },
            { name: "kisskh.id", url: "https://kisskh.id/", icon: bulletIcon },
            { name: "goplay.su", url: "https://goplay.su/", icon: bulletIcon },
            { name: "kissasian.com.lv", url: "https://ww14.kissasian.com.lv/", icon: bulletIcon },
            { name: "dramacool.com.tr", url: "https://dramacool.com.tr/", icon: bulletIcon },
            { name: "asianctv.cc", url: "https://asianctv.cc/", icon: bulletIcon },
            { name: "myasiantv.com.bz", url: "https://myasiantv.com.bz/", icon: bulletIcon },
            { name: "kisskh.club", url: "https://kisskh.club/", icon: bulletIcon },
        ],
    },

    manga: {
        title: "Manga",
        icon: "https://i.pinimg.com/736x/12/ba/b9/12bab9c3a66daea030108a07251100a2.jpg", // keep category icon normal
        links: [
            { name: "comix.to", url: "https://comix.to/", icon: bulletIcon },
            { name: "mangafire.to", url: "https://mangafire.to/home", icon: bulletIcon },
            { name: "mangahaven.net", url: "https://mangahaven.net/", icon: bulletIcon },
            { name: "mangataro.org", url: "https://mangataro.org/", icon: bulletIcon },
            { name: "mangadex.org", url: "https://mangadex.org/", icon: bulletIcon },
            { name: "allmanga.to", url: "https://allmanga.to/manga", icon: bulletIcon },
            { name: "mangago.me", url: "https://mangago.me/", icon: bulletIcon },
            { name: "weebcentral.com", url: "https://weebcentral.com/", icon: bulletIcon },
            { name: "manganato.gg", url: "https://www.manganato.gg/", icon: bulletIcon },
            { name: "kagane.org", url: "https://kagane.org/", icon: bulletIcon },
        ],
    },
    sports: {
        title: "Live Sports",
        icon: "https://i.pinimg.com/736x/61/8b/eb/618bebca5ea7e0ea3c9056d2e76dfb71.jpg",
        links: [
            { name: "livetv.sx", url: "https://livetv.sx/enx/", icon: bulletIcon },
            { name: "totalsportek.events", url: "https://totalsportek.events/", icon: bulletIcon },
            { name: "sportsurge.net", url: "https://v2.sportsurge.net/", icon: bulletIcon },
            { name: "streamed.pk", url: "https://streamed.pk/", icon: bulletIcon },
            { name: "tv.tflix.app", url: "https://tv.tflix.app/", icon: bulletIcon },
            { name: "streameast.ga", url: "https://v2.streameast.ga/", icon: bulletIcon },
            { name: "fctv33.hair", url: "https://www.fctv33.hair/", icon: bulletIcon },
            { name: "methstreams.ms", url: "https://methstreams.ms/", icon: bulletIcon },
            { name: "sportsbite.live", url: "https://main.sportsbite.live/", icon: bulletIcon },
            { name: "sport71.pro", url: "https://beta.sport71.pro/", icon: bulletIcon },
            { name: "sportyhunter.com", url: "https://sportyhunter.com/", icon: bulletIcon },
            { name: "watchsports.to", url: "https://watchsports.to/", icon: bulletIcon },
            { name: "onhockey.tv", url: "http://onhockey.tv/", icon: bulletIcon },
            { name: "crackstreams.io", url: "https://crackstreams.io/", icon: bulletIcon },
            { name: "sportplus.live", url: "https://en12.sportplus.live/", icon: bulletIcon },
            { name: "livetv861.me", url: "https://livetv861.me/enx/", icon: bulletIcon },
            { name: "strikeout.im", url: "https://strikeout.im/", icon: bulletIcon },
            { name: "watchfooty.st", url: "https://www.watchfooty.st/en", icon: bulletIcon },
        ],
    },
    livetv: {
        title: "Live TV",
        icon: "https://i.pinimg.com/1200x/19/77/19/197719a80681357c95fec1ac94d74f07.jpg",
        links: [
            { name: "famelack.com (Blocked for some countries)", url: "https://famelack.com/", icon: bulletIcon },
            { name: "the-tv.app", url: "https://the-tv.app/", icon: bulletIcon },
            { name: "globetv.app", url: "https://globetv.app/", icon: bulletIcon },
            { name: "daddylive.mp", url: "https://dlhd.link/24-7-channels.php", icon: bulletIcon },
            { name: "tv247us.live", url: "https://tv247us.live/", icon: bulletIcon },
            { name: "ntvstream.cx", url: "https://ntvstream.cx/channels", icon: bulletIcon },
            { name: "iptv-web.app", url: "https://iptv-web.app/", icon: bulletIcon },
            { name: "publiciptv.com", url: "https://publiciptv.com/", icon: bulletIcon },
        ],
    },
    torrents: {
        title: "Torrents",
        icon: "https://i.pinimg.com/736x/92/6f/81/926f81d603752bf4914716ed5367476e.jpg",
        links: [
            { name: "1337x.to", url: "https://1337x.to/", icon: bulletIcon },
            { name: "rutracker.org", url: "https://rutracker.org/forum/index.php", icon: bulletIcon },
            { name: "limetorrents.fun", url: "https://www.limetorrents.fun/", icon: bulletIcon },
            { name: "yts.bz (Movies)", url: "https://yts.bz/", icon: bulletIcon },
            { name: "eztvx.to (TV Shows)", url: "https://eztvx.to/home", icon: bulletIcon },
            { name: "torrentgalaxy.one", url: "https://torrentgalaxy.one/", icon: bulletIcon },
            { name: "extratorrent.st", url: "https://extratorrent.st/", icon: bulletIcon },
            { name: "ext.to", url: "https://ext.to/", icon: bulletIcon },
            { name: "rargb.to", url: "https://rargb.to/", icon: bulletIcon },
            { name: "thepiratebay.org (Use at your own risk)", url: "https://thepiratebay.org/index.html", icon: bulletIcon },
        ],
    },
    games: {
        title: "Games",
        icon: "https://i.pinimg.com/736x/c4/4c/9c/c44c9c8edbefd1630a7c9d1d803864d7.jpg",
        links: [
            { name: "fitgirl-repacks.site", url: "https://fitgirl-repacks.site/", icon: bulletIcon },
            { name: "dodi-repacks.site", url: "https://dodi-repacks.site/", icon: bulletIcon },
            { name: "ankergames.net", url: "https://ankergames.net/", icon: bulletIcon },
            { name: "g4u.to", url: "https://g4u.to/", icon: bulletIcon },
            { name: "steamrip.com", url: "https://steamrip.com/", icon: bulletIcon },
            { name: "steamgg.net", url: "https://steamgg.net/", icon: bulletIcon },
            { name: "m4ckd0ge-repacks.site", url: "https://m4ckd0ge-repacks.site/", icon: bulletIcon },
            { name: "gload.to", url: "https://gload.to/", icon: bulletIcon },
        ],
    },
    music: {
        title: "Music",
        icon: "https://i.pinimg.com/736x/5d/4d/af/5d4daff823a27548a11f26c927908fb3.jpg",
        links: [
            // Spotify
            { name: "spotdownloader.com", url: "https://spotdownloader.com/", icon: bulletIcon },
            { name: "spotifymate.com", url: "https://spotifymate.com/en", icon: bulletIcon },
            { name: "spotmate.online", url: "https://spotmate.online/", icon: bulletIcon },

            // Youtube
            { name: "y2mate.nu", url: "https://v1.y2mate.nu/", icon: bulletIcon },
            { name: "azmp3.cc", url: "https://azmp3.cc/", icon: bulletIcon },
            { name: "ytmp3.cc", url: "https://ytmp3.cc/", icon: bulletIcon },

            // Multiple
            { name: "racoon", url: "https://shailendramaurya.github.io/racoon/", icon: bulletIcon },
            { name: "ytiz.xyz", url: "https://ytiz.xyz/", icon: bulletIcon },
            { name: "lucida.to", url: "https://lucida.to/", icon: bulletIcon },
            { name: "cobalt.tools", url: "#", icon: bulletIcon },

            // Software
            { name: "slsknet.org", url: "https://www.slsknet.org/", icon: bulletIcon },
            { name: "spotube.dev", url: "https://spotube.krtirtho.dev/", icon: bulletIcon },
            { name: "github.io/downline", url: "https://stefnotch.github.io/downline/", icon: bulletIcon },
        ],
    },
    ebooks: {
        title: "eBooks",
        icon: "https://i.pinimg.com/736x/e2/de/08/e2de080fba8fbcad58252e680749b227.jpg",
        links: [
            // eBook Sites
            { name: "z-lib.gd", url: "https://z-lib.gd/", icon: bulletIcon },
            { name: "annas-archive.li", url: "https://annas-archive.li/", icon: bulletIcon },
            { name: "libgen.li", url: "https://libgen.li/", icon: bulletIcon },
            { name: "ebook-hunter.org", url: "https://ebook-hunter.org/", icon: bulletIcon },

            // Audiobooks
            { name: "galaxyaudiobook.com", url: "https://galaxyaudiobook.com/", icon: bulletIcon },
            { name: "audiobookbay.lu", url: "https://audiobookbay.lu/", icon: bulletIcon },
            { name: "nepu.to", url: "https://nepu.to/ebooks", icon: bulletIcon },

            // eBook Readers
            { name: "foxit.com", url: "https://www.foxit.com/pdf-reader/", icon: bulletIcon },
            { name: "flowoss.com", url: "https://www.flowoss.com/", icon: bulletIcon },
        ],
    },
    comics: {
        title: "Comics",
        icon: "https://i.pinimg.com/1200x/e4/69/3e/e4693eee797ae888e1a08b232bc455f3.jpg",
        links: [
            { name: "readcomiconline.li", url: "https://readcomiconline.li/", icon: bulletIcon },
            { name: "xoxocomic.com", url: "https://xoxocomic.com/", icon: bulletIcon },
            { name: "readcomicsonline.ru", url: "https://readcomicsonline.ru/", icon: bulletIcon },
            { name: "batcave.biz", url: "https://batcave.biz/", icon: bulletIcon },
            { name: "getcomics.org", url: "https://getcomics.org/", icon: bulletIcon },
        ],
    },
    vpn: {
        title: "VPN",
        icon: "https://i.pinimg.com/736x/cb/fd/de/cbfddee192c2a1afcbb98e14bc215acb.jpg",
        links: [
            { name: "ProtonVPN", url: "https://protonvpn.com", icon: bulletIcon },
            { name: "Mullvad", url: "https://mullvad.net", icon: bulletIcon },
        ],
    },
    adblockers: {
        title: "AdBlockers",
        icon: "https://i.pinimg.com/736x/e6/ca/db/e6cadbcd41fd8ba5dc7f54778f32d47c.jpg",
        links: [
            { name: "uBlock Origin", url: "https://ublockorigin.com/", icon: bulletIcon },
            { name: "AdBlock Plus", url: "https://adblockplus.org/", icon: bulletIcon },
            { name: "AdGuard", url: "https://adguard.com/", icon: bulletIcon },
            { name: "AdBlock", url: "https://getadblock.com/en/", icon: bulletIcon },
            { name: "Poper Blocker", url: "https://poperblocker.com/", icon: bulletIcon },
        ],
    },
};
