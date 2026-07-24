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
- [ ] **P1 — Test harness kur (jest + jest-expo).** Repo'da runner yok. İlk hedef pure helper'lar: `src/**/aggregate.ts`, `src/lib/categories.ts`, `computeNextPaymentDate`, `src/lib/format.ts` (bilerek saf tutuldular).
- [ ] **P2 — Core loop E2E'yi otomatize et.** Şu an manuel smoke: gelir kaynağı ekle → işlem logla → bütçe/hedef ilerlemesi. Detox/Maestro değerlendir.

### Görsel QA / tasarım sadakati
- [ ] **P3 — Pencil pixel-diff pass.** Desktop Pencil app hiçbir session'da attach olmadı (Phase 2/4/8/9/10 boyunca gap). App bağlıyken tüm ekranları `.pen` node'larına karşı diff'le.
- [ ] **P3 — Cross-theme görsel QA.** `light` / `vibrant` / `vibrant-dark` interaktif QA — şimdiye statik doğrulandı (tüm token key'leri paylaşımlı, undefined-token crash yok). Interaktif browser/device path olunca doğrula.

### Yeni özellikler
<!-- Buraya yeni feature fikirleri: her satır bağımsız /prp-plan girdisi -->
- [ ] _(örnek)_ Tekrarlayan ödeme hatırlatma bildirimleri
- [ ] _(örnek)_ İşlem CSV/PDF export
- [ ] _(örnek)_ Aylık özet / rapor ekranı

## In Progress
<!-- Aktif işlenen item — branch adı yaz -->

## Done
<!-- Bitmiş item'ler; PR# ekle -->
