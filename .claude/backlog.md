# FollowFlow — Backlog

v1 kapsamı (Phase 0–11) tamamlandı — bkz [`phases.md`](./phases.md) (dondurulmuş, tarihsel kayıt).
Yeni işler buradan izlenir. Fazlar sıralı/tek-seferlikti; bu liste akan — istediğin an ekle/çıkar/önceliklendir.

**Akış (item başına):** `/prp-plan <item>` → `/prp-implement` → `/code-review` → `/prp-commit` → `/prp-pr` → web merge → local branch temizle → item'i `Done`'a taşı.

Öncelik: **P0** blocker / **P1** yakında / **P2** sonra / **P3** nice-to-have.

---

## Todo

### Auth & prod hazırlık
- [ ] **P1 — Google OAuth aktifle.** Supabase dashboard'da Google provider + Google Cloud OAuth client konfig. `Button/Google CTA` atomu ve email/parola yolu zaten hazır; sadece provider bağlı değil. Not: Expo'da native popup ilk denemede açılmadı (bkz memory `project_google_auth_deferred`). _(Phase 5 raporundan devir)_
- [ ] **P0 — Email confirmation deep-link flow.** Dev için Supabase'de kapalı; prod öncesi confirm e-postası + deep-link handler şart (bkz memory `project_email_confirmation_deferred`).

### Test altyapısı
- [ ] **P3 — Component test altyapısı.** `@testing-library/react-native` kur; UI bileşenlerine render/etkileşim testleri yaz (ilk adaylar: `TransactionFilterPanel`, `DateField`, `BadgeCount`, `SearchBar`). Şu an tüm testler saf mantık (lib) testleri — component test kütüphanesi hiç kurulu değil. _(Arama+filtre code review bulgusu)_

### Görsel QA / tasarım sadakati
- [ ] **P3 — Pencil pixel-diff pass.** Desktop Pencil app hiçbir session'da attach olmadı (Phase 2/4/8/9/10 boyunca gap). App bağlıyken tüm ekranları `.pen` node'larına karşı diff'le.
- [ ] **P3 — Cross-theme görsel QA.** `light` / `vibrant` / `vibrant-dark` interaktif QA — şimdiye statik doğrulandı (tüm token key'leri paylaşımlı, undefined-token crash yok). Interaktif browser/device path olunca doğrula.

### Yeni özellikler
<!-- Buraya yeni feature fikirleri: her satır bağımsız /prp-plan girdisi -->
- [ ] **P1 — Bildirimler.** Tekrarlayan ödeme yaklaşınca hatırlatma; bütçe %80 dolunca uyarı.
- [ ] **P2 — Veri dışa aktarma (CSV).** İşlemleri CSV olarak dışa aktar.
- [ ] **P2 — Hızlı işlem şablonları.** Sık girilen işlemi ("Market 500₺") tek dokunuşla tekrar gir.
- [ ] **P2 — Gelişmiş raporlar.** Aylık/yıllık trend, kategori ısı haritası, PDF/Excel export, yıl sonu özeti ("Wrapped" tarzı).
- [ ] **P2 — Çoklu para birimi + döviz/altın takibi.** USD/EUR/gram altın cinsi birikim; hedefi döviz cinsinden tutabilme.

## In Progress
<!-- Aktif işlenen item — branch adı yaz -->

## Done
<!-- Bitmiş item'ler; PR# ekle -->
- [x] **P2 — Arama + filtre geliştirme.** İşlemlerde tarih aralığı, kategori (çoklu), tutar aralığı filtreleri; animasyonlu panel, sayaç rozeti. Saf `filterTransactions` helper + 16 unit test. Yeni: `BadgeCount` atom, `DateField` molekül. PR #19.
- [x] **P1 — Test harness kur (jest + jest-expo).** 60 unit test (`aggregate`, `onboarding`, `amountInput`, `format`, `categories`) + `computeNextPaymentDate` Aralık rollover bug fix. PR #14.
- [x] **P2 — Core loop E2E'yi otomatize et.** ✅ Maestro suite (`.maestro/`): signup → onboarding → home → gider işlemi → ana ekran doğrulaması. Emülatörde 2/2 flow yeşil (2026-07-25). Bkz `.claude/PRPs/reports/core-loop-e2e-report.md`. PR #15.
- [x] **P2 — Kategori özelleştirme.** Kullanıcı kendi kategorisini ekler: ad + ikon + renk.
- [x] **P2 — Takvim görünümü.** Ayarlar → Takvim: ay ızgarası (ödeme/maaş günü/işlem işaretleri), nakit akışı şeridi, gün detayı. 15 unit test. PR #18.
