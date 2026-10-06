# ELSHEKH RIDES — Constitution

## I. Workflow First

كل Feature لازم تبدأ من user jobs و dashboard flows و CRUD objects و workflow states و measurable outcomes. الـ Stack choices مش بتبدل الـ product decisions.

## II. Spec Approval Before Code

ممنوع كتابة أي implementation code لحد ما الـ user يوافق على الـ spec. الـ Review والـ audit requests بتكون read-only إلا لو الـ user طلب تعديل صريح.

## III. Provider-Neutral Data Modeling

PostgreSQL هو الـ Source of Truth. الـ Auth والـ Maps والـ Notifications كلها providers قابلة للاستبدال عبر abstraction layers. ممنوع ربط الـ business logic بمزود واحد.

## IV. Multi-Tenant Isolation

كل جدول في الـ database لازم يكون فيه `tenant_id`. الـ RLS لازم يكون مفعّل على كل الجداول. ممنوع أي tenant يوصل لبيانات tenant آخر — على مستوى الـ UI والـ API والـ Database.

## V. RBAC + Permission Scopes

كل role ليه permissions محددة. الـ permission مش بس "هل يستطيع؟" لكن "على أي بيانات يستطيع؟". ممنوع أي user يتجاوز الـ scope بتاعه.

## VI. Audit Trail

كل transition في الـ Trip State Machine وكل عملية حساسة (تعديل رحلة، إسناد سائق، حل incident، تعديل مالي) لازم تترك أثر في الـ audit_logs: actor_id, action, entity_type, entity_id, old_value, new_value, timestamp.

## VII. No Hard Delete

ممنوع حذف البيانات التشغيلية والمالية حذفًا نهائيًا. الـ Status changes (cancelled, inactive, retired) بدل الـ delete.

## VIII. Security Boundaries

- Auth: Supabase Auth + JWT
- Authorization: RBAC + Permission Scopes
- RLS: على كل الجداول
- Backend validation authoritative (Zod)
- Client validation = UX only
- ممنوع Service Role Key في الـ browser
- ممنوع secrets في الـ source code

## IX. Verification Is Part of Delivery

كل Feature لازم يكون ليها tests مناسبة:
- Unit tests للـ business rules
- Integration tests للـ workflows
- API tests للـ auth + authorization + tenant isolation
- RLS tests لكل role × لكل object
- E2E test للـ core workflow

## X. Spec Drift Must Be Reconciled

لو الـ implementation اكتشف تغيير في الـ behavior، لازم يتحدث في الـ spec.md والـ plan.md والـ tasks.md قبل الـ continuation. ممنوع الكود يكون الـ source of truth الوحيد.

## XI. MVP Scope

الـ MVP محدود بالـ core workflow:
```
Company → Employee → Subscription → Route → Driver + Vehicle → Trip → Operation → Completion → Basic Billing/Reporting
```

ممنوع إضافة features خارج الـ scope بدون موافقة صريحة.

## XII. Provider Abstraction

كل external provider (Auth, Maps, Notifications) لازم يكون وراء abstraction interface. ممنوع ربط الـ business logic بمزود واحد.

## XIII. Free-Tier Conscious

الـ architecture لازم تكون مصممة لتقليل الاستهلاك:
- Pagination
- Caching
- تقليل الـ API calls
- تقليل الـ database queries
- ممنوع polling مستمر بدون داعي

## Amendment Rules

الـ Constitution يتغير فقط بموافقة صريحة من الـ user. أي تغيير لازم يتسجل مع السبب والـ version.
