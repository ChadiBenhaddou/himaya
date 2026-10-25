import type { IconName } from "@/components/ui/Icon";

/**
 * All landing-page copy lives here so it can be edited without touching layout code.
 * Do not add testimonials, ratings, statistics or contact details that aren't real.
 */

export const SITE = {
  name: "حماية",
  nameLatin: "Himaya",
  tagline: "إعداد الرقابة الأبوية على Wi-Fi ديال الدار",
  priceMad: 200,
  title: "حماية | إعداد الرقابة الأبوية على Wi-Fi ديال الدار بـ200 درهم",
  description:
    "خدمة فالمغرب كتعاونك تفعّل إعدادات الفلترة على الراوتر ديال الدار باش تنقص من المحتوى غير المناسب. الثمن 200 درهم، مع فحص التوافق ديال الراوتر وشرح واضح.",
} as const;

export const PRICE_LABEL = `${SITE.priceMad} درهم`;

export const CTA = {
  primary: "طلب الخدمة دابا",
  secondaryHero: "شوف كيفاش كتخدم",
  secondary: "كيفاش كتخدم الخدمة؟",
} as const;

export const NAV_LINKS = [
  { href: "#how", label: "كيفاش كتخدم" },
  { href: "#price", label: "الثمن" },
  { href: "#limits", label: "مهم تعرف" },
] as const;

export const HERO = {
  title: "حمي عائلتك من المحتوى غير المناسب فالإنترنت",
  text: "بـ200 درهم فقط، نعاونك تفعّل إعدادات الحماية على شبكة Wi-Fi ديال الدار، حسب الإمكانيات ديال الراوتر ديالك.",
  points: [
    "كنتأكدو من الراوتر قبل الموعد",
    "بلا ما تشري جهاز جديد",
    "شرح واضح لشنو تفعّل",
  ],
} as const;

export const BENEFITS: { title: string; text: string; icon: IconName }[] = [
  {
    title: "إعداد الحماية من الراوتر",
    text: "كنفعّلو خيارات الفلترة لي كيدعمها الراوتر، من بلاصة وحدة، على شبكة Wi-Fi ديال الدار.",
    icon: "shieldCheck",
  },
  {
    title: "بلا ما تشري جهاز جديد",
    text: "إلا كان الراوتر لي عندك كيدعم الإعدادات اللازمة، كنخدمو بيه هو، وما محتاجش تشري جهاز آخر.",
    icon: "router",
  },
  {
    title: "شرح واضح وبسيط",
    text: "كنشرحو ليك شنو تفعّل، كيفاش كيخدم، وشنو هي الحدود ديالو، بكلام ساهل ومفهوم.",
    icon: "chat",
  },
];

export const STEPS: { title: string; text: string; icon: IconName }[] = [
  {
    title: "عمّر الفورم",
    text: "خلّي لينا الاسم، رقم الهاتف، المدينة، والموعد لي مناسب ليك.",
    icon: "clipboard",
  },
  {
    title: "نتأكدو من الراوتر",
    text: "كنتأكدو واش الراوتر ديالك كيدعم شي طريقة فلترة مناسبة.",
    icon: "search",
  },
  {
    title: "نحددو الموعد",
    text: "كنتواصلو معاك باش نأكدو الموعد لي مناسب ليك.",
    icon: "calendar",
  },
  {
    title: "نفعّلو الحماية",
    text: "كنفعّلو الإعدادات المتوفرة وكنجربوها معاك باش نتأكدو أنها خدامة.",
    icon: "shieldCheck",
  },
];

export const PRICE_INCLUDES = [
  "فحص أولي ديال التوافق ديال الراوتر",
  "إعداد خيارات الفلترة لي كيدعمها الراوتر",
  "تجربة أساسية باش نتأكدو أن الإعدادات خدامة",
  "شرح بسيط كيفاش تسيّر الإعدادات من بعد",
] as const;

export const LIMITATIONS: { title: string; text: string; icon: IconName }[] = [
  {
    title: "الحماية كتتعلق بالراوتر",
    text: "مستوى الحماية كيتعلق بنوع الراوتر وبطريقة الفلترة لي كيدعمها. الإمكانيات كتختالف من راوتر لآخر.",
    icon: "router",
  },
  {
    title: "Wi-Fi ديال الدار فقط",
    text: "الحماية على Wi-Fi ديال الدار ما كتغطيش أوتوماتيكياً الإنترنت ديال الهاتف (4G/5G) ولا شبكات أخرى.",
    icon: "smartphone",
  },
  {
    title: "VPN وطرق التحايل",
    text: "تطبيقات VPN وشي طرق أخرى يقدرو يتجاوزو الفلترة.",
    icon: "globe",
  },
  {
    title: "دور الوالدين مهم",
    text: "هاد الخدمة كتكمّل المراقبة والحوار مع الولاد، وما كتعوّضهمش.",
    icon: "family",
  },
];
