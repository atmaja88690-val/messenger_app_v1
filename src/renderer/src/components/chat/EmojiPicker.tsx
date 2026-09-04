import { useEffect, useState } from 'react'

// Emoji disimpan sebagai SATU string per kategori, dipisah spasi. Bukan sekadar
// demi ringkas: banyak emoji terdiri dari beberapa titik kode (❤️ adalah U+2764
// ditambah variation selector, dan ada pula rangkaian ber-ZWJ), sehingga
// memecahnya per karakter dengan Array.from akan MERUSAK emoji itu sendiri.
// Spasi tidak pernah muncul di dalam satu emoji, jadi ia pemisah yang aman.
interface Kategori {
  ikon: string
  nama: string
  isi: string
}

const KATEGORI: Kategori[] = [
  {
    ikon: '😀',
    nama: 'Smileys',
    isi: '😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😗 😚 😙 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 🤨 😐 😑 😶 😏 😒 🙄 😬 🤥 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 🥴 😵 🤯 🤠 🥳 😎 🤓 🧐 😕 😟 🙁 ☹️ 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 👿 💀 ☠️ 💩 🤡 👹 👺 👻 👽 👾 🤖 😺 😸 😹 😻 😼 😽 🙀 😿 😾'
  },
  {
    ikon: '👍',
    nama: 'People',
    isi: '👋 🤚 🖐️ ✋ 🖖 👌 🤌 🤏 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 👐 🤲 🤝 🙏 ✍️ 💅 🤳 💪 🦵 🦶 👂 👃 🧠 🦷 👀 👁️ 👅 👄 💋 👶 🧒 👦 👧 🧑 👱 👨 🧔 👩 🧓 👴 👵 🙍 🙎 🙅 🙆 💁 🙋 🙇 🤦 🤷 👮 🕵️ 💂 👷 🤴 👸 👳 🧕 🤵 👰 🤰 👼 🎅 🤶 🦸 🦹 🧙 🧚 🧛 🧜 🧝 💆 💇 🚶 🧍 🧎 🏃 💃 🕺 👯 🧗 👭 👫 👬 💏 💑 👪 🗣️ 👤 👥 👣'
  },
  {
    ikon: '🐶',
    nama: 'Nature',
    isi: '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🙈 🙉 🙊 🐒 🐔 🐧 🐦 🐤 🐣 🐥 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🐛 🦋 🐌 🐞 🐜 🕷️ 🦂 🐢 🐍 🦎 🦖 🦕 🐙 🦑 🦐 🦀 🐡 🐠 🐟 🐬 🐳 🐋 🦈 🐊 🐅 🐆 🦓 🦍 🐘 🦏 🐪 🐫 🦒 🦘 🐄 🐎 🐖 🐑 🦙 🐐 🦌 🐕 🐩 🐈 🐓 🦃 🦚 🦜 🦢 🕊️ 🐇 🦝 🦦 🦥 🐁 🐀 🐿️ 🦔 🐾 🌵 🎄 🌲 🌳 🌴 🌱 🌿 ☘️ 🍀 🍃 🍂 🍁 🍄 🐚 🌾 💐 🌷 🌹 🥀 🌺 🌸 🌼 🌻 🌞 🌝 🌛 🌜 🌚 🌕 🌙 🌎 🌍 🌏 💫 ⭐ 🌟 ✨ ⚡ 💥 🔥 🌈 ☀️ ⛅ ☁️ 🌧️ ⛈️ ❄️ ☃️ ⛄ 💨 💧 💦 ☔ ☂️ 🌊'
  },
  {
    ikon: '🍔',
    nama: 'Food',
    isi: '🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🍆 🥑 🥦 🥬 🥒 🌶️ 🌽 🥕 🧄 🧅 🥔 🍠 🥐 🥯 🍞 🥖 🥨 🧀 🥚 🍳 🧈 🥞 🧇 🥓 🥩 🍗 🍖 🌭 🍔 🍟 🍕 🥪 🥙 🌮 🌯 🥗 🥘 🥫 🍝 🍜 🍲 🍛 🍣 🍱 🥟 🍤 🍙 🍚 🍘 🍥 🥮 🍢 🍡 🍧 🍨 🍦 🥧 🧁 🍰 🎂 🍮 🍭 🍬 🍫 🍿 🍩 🍪 🌰 🥜 🍯 🥛 🍼 ☕ 🍵 🧃 🥤 🍶 🍺 🍻 🥂 🍷 🥃 🍸 🍹 🍾 🧊 🥄 🍴 🍽️ 🥣 🥡 🥢 🧂'
  },
  {
    ikon: '⚽',
    nama: 'Activity',
    isi: '⚽ 🏀 🏈 ⚾ 🥎 🎾 🏐 🏉 🥏 🎱 🏓 🏸 🏒 🏑 🏏 🥅 ⛳ 🪁 🏹 🎣 🤿 🥊 🥋 🎽 🛹 ⛸️ 🎿 ⛷️ 🏂 🪂 🏋️ 🤼 🤸 ⛹️ 🤺 🤾 🏌️ 🏇 🧘 🏄 🏊 🤽 🚣 🚵 🚴 🏆 🥇 🥈 🥉 🏅 🎖️ 🎗️ 🎫 🎟️ 🎪 🤹 🎭 🎨 🎬 🎤 🎧 🎼 🎹 🥁 🎷 🎺 🎸 🎻 🎲 ♟️ 🎯 🎳 🎮 🎰 🧩'
  },
  {
    ikon: '✈️',
    nama: 'Travel',
    isi: '🚗 🚕 🚙 🚌 🚎 🏎️ 🚓 🚑 🚒 🚐 🚚 🚛 🚜 🛴 🚲 🛵 🏍️ 🚨 🚔 🚍 🚘 🚖 🚡 🚠 🚃 🚋 🚞 🚝 🚄 🚅 🚈 🚂 🚆 🚇 🚊 🚉 ✈️ 🛫 🛬 🛩️ 💺 🛰️ 🚀 🛸 🚁 🛶 ⛵ 🚤 🛳️ ⛴️ 🚢 ⚓ ⛽ 🚧 🚦 🚥 🗺️ 🗿 🗽 🗼 🏰 🏯 🏟️ 🎡 🎢 🎠 ⛲ ⛱️ 🏖️ 🏝️ 🏜️ 🌋 ⛰️ 🏔️ 🗻 🏕️ ⛺ 🏠 🏡 🏘️ 🏗️ 🏭 🏢 🏬 🏥 🏦 🏨 🏪 🏫 💒 🏛️ ⛪ 🕌 🛕 ⛩️ 🌅 🌄 🌠 🎇 🎆 🌇 🌆 🏙️ 🌃 🌌 🌉'
  },
  {
    ikon: '💡',
    nama: 'Objects',
    isi: '⌚ 📱 💻 ⌨️ 🖥️ 🖨️ 🖱️ 💽 💾 💿 📀 📷 📸 📹 🎥 📞 ☎️ 📠 📺 📻 🎙️ ⏱️ ⏰ 🕰️ ⌛ ⏳ 📡 🔋 🔌 💡 🔦 🕯️ 🧯 💸 💵 💴 💶 💷 💰 💳 💎 ⚖️ 🧰 🔧 🔨 🛠️ ⛏️ 🔩 ⚙️ 🧱 ⛓️ 🧲 💣 🧨 🔪 🗡️ ⚔️ 🛡️ 🚬 ⚰️ 🏺 🔮 📿 🧿 ⚗️ 🔭 🔬 💊 💉 🩹 🩺 🌡️ 🧬 🦠 🧪 🚽 🚿 🛁 🧴 🧷 🧹 🧺 🧻 🧼 🛒 🚪 🛋️ 🪑 🛏️ 🖼️ 🧳 🎁 🎈 🎏 🎀 🎊 🎉 🧧 ✉️ 📩 📨 📧 💌 📥 📤 📦 🏷️ 📪 📫 📬 📮 📜 📃 📄 📑 📊 📈 📉 🗒️ 🗓️ 📆 📅 📇 🗃️ 🗄️ 📋 📁 📂 🗂️ 🗞️ 📰 📓 📔 📒 📕 📗 📘 📙 📚 📖 🔖 🔗 📎 🖇️ 📐 📏 🧮 📌 📍 ✂️ 🖊️ 🖋️ ✒️ 🖌️ 🖍️ 📝 ✏️ 🔍 🔎 🔏 🔐 🔒 🔓 🗝️ 🔑'
  },
  {
    ikon: '❤️',
    nama: 'Symbols',
    isi: '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 ☮️ ✝️ ☪️ 🕉️ ☸️ ✡️ 🔯 ☯️ 🛐 ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ ⚛️ ☢️ ☣️ ❌ ⭕ 🛑 ⛔ 📛 🚫 💯 💢 ♨️ 🔞 🚭 ❗ ❕ ❓ ❔ ‼️ ⁉️ 🔅 🔆 ⚠️ 🔱 ⚜️ 🔰 ♻️ ✅ 💹 ❇️ ✳️ ❎ 🌐 💠 🌀 💤 🏧 ♿ 🅿️ 🚹 🚺 🚼 🚻 🚮 📶 ℹ️ 🔤 🔡 🔠 🆗 🆙 🆒 🆕 🆓 🔟 🔢 ▶️ ⏸️ ⏹️ ⏺️ ⏭️ ⏮️ ⏩ ⏪ ◀️ 🔼 🔽 ➡️ ⬅️ ⬆️ ⬇️ ↗️ ↘️ ↙️ ↖️ ↕️ ↔️ ↪️ ↩️ 🔀 🔁 🔂 🔄 🔃 🎵 🎶 ➕ ➖ ➗ ✖️ ♾️ 💲 💱 ™️ ©️ ®️ 〰️ ➰ 🔚 🔙 🔛 🔝 🔜 ✔️ ☑️ 🔘 🔴 🟠 🟡 🟢 🔵 🟣 ⚫ ⚪ 🟤 🔺 🔻 🔸 🔹 🔶 🔷 🟥 🟧 🟨 🟩 🟦 🟪 ⬛ ⬜ 🟫 🔈 🔇 🔉 🔊 🔔 🔕 📣 📢 💬 💭 🗯️ ♠️ ♣️ ♥️ ♦️ 🃏 🎴 🀄'
  }
]

