# AI Hospital Guardian — Live Demo

نسخة عرض ثابتة (Static Demo) من نظام المستشفى + طبقة الـ AI، **بدون باك إند وبدون صفحة تسجيل دخول**.
كل الصفحات شغالة: نظرة عامة، المرضى وتفاصيل كل مريض (مع تقييم الخطورة والـ Timeline)، الأجهزة الطبية
(مع Behavior Profile)، الأحداث والسجلات، ومركز الذكاء الاصطناعي (التنبيهات والـ Correlation).

## البيانات
البيانات مش مكتوبة يدويًا: `src/demoData.json` اتصدّرت من الباك إند الحقيقي (FastAPI) بعد ما الـ AI engine
اشتغل فعليًا على بيانات الـ seed (40 مريض، 20 جهاز، سيناريوهات شاذة متعمدة). السكريبت: `scripts/export_data.py`.

في الديمو:
- تغيير حالة التنبيه (تمت المراجعة / تم الحل) بيشتغل في الذاكرة فقط، وبيرجع لأصله مع أي Refresh.
- زرار "تشغيل التحليل الآن" محاكاة (الـ engine مكتوب بـ Python فمينفعش يشتغل في المتصفح).

## الاستضافة على GitHub Pages
**الطريقة 1 (الأسهل، من غير Actions):** ارفع المحتوى كله على ريبو، وبعدين
`Settings → Pages → Deploy from a branch → Branch: main / Folder: /docs`.
فولدر `docs/` فيه النسخة الجاهزة (Built).

**الطريقة 2 (GitHub Actions):** `Settings → Pages → Source: GitHub Actions`. أي push على `main` بيبني ويرفع تلقائيًا
(`.github/workflows/deploy.yml`).

الموقع بيشتغل على أي رابط (project أو user site) لأنه بيستخدم `HashRouter` ومسارات نسبية.

## تشغيل محلي / إعادة البناء
```bash
npm install
npm run dev      # للتطوير
npm run build    # بيبني في docs/
```
