import Foundation
import CryptoKit

// CallKit menuntut UUID; callId BSIM bukan UUID. Menyimpan peta [String: UUID]
// di memori TIDAK cukup: push pembatalan bisa tiba di proses yang berbeda
// (aplikasi sempat dimatikan di antaranya) sehingga petanya kosong dan dering
// tidak bisa dihentikan. Turunan deterministik membuat proses mana pun
// menghitung UUID yang sama dari callId yang sama.
enum CallUuid {

    // Namespace tetap milik BSIM. JANGAN DIUBAH setelah rilis pertama:
    // mengubahnya membuat UUID panggilan yang sedang berjalan tidak lagi cocok,
    // sehingga push "cancel" gagal menghentikan dering yang sudah berbunyi.
    private static let namespace = UUID(uuidString: "6f3d1a52-6c1e-5b7a-9d84-0c2a5f1b7e33")!

    static func from(callId: String) -> UUID {
        // Kalau backend suatu saat mengirim UUID asli, pakai langsung.
        if let direct = UUID(uuidString: callId) { return direct }
        return v5(namespace: namespace, name: callId)
    }

    // UUID versi 5 (SHA-1) sesuai RFC 4122.
    private static func v5(namespace: UUID, name: String) -> UUID {
        var bytes = [UInt8]()
        withUnsafeBytes(of: namespace.uuid) { bytes.append(contentsOf: $0) }
        bytes.append(contentsOf: Array(name.utf8))

        var d = Array(Insecure.SHA1.hash(data: Data(bytes)))
        d[6] = (d[6] & 0x0F) | 0x50   // versi 5
        d[8] = (d[8] & 0x3F) | 0x80   // varian RFC 4122

        return UUID(uuid: (d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7],
                           d[8], d[9], d[10], d[11], d[12], d[13], d[14], d[15]))
    }
}
