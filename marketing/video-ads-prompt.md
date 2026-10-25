# Create video ads for "حماية": home Wi-Fi parental-control setup in Morocco

You are a senior motion designer and performance-ad creative working in **HyperFrames**: you build each video as an HTML composition with timed animation and render it to MP4.

Build a small set of short, conversion-focused social video ads for the service described below. Use the HyperFrames conventions you know for composition structure, timing and rendering. Everything below is about **what** to make and the rules it must follow.

---

## 1. The business (source of truth; do not change or embellish)

- **Brand name:** حماية (Latin: Himaya)
- **Service:** A technician helps families configure their **existing home Wi-Fi router** to filter adult and other inappropriate websites, using whatever filtering options the router supports.
- **Market:** Morocco. **Audience:** parents and families.
- **Price:** **200 درهم** (200 MAD), one clear price.
- **How it works (4 steps):**
  1. عمّر الفورم: the customer fills in the request form.
  2. نتأكدو من الراوتر: we check the router supports suitable filtering.
  3. نحددو الموعد: we confirm the appointment.
  4. نفعّلو الحماية: we configure and test the supported settings.
- **What 200 MAD includes:** router compatibility check · configuration of supported filtering options · basic functionality test · simple explanation of how to manage the settings.
- **Main CTA:** «طلب الخدمة دابا»
- **Website:** `[YOUR-DOMAIN.ma]`. Leave this exact placeholder visible on the end card and ask me for the real domain before the final render.

### Honesty rules (non-negotiable)
- Never say or imply «حماية 100%», «منع جميع المواقع», "guaranteed", "complete protection", or anything equivalent.
- Protection depends on the router. It covers **home Wi-Fi only**, not mobile data (4G/5G) or other networks. VPNs can bypass it. It **complements** parental supervision and does not replace it.
- Ads A and B must show this fine print on the end card, small but readable:
  «الحماية كتتعلق بإمكانيات الراوتر، وكتغطي غير Wi-Fi ديال الدار.»
- **Do not invent** testimonials, reviews, ratings, customer counts, statistics, phone numbers, WhatsApp numbers, addresses, discounts, deadlines or guarantees.
- No fear-based marketing: no threatening imagery, no distressed or crying children, no "danger" red alerts, no hacker or skull/glitch clichés.
- Never depict or hint at adult content, not even blurred screens. Keep everything abstract: router, shield, Wi-Fi signal, home, family icons.

---

## 2. Brand look

**Tone:** calm, premium, trustworthy, like a modern family-safety or cybersecurity brand. Reassuring, not childish.

**Colors** (use exactly these):

| Token | Hex | Use |
|---|---|---|
| navy-950 | `#071430` | deepest backgrounds |
| navy-900 | `#0b1b3a` | main dark background, headings on light |
| navy-800 | `#102a56` | router body, logo tile |
| navy-700 | `#1a3a6e` | secondary shapes |
| navy-50 | `#f4f7fc` | light backgrounds |
| white | `#ffffff` | text on dark, cards |
| green-500 | `#1a9e68` | primary accent, CTA button, shield |
| green-600 | `#11774d` | green text on light backgrounds |
| green-100 | `#dcf3e8` | soft green badges |
| led-green | `#34c48a` | small glowing details |
| muted text | `#4a5872` | secondary text on light |

Use green sparingly as the accent. No rainbow gradients or neon. Subtle soft shadows and rounded corners (16–24px radius on cards) are on-brand.

**Typography:** **IBM Plex Sans Arabic** (weights 400/500/600/700). Bundle the font files locally in the project so the render never falls back to a system font, and verify in a rendered frame that the Arabic text uses Plex.

**Logo** (navy rounded tile with a green shield and white check, followed by the word حماية):
```html
<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
  <rect width="34" height="34" rx="10" fill="#102a56"/>
  <path d="M17 7.5 24.5 10.5v5.4c0 4.6-3.1 8.5-7.5 10.1-4.4-1.6-7.5-5.5-7.5-10.1v-5.4L17 7.5Z" fill="#1a9e68"/>
  <path d="m13.6 16.6 2.4 2.4 4.4-4.6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
<span style="font-weight:700">حماية</span>
```
(On dark backgrounds, make the tile white and the wordmark white.)

