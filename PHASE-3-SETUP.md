# KAZE — المرحلة الثالثة: المصادقة وقاعدة البيانات والأمان

هذه المرحلة تضيف نظام حسابات Firebase Authentication وواجهة API على Cloudflare Pages Functions، وقاعدة Cloudflare D1 لملفات العملاء والأقسام. لا توجد أي كلمة مرور مخزنة في D1، ولا تعتمد هذه النسخة على Firestore.

## ما الموجود في الملفات؟

- `public/assets/js/firebase-config.js`: إعدادات تطبيق Firebase العامة التي يجب نسخها من مشروعك.
- `public/assets/js/auth.js`: إنشاء حساب بالبريد وكلمة المرور، تسجيل الدخول والخروج، استعادة كلمة المرور، وتسجيل الدخول عبر Google.
- `functions/_lib/auth.js`: يتحقق من Firebase ID token على الخادم ويقارن UID بصلاحية المدير المضبوطة على Cloudflare.
- `functions/api/me.js`: العميل يقرأ أو يحدث ملفه الشخصي فقط. لا يقبل UID من المتصفح.
- `functions/api/categories.js`: يعرض الأقسام الأساسية المزروعة في قاعدة البيانات.
- `functions/api/admin/check.js`: اختبار صلاحية المدير.
- `functions/api/admin/profiles.js`: مثال على بيانات لا يسمح بقراءتها إلا للمدير.
- `functions/api/health.js`: فحص اتصال D1.
- `migrations/0001_schema.sql`: ينشئ الجداول ويضيف الأقسام الأولية.
- `wrangler.toml`: إعداد Cloudflare Pages وD1؛ يجب تعديل المعرفات قبل النشر.

## أ. إعداد Firebase Authentication

