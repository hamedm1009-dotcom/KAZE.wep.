# KAZE — متجر ملابس (المرحلتان 2 و3)

واجهة متجر متجاوبة باللون الأبيض والأسود والأخضر الفاتح، تدعم العربية والإنجليزية، مع بيانات منتجات توضيحية. أضيف في المرحلة الثالثة إطار المصادقة وقاعدة البيانات وواجهات API الآمنة.

## المهم

- المنتجات والأسعار والمخزون الظاهر في واجهة المتجر ما زالت تجريبية.
- مصادقة Firebase تحتاج إدخال إعدادات مشروعك في `public/assets/js/firebase-config.js` وتفعيل Email/Password وGoogle من Firebase Console.
- ملفات API تعمل على **Cloudflare Pages Functions**، وقاعدة البيانات هي Cloudflare D1. GitHub Pages لا يشغل الـ API ولا يستضيف متجرًا تجاريًا وفق شروطه؛ احتفظ بالكود في GitHub وانشره عبر Cloudflare Pages.
- لا تُخزن كلمات المرور في D1. يجب إعداد `ADMIN_UID` كـ Secret داخل Cloudflare، وليس في ملفات JavaScript العامة.
- لا يوجد حتى الآن نظام منتجات أو مخزون فعلي أو طلبات أو دفع. لا تستخدم النسخة الحالية لاستقبال مبيعات حقيقية.

## أهم الملفات

- `public/index.html`: واجهة المتجر ونافذة الحساب.
- `public/assets/css/`: التصميم العام والمكونات.
- `public/assets/js/app.js`: تفاعلات واجهة المنتجات التجريبية.
- `public/assets/js/auth.js`: واجهة المصادقة.
- `public/assets/js/firebase-config.js`: إعداد Firebase العام.
- `public/locales/ar.json` و`public/locales/en.json`: ترجمة واجهة المستخدم.
- `functions/`: API الخادم، التحقق من الرمز وصلاحية المدير.
- `migrations/0001_schema.sql`: الجداول والأقسام الأولية.
- `wrangler.toml`: إعداد Cloudflare Pages وD1.

## إعداد المرحلة الثالثة

اتبع الملف `PHASE-3-SETUP.md` بالترتيب. لا تتجاوز إنشاء D1 وربطها بالمتغير `DB` وضبط `FIREBASE_PROJECT_ID` وSecret باسم `ADMIN_UID`؛ وإلا ستظهر أخطاء إعداد مقصودة مثل 503.

## نشر الواجهة

في مشروع Cloudflare Pages المرتبط بـ GitHub، اضبط أمر البناء على `npm install` ومجلد الإخراج على `public`، ثم أضف D1 binding باسم `DB` وأكمل متغيرات البيئة قبل نشر ملفات Functions. راجع دليل المرحلة الثالثة لأن معرّف قاعدة البيانات وقيم Firebase تخص حسابك.

## اختبارات أولية

راجع `tests/phase3-checklist.md` و`PHASE-3-SETUP.md`. لقد تم فحص صياغة JavaScript وJSON محليًا، لكن المصادقة الحقيقية وAPI المنشور لا يمكن تأكيدهما حتى ربط حسابات Firebase وCloudflare الفعلية وتشغيل اختبارات المتصفح.


تم إدخال إعدادات Firebase Web App الخاصة بمشروع `kaze-store` في `public/assets/js/firebase-config.js`، وضبط `FIREBASE_PROJECT_ID` في `wrangler.toml`. قبل النشر، راجع تطابق القيم مع Firebase Console وأكمل إعداد المصادقة وD1 الموضح في `PHASE-3-SETUP.md`.