**Hero visual:** a flat, clean illustration of a dark-navy home router with two antennas, three small LEDs (two green, one light blue), green Wi-Fi arcs above it, and a green shield with a white checkmark overlapping its front corner. Floating around it are small white rounded cards with simple icons: a house, a parent-and-child pair, and a padlock next to an "ON" toggle switch.
If you have access to the website repo, reuse the exact SVG from `src/components/ui/RouterIllustration.tsx` and animate its parts separately: arcs, router, shield, cards. Otherwise recreate it in the same style.

**People:** prefer icons and illustration. If people appear, use simple flat silhouettes or icons only. No photorealistic or AI-generated faces, and no children looking at screens.

---

## 3. Arabic / RTL rules (these break easily, so check them)

- All compositions use `dir="rtl"` and `lang="ar"`. Text is right-aligned or centered.
- **Never split Arabic text into individual letters for animation.** It breaks letter joining. Animate whole **words or lines** (fade/slide/mask per word or line).
- Wrap Latin fragments (Wi-Fi, VPN, 4G/5G, the domain) in `<bdi>` so punctuation and word order don't flip.
- Use Western digits for the price: **200**, written «200 درهم».
- Minimum sizes at 1080 px width: headlines ≥ 72px, supporting text ≥ 44px, fine print ≥ 30px. Line-height ~1.4 for Arabic.
- Max ~7 words per on-screen line and one idea per scene, so it's readable on mute in ≤ 2 seconds.

---

## 4. Deliverables

| ID | Duration | Format | Purpose |
|---|---|---|---|
| **A** | 15 s | 9:16 (1080×1920) | Main ad: Reels, TikTok, Stories |
| **A-feed** | 15 s | 4:5 (1080×1350) | Same as A, re-laid-out for Facebook/Instagram feed (not just cropped) |
| **B** | 30 s | 9:16 | Explainer: how it works + what's included |
| **C** | 6 s | 9:16 | Bumper / retargeting |

All at 30 fps, H.264 MP4. Name the files `himaya-A-15s-9x16.mp4`, `himaya-A-15s-4x5.mp4`, `himaya-B-30s-9x16.mp4`, `himaya-C-6s-9x16.mp4`.

**Safe zones (9:16):** keep all text and the CTA inside the central area. Leave the top ~250px clear for the profile header, the bottom ~450px for captions and buttons, and ~140px on the **right** edge for TikTok/Reels action buttons. RTL text aligns right, so it naturally drifts toward those buttons; keep it clear. (4:5: ~60px margin all round.)

**Sound:** design for **muted viewing first**; the on-screen text tells the whole story. Add a calm, modern, light instrumental bed only if you have a royalty-free or properly licensed track; otherwise render without music and tell me where to drop one in. Optional Darija voice-over lines are given below. If you generate VO, the text on screen must still match it.

---

## 5. Scripts

Timings are targets; adjust ±0.5 s for rhythm. On-screen text is exact. Do not rewrite the Darija without asking.

### Ad A: 15 s (main)

| Time | Visual | On-screen text |
|---|---|---|
| 0.0–2.5 | Dark navy bg. Wi-Fi arcs pulse in softly from the center, then a question mark resolves into the router outline. Strong, immediate motion in the first 0.5 s. | «Wi-Fi ديال الدار… واش فيه حماية؟» |
| 2.5–6.0 | Router builds piece by piece; the green shield slides in and "locks" onto it with a gentle scale bounce and the check drawing itself. | «نعاونوك تفعّل الحماية على الراوتر ديالك» |
| 6.0–10.0 | Three white benefit chips with green check icons enter one by one (stagger ~0.4 s), stacked vertically. | «بلا ما تشري جهاز جديد» · «كنتأكدو من الراوتر قبل الموعد» · «شرح واضح وبسيط» |
| 10.0–12.5 | Switch to a light bg. Big price lockup in a navy pill; a subtle shine sweep crosses it once. | «200 درهم فقط» |
| 12.5–15.0 | End card: logo top, green CTA button (with a gentle 1× pulse), domain under it, fine print at bottom. | «طلب الخدمة دابا» · `[YOUR-DOMAIN.ma]` · fine print (see §1) |