1. افتح [Firebase Console](https://console.firebase.google.com/) واختر مشروع KAZE الذي ستستخدمه.
2. افتح Project settings ثم Your apps، وأنشئ Web App إذا لم يكن لديك واحد.
3. تم إدخال إعدادات تطبيق الويب المرسلة بالفعل في `public/assets/js/firebase-config.js`، كما تم ضبط `FIREBASE_PROJECT_ID` في `wrangler.toml` على `kaze-store`. راجعها من Firebase Console > Project settings للتأكد أنها تطابق تطبيق Web الصحيح. هذه القيم مخصصة للواجهة وليست مفتاح خدمة Admin. لا تنسخ أي Service Account JSON إلى الموقع.
4. من Authentication > Sign-in method فعّل Email/Password وGoogle. اختر بريد دعم للمشروع عند مطالبة Firebase بذلك.
5. من Authentication > Settings > Authorized domains أضف دومين Cloudflare Pages النهائي. أضف `localhost` فقط للتطوير المحلي إذا كنت تستخدمه.
6. بعد اكتمال النشر، أنشئ حساب المدير الأول بالطريقة العادية من نافذة حساب KAZE. من Firebase Authentication > Users انسخ **UID** للحساب الذي ستجعله مديرًا.

الواجهة تعتمد على Firebase Web SDK عبر CDN. يلزم اتصال إنترنت ودومين مسموح في Firebase؛ فتح `public/index.html` مباشرة باستخدام `file://` ليس اختبارًا صالحًا للمصادقة.

## ب. إعداد Cloudflare Pages وD1

1. ارفع محتويات هذه الحزمة إلى مستودع GitHub الذي سيُربط بـ Cloudflare Pages.
2. من Cloudflare Dashboard افتح Workers & Pages وأنشئ أو افتح مشروع Pages مربوطًا بالمستودع. استخدم `./public` كمجلد الإخراج حتى لا تُنشر ملفات الاختبارات والترحيلات والتوثيق كملفات عامة.
3. اضبط Build command على `npm install` ومجلد الإخراج على `public`. يوجد اعتماد `jose` في `package.json` للتحقق من رموز Firebase على الخادم.
4. أنشئ قاعدة D1 باسم `kaze-db` من Cloudflare Dashboard.
5. افتح SQL Console الخاص بقاعدة D1، ثم نفّذ كامل محتوى `migrations/0001_schema.sql` مرة واحدة. من الطبيعي أن تظهر الجداول `categories` و`customer_profiles` و`audit_log`.
6. من إعدادات مشروع Pages أضف Binding من نوع D1، واجعل Variable name بالضبط `DB` واختر قاعدة `kaze-db`.
7. تم ضبط `FIREBASE_PROJECT_ID` مسبقًا إلى `kaze-store`. استبدل فقط `REPLACE_WITH_D1_DATABASE_ID` في `wrangler.toml` بالمعرّف الحقيقي الذي تجده في إعدادات قاعدة D1. لن يعمل API حتى تنشئ قاعدة D1 وتضع المعرّف الصحيح وتضيف Binding باسم `DB`.
8. إذا لم يلتقط Cloudflare إعداد D1 الموجود في Wrangler، افتح Settings > Bindings وأضف D1 باسم متغير `DB` واختر قاعدة `kaze-db`. قيمة `FIREBASE_PROJECT_ID` في `wrangler.toml` يجب أن تتطابق تمامًا مع Firebase Project ID.
9. في Settings > Variables and Secrets عيّن `ADMIN_UID` كـ **Secret** بقيمة UID لحساب المدير، ثم أعد النشر.
يجب أن يتم النشر عبر Cloudflare Pages؛ GitHub Pages وحده لا ينفذ ملفات `functions/` ولا API الخلفي.

> لا تضع `ADMIN_UID` أو كلمات المرور أو Service Account JSON في GitHub. إعدادات Firebase العامة الموجودة في ملف الواجهة ليست بديلًا عن التحقق من التوكن وصلاحيات الـ API.

## ج. اختبارات المرحلة الثالثة

بعد النشر، استبدل `YOUR-PAGES-DOMAIN` بالدومين الحقيقي:

1. افتح `https://YOUR-PAGES-DOMAIN/api/health` — المتوقع `200` و`database: "connected"`.
2. افتح `https://YOUR-PAGES-DOMAIN/api/categories` — المتوقع `200` وستة أقسام أولية.
3. افتح `https://YOUR-PAGES-DOMAIN/api/me` بدون تسجيل دخول — المتوقع `401 authentication_required`.
4. افتح `https://YOUR-PAGES-DOMAIN/api/admin/check` بدون تسجيل دخول — المتوقع `401 authentication_required`.
5. من نافذة حساب KAZE أنشئ حسابًا تجريبيًا. يجب أن يبقى الحساب على Firebase، وأن يظهر ملفه في D1 بعد تسجيل الدخول إذا كانت إعدادات الـ API صحيحة.
6. بعد تسجيل الدخول اضغط «اختبار صلاحيات الحساب». المتوقع أن يكون `GET /api/me` = `200`، وأن يكون `GET /api/admin/check` = `403` للعميل العادي، أو `200` فقط لحساب المدير المضبوط. ظهور `503` يعني أن إعدادًا خلفيًا ناقص.
7. اختبر استعادة كلمة المرور وGoogle بعد تفعيلهما داخل Firebase وإضافة الدومين المصرح.

## ما لم يُختبر بعد / حدود المرحلة

- لم تُختبر عمليات المصادقة الحقيقية قبل إدخال إعدادات Firebase الخاصة بمالك المشروع.
- لم تُختبر قاعدة D1 المنشورة في حساب Cloudflare الخاص بك؛ أنت فقط من يستطيع إنشاء الـ bindings وSecrets في حسابك.
- لم يتم بناء كتالوج منتجات حقيقي أو المخزون أو الطلبات في هذه المرحلة؛ المنتجات الموجودة بالواجهة ما زالت توضيحية حتى المرحلة الرابعة.
- لم يتم إعداد نسخ احتياطي تلقائي أو سياسة احتفاظ/حذف للحسابات. يجب إعدادها ومراجعتها قبل الإطلاق التجاري.
- لا تعتبر المشروع جاهزًا للإنتاج حتى تجتاز قائمة الاختبارات أعلاه.

## مراجع التوثيق الرسمي

- Firebase Authentication للويب: https://firebase.google.com/docs/auth/web/start
- التحقق من Firebase ID Tokens: https://firebase.google.com/docs/auth/admin/verify-id-tokens
- Cloudflare Pages Functions bindings: https://developers.cloudflare.com/pages/functions/bindings/
- Cloudflare D1 migrations: https://developers.cloudflare.com/d1/reference/migrations/
