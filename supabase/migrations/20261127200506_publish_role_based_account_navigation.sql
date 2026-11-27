create table anybike_publishing.navigation_items (
 key text primary key,path text check (path is null or (path ~ '^/[a-z0-9-]+[.]html([#][a-z0-9-]+)?$')),labels jsonb not null,
 audiences text[] not null,section text not null,level2 boolean not null default false,position smallint unique not null
);
alter table anybike_publishing.navigation_items enable row level security;
revoke all on anybike_publishing.navigation_items from public, anon, authenticated;
insert into anybike_publishing.navigation_items
select key,path,labels,audiences,section,level2,position
from jsonb_to_recordset($items$[
 {
  "key": "pub-global",
  "path": "/anybike-global.html",
  "labels": {
   "en": "AnyBike Global",
   "de": "AnyBike Global",
   "fr": "AnyBike Global",
   "es": "AnyBike Global",
   "ar": "AnyBike Global",
   "id": "AnyBike Global",
   "ms": "AnyBike Global",
   "zh": "AnyBike Global"
  },
  "audiences": [
   "guest",
   "uk_dealer",
   "intl_dealer",
   "uk_private",
   "intl_private",
   "other"
  ],
  "section": "public",
  "level2": false,
  "position": 1
 },
 {
  "key": "pub-types",
  "path": "/motorcycle-types.html",
  "labels": {
   "en": "Motorcycle types",
   "de": "Motorradtypen",
   "fr": "Types de motos",
   "es": "Tipos de motocicletas",
   "ar": "أنواع الدراجات النارية",
   "id": "Jenis sepeda motor",
   "ms": "Jenis motosikal",
   "zh": "摩托车类型"
  },
  "audiences": [
   "guest",
   "uk_dealer",
   "intl_dealer",
   "uk_private",
   "intl_private",
   "other"
  ],
  "section": "public",
  "level2": false,
  "position": 2
 },
 {
  "key": "sign-in",
  "path": "/customer-login.html",
  "labels": {
   "en": "Sign In",
   "de": "Anmelden",
   "fr": "Se connecter",
   "es": "Iniciar sesión",
   "ar": "تسجيل الدخول",
   "id": "Masuk",
   "ms": "Log Masuk",
   "zh": "登录"
  },
  "audiences": [
   "guest"
  ],
  "section": "account",
  "level2": false,
  "position": 3
 },
 {
  "key": "register",
  "path": "/customer-register.html",
  "labels": {
   "en": "Create Free Account",
   "de": "Kostenloses Konto",
   "fr": "Créer un compte gratuit",
   "es": "Crear cuenta gratuita",
   "ar": "إنشاء حساب مجاني",
   "id": "Buat Akun Gratis",
   "ms": "Buat Akaun Percuma",
   "zh": "免费创建账户"
  },
  "audiences": [
   "guest"
  ],
  "section": "account",
  "level2": false,
  "position": 4
 },
 {
  "key": "dealer-group",
  "path": null,
  "labels": {
   "en": "Your dealership",
   "de": "Ihr Händlerbetrieb",
   "fr": "Votre concession",
   "es": "Su concesionario",
   "ar": "وكالتك",
   "id": "Dealer Anda",
   "ms": "Pengedar anda",
   "zh": "您的经销业务"
  },
  "audiences": [
   "uk_dealer"
  ],
  "section": "dealer_heading",
  "level2": false,
  "position": 5
 },
 {
  "key": "uk-workspace",
  "path": "/my-dealership.html",
  "labels": {
   "en": "My Dealership",
   "de": "Mein Händlerbereich",
   "fr": "Ma concession",
   "es": "Mi concesionario",
   "ar": "وكالتي",
   "id": "Dealer Saya",
   "ms": "My Dealership",
   "zh": "我的经销商"
  },
  "audiences": [
   "uk_dealer"
  ],
  "section": "dealer",
  "level2": false,
  "position": 6
 },
 {
  "key": "welcome",
  "path": "/dealer-welcome.html",
  "labels": {
   "en": "Dealer welcome",
   "de": "Händler-Einstieg",
   "fr": "Accueil concessionnaire",
   "es": "Bienvenida para concesionarios",
   "ar": "دليل الوكيل",
   "id": "Panduan dealer",
   "ms": "Panduan pengedar",
   "zh": "经销商指南"
  },
  "audiences": [
   "uk_dealer"
  ],
  "section": "dealer",
  "level2": false,
  "position": 7
 },
 {
  "key": "trade-access",
  "path": "/my-dealership-access.html",
  "labels": {
   "en": "Level 2 dealer services",
   "de": "Händlerservices Stufe 2",
   "fr": "Services concessionnaire niveau 2",
   "es": "Servicios de concesionario de nivel 2",
   "ar": "خدمات الوكيل للمستوى الثاني",
   "id": "Layanan dealer tingkat 2",
   "ms": "Perkhidmatan pengedar tahap 2",
   "zh": "二级经销商服务"
  },
  "audiences": [
   "uk_dealer",
   "intl_dealer"
  ],
  "section": "dealer",
  "level2": true,
  "position": 8
 },
 {
  "key": "selling",
  "path": "/my-selling.html",
  "labels": {
   "en": "My Selling",
   "de": "Meine Verkäufe",
   "fr": "Mes ventes",
   "es": "Mis ventas",
   "ar": "مبيعاتي",
   "id": "Penjualan saya",
   "ms": "Jualan saya",
   "zh": "我的销售"
  },
  "audiences": [
   "uk_dealer",
   "uk_private"
  ],
  "section": "dealer",
  "level2": false,
  "position": 9
 },
 {
  "key": "uk-purchases",
  "path": "/my-purchases.html",
  "labels": {
   "en": "My Purchases",
   "de": "Meine Käufe",
   "fr": "Mes achats",
   "es": "Mis compras",
   "ar": "مشترياتي",
   "id": "Pembelian Saya",
   "ms": "Pembelian Saya",
   "zh": "我的购买"
  },
  "audiences": [
   "uk_dealer"
  ],
  "section": "dealer",
  "level2": false,
  "position": 10
 },
 {
  "key": "account-group",
  "path": null,
  "labels": {
   "en": "Account & support",
   "de": "Konto und Hilfe",
   "fr": "Compte et assistance",
   "es": "Cuenta y ayuda",
   "ar": "الحساب والدعم",
   "id": "Akun dan bantuan",
   "ms": "Akaun dan bantuan",
   "zh": "账户与支持"
  },
  "audiences": [
   "uk_dealer"
  ],
  "section": "account_heading",
  "level2": false,
  "position": 11
 },
 {
  "key": "private-dashboard",
  "path": "/private-dashboard.html",
  "labels": {
   "en": "Dashboard",
   "de": "Übersicht",
   "fr": "Tableau de bord",
   "es": "Panel",
   "ar": "لوحة التحكم",
   "id": "Dasbor",
   "ms": "Papan Pemuka",
   "zh": "控制面板"
  },
  "audiences": [
   "uk_private"
  ],
  "section": "account",
  "level2": false,
  "position": 12
 },
 {
  "key": "workspace",
  "path": "/customer-dashboard.html",
  "labels": {
   "en": "Dashboard",
   "de": "Übersicht",
   "fr": "Tableau de bord",
   "es": "Panel",
   "ar": "لوحة التحكم",
   "id": "Dasbor",
   "ms": "Papan Pemuka",
   "zh": "控制面板"
  },
  "audiences": [
   "intl_dealer",
   "intl_private",
   "other"
  ],
  "section": "account",
  "level2": false,
  "position": 13
 },
 {
  "key": "submit",
  "path": "/uk-motorcycle-selling.html",
  "labels": {
   "en": "Sell my motorcycle",
   "de": "Mein Motorrad verkaufen",
   "fr": "Vendre ma moto",
   "es": "Vender mi motocicleta",
   "ar": "بيع دراجتي النارية",
   "id": "Jual sepeda motor saya",
   "ms": "Jual motosikal saya",
   "zh": "出售我的摩托车"
  },
  "audiences": [
   "uk_private"
  ],
  "section": "account",
  "level2": false,
  "position": 14
 },
 {
  "key": "requests",
  "path": "/buy-motorcycles.html",
  "labels": {
   "en": "Motorcycle Requests",
   "de": "Motorradanfragen",
   "fr": "Demandes de motos",
   "es": "Solicitudes de motos",
   "ar": "طلبات الدراجات",
   "id": "Permintaan Sepeda Motor",
   "ms": "Permintaan Motosikal",
   "zh": "摩托车需求"
  },
  "audiences": [
   "intl_dealer"
  ],
  "section": "account",
  "level2": false,
  "position": 15
 },
 {
  "key": "offers",
  "path": "/customer-dashboard.html#my-offers",
  "labels": {
   "en": "My Offers",
   "de": "Meine Angebote",
   "fr": "Mes offres",
   "es": "Mis ofertas",
   "ar": "عروضي",
   "id": "Penawaran Saya",
   "ms": "Tawaran Saya",
   "zh": "我的报价"
  },
  "audiences": [
   "intl_dealer"
  ],
  "section": "account",
  "level2": false,
  "position": 16
 },
 {
  "key": "hand-picked",
  "path": "/customer-dashboard.html#hand-picked",
  "labels": {
   "en": "Hand-picked for You",
   "de": "Für Sie ausgewählt",
   "fr": "Sélectionnées pour vous",
   "es": "Sélectionnées pour vous",
   "ar": "مختارة لك",
   "id": "Pilihan untuk Anda",
   "ms": "Dipilih untuk Anda",
   "zh": "为您精选"
  },
  "audiences": [
   "intl_dealer"
  ],
  "section": "account",
  "level2": false,
  "position": 17
 },
 {
  "key": "matches",
  "path": "/customer-dashboard.html#buyer-potential-matches",
  "labels": {
   "en": "Potential Matches",
   "de": "Potenzielle Treffer",
   "fr": "Correspondances potentielles",
   "es": "Correspondances potentielles",
   "ar": "التطابقات المحتملة",
   "id": "Potensi Kecocokan",
   "ms": "Padanan Berpotensi",
   "zh": "潜在匹配"
  },
  "audiences": [
   "intl_dealer"
  ],
  "section": "account",
  "level2": false,
  "position": 18
 },
 {
  "key": "searches",
  "path": "/my-searches.html",
  "labels": {
   "en": "Saved Searches",
   "de": "Gespeicherte Suchen",
   "fr": "Recherches enregistrées",
   "es": "Búsquedas guardadas",
   "ar": "عمليات البحث المحفوظة",
   "id": "Pencarian Tersimpan",
   "ms": "Carian Disimpan",
   "zh": "已保存搜索"
  },
  "audiences": [
   "intl_private",
   "intl_dealer",
   "other"
  ],
  "section": "account",
  "level2": false,
  "position": 19
 },
 {
  "key": "watchlist",
  "path": "/my-watchlist.html",
  "labels": {
   "en": "Watchlist",
   "de": "Merkliste",
   "fr": "Favoris",
   "es": "Favoritos",
   "ar": "قائمة المتابعة",
   "id": "Daftar Pantau",
   "ms": "Senarai Pantau",
   "zh": "关注列表"
  },
  "audiences": [
   "intl_private",
   "intl_dealer",
   "other"
  ],
  "section": "account",
  "level2": false,
  "position": 20
 },
 {
  "key": "history",
  "path": "/customer-dashboard.html#recently-viewed",
  "labels": {
   "en": "Recently Viewed",
   "de": "Zuletzt angesehen",
   "fr": "Vues récemment",
   "es": "Vistos recientemente",
   "ar": "شوهدت مؤخراً",
   "id": "Baru Dilihat",
   "ms": "Baru Dilihat",
   "zh": "最近浏览"
  },
  "audiences": [
   "intl_dealer",
   "intl_private",
   "other"
  ],
  "section": "account",
  "level2": false,
  "position": 21
 },
 {
  "key": "purchases",
  "path": "/my-purchases.html",
  "labels": {
   "en": "My Purchases",
   "de": "Meine Käufe",
   "fr": "Mes achats",
   "es": "Mis compras",
   "ar": "مشترياتي",
   "id": "Pembelian Saya",
   "ms": "Pembelian Saya",
   "zh": "我的购买"
  },
  "audiences": [
   "intl_dealer",
   "intl_private",
   "uk_private",
   "other"
  ],
  "section": "account",
  "level2": false,
  "position": 22
 },
 {
  "key": "documents",
  "path": "/accounts-documents.html",
  "labels": {
   "en": "Accounts & Documents",
   "de": "Konten & Dokumente",
   "fr": "Comptes & documents",
   "es": "Cuentas y documentos",
   "ar": "الحسابات والمستندات",
   "id": "Akun & Dokumen",
   "ms": "Accounts & Documents",
   "zh": "账户与文件"
  },
  "audiences": [
   "uk_dealer",
   "intl_dealer",
   "intl_private",
   "other"
  ],
  "section": "account",
  "level2": false,
  "position": 23
 },
 {
  "key": "shipping",
  "path": "/customer-shipping-conversations.html",
  "labels": {
   "en": "Shipping conversations",
   "de": "Versandnachrichten",
   "fr": "Messages de transport",
   "es": "Mensajes de transporte",
   "ar": "محادثات الشحن",
   "id": "Pesan pengiriman",
   "ms": "Mesej penghantaran",
   "zh": "运输消息"
  },
  "audiences": [
   "intl_dealer",
   "intl_private",
   "other"
  ],
  "section": "account",
  "level2": false,
  "position": 24
 },
 {
  "key": "vat",
  "path": "/my-vat-export-guide.html",
  "labels": {
   "en": "VAT Export Guide",
   "de": "Leitfaden zur Export-Umsatzsteuer",
   "fr": "Guide TVA à l’exportation",
   "es": "Guía de IVA para exportaciones",
   "ar": "دليل ضريبة القيمة المضافة للتصدير",
   "id": "Panduan PPN ekspor",
   "ms": "Panduan VAT eksport",
   "zh": "出口增值税指南"
  },
  "audiences": [
   "intl_dealer"
  ],
  "section": "account",
  "level2": false,
  "position": 25
 },
 {
  "key": "messages",
  "path": "/customer-messages.html",
  "labels": {
   "en": "Messages",
   "de": "Nachrichten",
   "fr": "Messages",
   "es": "Mensajes",
   "ar": "الرسائل",
   "id": "Pesan",
   "ms": "Mesej",
   "zh": "消息"
  },
  "audiences": [
   "uk_dealer",
   "intl_dealer",
   "uk_private",
   "intl_private",
   "other"
  ],
  "section": "account",
  "level2": false,
  "position": 26
 },
 {
  "key": "profile",
  "path": "/customer-profile.html",
  "labels": {
   "en": "My Profile",
   "de": "Mein Profil",
   "fr": "Mon profil",
   "es": "Mi perfil",
   "ar": "ملفي الشخصي",
   "id": "Profil Saya",
   "ms": "Profil Saya",
   "zh": "我的资料"
  },
  "audiences": [
   "uk_dealer",
   "intl_dealer",
   "uk_private",
   "intl_private",
   "other"
  ],
  "section": "account",
  "level2": false,
  "position": 27
 }
]$items$::jsonb) as i(key text,path text,labels jsonb,audiences text[],section text,level2 boolean,position smallint);
create function public.public_anybike_navigation_v1() returns jsonb
language sql stable security definer set search_path='' as $$
with identity as (
 select auth.uid() as uid, lower(trim((select customer_type from public.customer_profiles where id=auth.uid()))) as kind
), audience as (select case
 when uid is null then 'guest'
 when kind in ('uk_dealer','uk_distributor') then 'uk_dealer'
 when kind in ('international_dealer','international_distributor','international_motorcycle_dealer','european_dealer','european_distributor','intl_dealer','intl_distributor','eu_dealer','eu_distributor') then 'intl_dealer'
 when kind in ('uk_private','uk_private_customer') then 'uk_private'
 when kind in ('intl_private','international_private','international_private_customer','eu_private','european_private') then 'intl_private'
 when exists(select 1 from public.dealer_get_my_dealership()) then 'uk_dealer'
 else 'other' end as role from identity),
access as (
 select role, case when role in ('uk_dealer','intl_dealer') then (public.customer_my_dealer_access_v1()->>'level')='2' else false end as level2 from audience
)
select jsonb_build_object('audience',a.role,'items',coalesce((select jsonb_agg(jsonb_build_object('key',n.key,'path',n.path,'labels',n.labels,'section',n.section) order by n.position) from anybike_publishing.navigation_items n where a.role=any(n.audiences) and (not n.level2 or a.level2)),'[]'::jsonb)) from access a;
$$;
revoke all on function public.public_anybike_navigation_v1() from public;
grant execute on function public.public_anybike_navigation_v1() to anon,authenticated;
