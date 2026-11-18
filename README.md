# Stained Glass · Vitray Dökümü

Kurşun çerçeveli vitray bulmacası prototipi (Bulmaca Konsept Atlası #8).

- **Web'de Oyna:** [https://cankyra.github.io/StainedGlass/](https://cankyra.github.io/StainedGlass/) (iPhone Safari'de *Paylaş → Ana Ekrana Ekle* ile tam ekran uygulama gibi de çalışır)
- **Paket Kimliği (iOS):** `com.cankyra.stainedglass`

## Mekanik

1. **Döküm ve Taşma:** Potadan bir renk seçip boş bölmeye dokunduğunda erimiş cam bölmeyi doldurur. Kurşun çerçevedeki altın oklu açıklıklardan cam **aşağıdaki** boş bölmelere zincirleme akar.
2. **Döküm Sırası Stratejisi:**
   - Alt-üst bölmeler aynı renkse üstten dökerek tek döküm hakkıyla birden fazla bölmeyi doldurursun.
   - Alt bölme farklı renkse önce alttaki bölmeyi doldurup katılaştırırsın (**dolu bölme akışı keser**), ardından üsttekini güvenle dökersin.
3. **Özel Teknikler (Koleksiyon 5+):**
   - **✦ Prizma Cam:** Her rengi kabul eder, üzerinden geçen cam rengini koruyarak akmaya devam eder.
   - **🔒 Mühürlü Bölme:** Aynı harfli anahtar bölmesi dolana kadar döküm almaz ve akışı durdurur.
   - **⟳ Döner Kapak:** Her dökümden sonra açılıp kapanır, dökümlerin ritmini belirler.
4. **Booster'lar:** `❄ Soğut` (sıradaki döküm taşmaz), `🔗 Lehim`, `+2 Döküm`, `↶ Geri al`, `? İpucu` (BFS çözücü ile en kısa hamle).
5. **Koleksiyon Albümü:** 12 koleksiyonda 144 vitray ve 432 yıldız. Bölümler sırayla açılır.

## Oyun Modları

- **Usta Kulesi:** 10. seviyeden sonra açılan sonsuz mod. Her 10. kat bir muhafız katıdır.
- **Günün Vitrayı:** Her gün yeni bir bulmaca ve günlük seri.
- **Günlük Görevler:** Her gün 3 görev ve bir bonus sandık.
- **Başarımlar:** 24 ustalık hedefi ve altın ödülleri.

## App Store Connect & TestFlight Kurulumu

1. **GitHub Secrets:** `SandGate` reposunda kullandığın aynı 4 App Store Connect secret'ını bu repoya da ekle (`Settings → Secrets and variables → Actions`):
   - `APPLE_TEAM_ID`
   - `ASC_KEY_ID`
   - `ASC_ISSUER_ID`
   - `ASC_KEY_P8`
2. **Paket Kimliği Kaydı:** Secrets eklendikten sonra **Actions → Apple kurulumu → Run workflow** çalıştırıldığında `com.cankyra.stainedglass` Bundle ID'si Apple Developer hesabına otomatik kaydedilir.
3. **App Store Connect Uygulama Kaydı:** [App Store Connect → Uygulamalar](https://appstoreconnect.apple.com/apps) → **+** → **Yeni Uygulama**:
   - **Platform:** iOS
   - **Ad:** `Stained Glass: Vitray` (veya uygun bir varyasyon)
   - **Paket Kimliği:** `com.cankyra.stainedglass`
   - **SKU:** `stainedglass-001`
4. **TestFlight Yüklemesi:** **Actions → iOS TestFlight → Run workflow** ile derleme imzalanıp doğrudan TestFlight'a gönderilir.
