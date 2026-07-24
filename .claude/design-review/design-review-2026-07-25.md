# FollowFlow — Canlı Cihaz Tasarım İncelemesi

**Tarih:** 2026-07-25 · **Cihaz:** Pixel 8 emulator (Android 17, 1080×2400) · **Yöntem:** mobile-mcp ile canlı gezinme, ekran ekran.

Kapsanan ekranlar: Ana Sayfa, İşlemler, Bütçeler, Hedefler, Hedef Detayı, Para Ekle (modal), Yeni İşlem (modal), Ayarlar, Gelir Kaynaklarım, Tekrarlayan Ödemeler. Ayrıca 3 tema doğrulandı (Koyu, Açık, Canlı).
Görülemedi (oturum açık): Login, Onboarding (Gelir/Ödeme/Hedef) — logout riski nedeniyle atlandı.


---

## Ekran ekran bulgular

### 1. Ana Sayfa (Home)
**İyi:** Net durum kartı (₺92.000 + Gelir/Gider kırılımı) güçlü hiyerarşi. Düzenli gelir + yaklaşan ödeme "info row" chevron'ları temiz. Kategori Dağılımı donut + merkez toplam okunaklı. Bütçe İlerleme + Son İşlemler + FAB tam akış.
**Geliştir:**
- Donut tek kategori (Kira) — tek dilimli donut zayıf görünüyor; ≥2 kategori olana kadar farklı görsel (bar/oran) düşün.
- "Bütçe İlerleme" barı %0'da neredeyse görünmez; boş durumda ince placeholder + etiket iyi olur.
- Kart üstündeki dişli (373,88) ile overlay dişli çakışıyor — iki ayar girişi kafa karıştırıcı.

### 2. İşlemler
**İyi:** Arama + segmented toggle (Tümü/Gelir/Gider) net. Satırlar ikon+kategori+tarih+tutar, renk kodlu (kırmızı/yeşil).
**Geliştir:** Boş alan çok — "Bu Hafta" dışında gruplama/ay ayracı yok. Az veri boş durumu için placeholder ekle.

### 3. Bütçeler
**İyi:** Kart + progress + "Kalan" net. Başlık altı "Temmuz 2026 · 1 kategori" iyi context.
**Geliştir:** %0 progress barı görünmez. "Fatura" kategorisinde harcama yokken %0 yerine "Henüz harcama yok" daha bilgilendirici.

### 4. Hedefler
**İyi:** Hedef kartı — %20 rozet, progress bar, "Tahmini: Eylül 2026" projeksiyonu değerli. Toplam biriktirme özeti başlıkta.
**Geliştir:** Tek CTA ("Yeni Hedef Ekle") — iyi. Kart tıklanınca detaya gidiyor, keşfedilebilirlik için chevron/ipucu eklenebilir.

### 5. Hedef Detayı — **en güçlü ekran**
**İyi:** Biriktirilen vs Hedef büyük tipografi, Aylık İlerleme bar chart, Katkılar listesi (sil aksiyonu), "Bu hızda 4 ayda tamamlanır" + hesaplama açıklaması banner'ları, alt sabit "Para Ekle" CTA. Bilgi mimarisi çok iyi.
**Geliştir:** Bar chart'ta sadece son ay dolu, diğer aylar düz çizgi — boş aylar için hafif grid/etiket netliği artırılabilir.

### 6. Para Ekle (modal) & 7. Yeni İşlem (modal)
**İyi:** Numpad bottom-sheet tutarlı, büyük tutar, not alanı, tek net CTA (Ekle/Kaydet). Yeni İşlem'de Gider/Gelir toggle + kategori chip'leri + tarih seçici zengin.
**🟠 A11y bug:** Hedef Detayı + Para Ekle açıkken iki buton aynı koordinatta üst üste (`"Bu Hedefe Para Ekle"` ve `"Ekle"` ikisi de @ 63,2201 954×136). Modal açılınca arkadaki CTA erişilebilirlik ağacından kaldırılmalı (screen reader/focus tuzağı).
- Modal overlay arka planı yeterince koyulaşmıyor — arkadaki "₺92.000" hâlâ okunuyor, dikkat dağıtıyor. Scrim opaklığını artır.

### 8. Ayarlar
**İyi:** 4 tema (Koyu/Açık/Canlı/C.Koyu) segmented, Dil (TR/EN), Yönetim linkleri, kırmızı "Çıkış Yap" doğru vurgu. Tema geçişleri anında ve temiz çalışıyor.
**Geliştir:** Segmented toggle dokunma hedefi biraz dar (ilk denemede ıskaladım) — min 48dp yükseklik ver.

### 9. Gelir Kaynaklarım & 10. Tekrarlayan Ödemeler
**İyi:** Tutarlı kart deseni — ikon, ad, tutar, periyot + "Sonraki/Her ayın 1'i", satır içi edit/sil, alt "Ekle" CTA. İki ekran birebir tutarlı, iyi.
**Geliştir:** Edit (kalem) ve Sil (çöp) ikonları yan yana ve küçük — yanlış dokunma riski. Sil için onay dialog'u şart (yıkıcı aksiyon).

---

## Tema doğrulaması
- **Koyu:** teal accent, near-black yüzey — referans, sağlam.
- **Açık:** off-white + teal, kontrast iyi.
- **Canlı:** mor accent (#6D4DF2) beyaz üstünde — canlı, home ekranı çok iyi duruyor.
- Geçişler anında, layout kaymıyor. ✅ (C.Koyu test edilmedi ama diğer 3 sağlamdı.)

---

## Öncelikli aksiyon listesi
1. **[P0]** Yıkıcı aksiyonlara onay: Sil (gelir kaynağı, tekrarlayan ödeme, katkı).
2. **[P1]** Modal açıkken arka CTA'yı a11y ağacından çıkar + scrim opaklığını artır.
3. **[P1]** %0 progress bar'ları için görünür boş-durum (bütçe, home).
4. **[P2]** Dokunma hedefleri: tema toggle + edit/sil ikonları min 48dp.
5. **[P2]** Az veri ekranları için boş-durum placeholder'ları (İşlemler, tek dilimli donut).