// Kunci BARU, tidak menyentuh kunci sesi mana pun. Awalan bsi_ dipertahankan
// supaya seragam dengan kunci lain di aplikasi ini.
const RECENT_KEY = 'bsi_emoji_recent'
const MAX_RECENT = 24

export default function EmojiPicker({
  onPick,
  gelap = false
}: {
  onPick: (emoji: string) => void
  gelap?: boolean
}): React.JSX.Element {
  // -1 = tab "terakhir dipakai".
  const [tab, setTab] = useState(-1)
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY)
      const arr = raw ? (JSON.parse(raw) as string[]) : []
      setRecent(arr)
      // Kalau belum pernah memakai emoji, tab "terakhir" kosong dan membingungkan.
      if (arr.length === 0) setTab(0)
    } catch {
      setTab(0)
    }
  }, [])

  const pakai = (e: string): void => {
    onPick(e)
    setRecent((prev) => {
      const next = [e, ...prev.filter((x) => x !== e)].slice(0, MAX_RECENT)
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      } catch {
        // Daftar terakhir dipakai bukan data penting -- kegagalan menyimpannya
        // tidak boleh menghalangi emoji-nya terkirim.
      }
      return next
    })
  }

  const daftar = tab === -1 ? recent : KATEGORI[tab].isi.split(' ').filter(Boolean)

  const tabCls = (aktif: boolean): string =>
    `flex-1 py-1.5 text-lg leading-none rounded-md transition-colors ${
      aktif
        ? gelap
          ? 'bg-gray-700'
          : 'bg-gray-200'
        : gelap
          ? 'hover:bg-gray-700/60'
          : 'hover:bg-gray-100'
    }`

  return (
    <div className={`w-[336px] ${gelap ? 'text-gray-100' : 'text-gray-900'}`}>
      <div className={`flex gap-0.5 px-1.5 pt-1.5 pb-1 ${gelap ? '' : 'border-b border-gray-100'}`}>
        {recent.length > 0 && (
          <button type="button" title="Recent" onClick={() => setTab(-1)} className={tabCls(tab === -1)}>
            🕘
          </button>
        )}
        {KATEGORI.map((k, i) => (
          <button key={k.nama} type="button" title={k.nama} onClick={() => setTab(i)} className={tabCls(tab === i)}>
            {k.ikon}
          </button>
        ))}
      </div>

      <div className="h-56 overflow-y-auto px-1.5 py-1.5">
        {daftar.length === 0 ? (
          <div className={`text-xs px-2 py-4 ${gelap ? 'text-gray-400' : 'text-gray-500'}`}>
            No emoji used yet
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-0.5">
            {daftar.map((e, i) => (
              <button
                key={e + i}
                type="button"
                onClick={() => pakai(e)}
                className={`h-9 text-2xl leading-none rounded-md transition-transform active:scale-90 ${
                  gelap ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