Optional VO: «واش Wi-Fi ديال الدار فيه حماية؟ نعاونوك تفعّل إعدادات الحماية على الراوتر ديالك، بلا ما تشري جهاز جديد. غير بـ200 درهم. طلب الخدمة دابا.»

### Ad B: 30 s (explainer)

| Time | Visual | On-screen text |
|---|---|---|
| 0–3 | Same hook style as A. | «الولاد كيتصلو بالإنترنت ديال الدار كل نهار» |
| 3–6 | Router + shield build. | «تقدر تزيد طبقة حماية من الراوتر نيت» |
| 6–18 | The 4 steps, ~3 s each. Each step is a numbered navy circle plus an icon (form, magnifier, calendar, shield), with a thin progress line connecting 1→4 as it advances. | ① «عمّر الفورم» ② «نتأكدو من الراوتر» ③ «نحددو الموعد» ④ «نفعّلو الحماية» |
| 18–23 | "What's included" card, 4 checked lines appearing in sequence. | «فحص التوافق ديال الراوتر» · «إعداد الفلترة المتوفرة» · «تجربة باش نتأكدو أنها خدامة» · «شرح كيفاش تسيّر الإعدادات» |
| 23–26 | Calm honesty beat: small info icon, light bg. | «كتكمّل دور الوالدين، وما كتعوّضوش» |
| 26–30 | Price + end card (as in A). | «200 درهم» · «طلب الخدمة دابا» · `[YOUR-DOMAIN.ma]` · fine print |

Optional VO: «الولاد كيتصلو بالإنترنت ديال الدار كل نهار. تقدر تزيد طبقة حماية من الراوتر نيت. عمّر الفورم، كنتأكدو من الراوتر ديالك، كنحددو الموعد، وكنفعّلو إعدادات الحماية المتوفرة ونجربوها معاك. هاد الخدمة كتكمّل دور الوالدين، وما كتعوّضوش. الثمن 200 درهم. طلب الخدمة دابا.»

### Ad C: 6 s (bumper)

| Time | Visual | On-screen text |
|---|---|---|
| 0–2 | Shield snaps onto the router. | «حماية Wi-Fi ديال الدار» |
| 2–4 | Price pill. | «200 درهم» |
| 4–6 | CTA + logo + domain (no fine print needed at this length, but keep «حسب الراوتر ديالك» under the price). | «طلب الخدمة دابا» · `[YOUR-DOMAIN.ma]` |

---

## 6. Motion style

- Restrained and smooth: ease-out entrances of 0.4–0.7 s, small travel distances (20–60 px), soft scale (0.94→1). One focal movement at a time.
- Hold each text line long enough to read: at least ~1.6 s fully visible.
- Allowed: masked line reveals, word-by-word fades, check marks drawing themselves, gentle Wi-Fi pulse, one shine sweep on the price.
- Avoid: flashing or strobing, glitch/RGB-split effects, shaky camera, spinning 3D text, emoji, stock "hacker" visuals, more than one CTA pulse.
- Transitions between scenes: quick crossfade or a clean wipe in brand navy/green (~0.3 s).

---

## 7. How to work

1. **Plan first.** Before writing code, reply with a short storyboard: one line per scene for each ad, plus your font and asset approach. Ask me for the real domain and whether I have a music track. Wait for my OK.
2. Build **Ad A (9:16)** first and render it. Then send me still frames at 1 s, 4 s, 8 s, 11 s and 14 s so I can review before you do the rest.
3. After approval, build A-feed, B and C, reusing the same components (logo, router illustration, chips, price pill, end card).
4. Before delivering, check each video against this list:
   - [ ] All Arabic is joined correctly (no isolated letters), RTL order correct, Latin words not flipped
   - [ ] IBM Plex Sans Arabic actually rendered (not a fallback font)
   - [ ] Every line readable on a phone and on screen ≥ 1.6 s
   - [ ] Text and CTA inside the safe zones
   - [ ] Price shows exactly «200 درهم»; CTA exactly «طلب الخدمة دابا»
   - [ ] Fine print present on A, A-feed and B
   - [ ] No forbidden claims, invented proof, fear imagery or real-looking faces
   - [ ] Domain placeholder replaced (or flagged to me if not provided)
   - [ ] Correct resolution, 30 fps, H.264, file names as specified
5. Deliver the MP4s plus the source project, and list anything you couldn't do or had to approximate.
