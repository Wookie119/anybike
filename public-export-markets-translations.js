/*
AnyBike
File: public-export-markets-translations.js
Purpose: Page translations for export-services.html and international-markets.html
Date: 20 September 2026
*/
(function(){
  if(!window.AnyBikePageLanguage){ return; }

  const path=String(location.pathname||"").toLowerCase();

  function reg(translations,afterApply){
    window.AnyBikePageLanguage.register({
      root:"main",
      translations,
      afterApply
    });
  }

  if(path==="/export-services.html"){
    reg({
      en:{pageTitle:"Motorcycle Export Services from the UK | AnyBike Worldwide Shipping",text:{}},
      fr:{pageTitle:"Services d’exportation de motos depuis le Royaume-Uni | AnyBike",text:{
        "UK motorcycle export specialists":"Spécialistes britanniques de l’export moto",
        "We source.":"Nous trouvons.",
        "We inspect.":"Nous inspectons.",
        "We deliver worldwide.":"Nous livrons dans le monde entier.",
        "AnyBike manages the UK side of motorcycle export from finding and checking the right bike through viewing, inspection, purchase support, collection, export preparation and delivery to your chosen shipper, port or worldwide destination.":"AnyBike gère toute la partie britannique de l’exportation d’une moto : recherche et vérification de la bonne moto, visite, inspection, assistance à l’achat, enlèvement, préparation à l’export et livraison à votre transporteur, port ou destination internationale.",
        "Browse Available Stock":"Voir les motos disponibles",
        "Talk to the Export Team":"Contacter l’équipe export",
        "UK Sourcing":"Recherche au Royaume-Uni",
        "Inspection":"Inspection",
        "UK Collection":"Enlèvement au Royaume-Uni",
        "Secure Transport":"Transport sécurisé",
        "Export Crating":"Mise en caisse export",
        "Port Delivery":"Livraison au port",
        "Worldwide Shipping":"Expédition internationale",
        "Door to Door":"Porte à porte",
        "Motorcycle preparation and shipping":"Préparation et expédition des motos",
        "Real motorcycles prepared for international transport.":"Des motos réellement préparées pour le transport international.",
        "AnyBike coordinates the practical UK work required to move motorcycles safely from sellers, dealers and trade suppliers into the international freight network.":"AnyBike coordonne les opérations pratiques au Royaume-Uni nécessaires pour acheminer les motos en toute sécurité depuis les vendeurs, concessionnaires et fournisseurs professionnels vers le réseau de transport international.",
        "Professional motorcycle export crating":"Mise en caisse professionnelle pour l’export",
        "When crating is required, the motorcycle is delivered to an experienced specialist packing company for professional export preparation.":"Lorsqu’une mise en caisse est nécessaire, la moto est livrée à une société d’emballage spécialisée et expérimentée pour une préparation professionnelle à l’export.",
        "Worldwide shipping coordination":"Coordination de l’expédition internationale",
        "We can work with your existing shipper or help coordinate delivery into a suitable international freight route.":"Nous pouvons travailler avec votre transporteur habituel ou vous aider à organiser l’acheminement vers une solution de fret international adaptée.",
        "Important:":"Important :",
        "AnyBike does not manufacture export crates in-house. Professional motorcycle crating is carried out by trusted third-party specialist packing companies. AnyBike coordinates collection, delivery, communication and the required handover with the chosen crating or freight provider.":"AnyBike ne fabrique pas les caisses d’export en interne. La mise en caisse professionnelle est réalisée par des sociétés tierces spécialisées et de confiance. AnyBike coordonne l’enlèvement, la livraison, les échanges et la remise au prestataire de mise en caisse ou de fret choisi.",
        "What AnyBike does":"Ce que fait AnyBike",
        "Your complete UK motorcycle export partner.":"Votre partenaire complet pour l’export de motos depuis le Royaume-Uni.",
        "Trade buyers, motorcycle dealers, importers and bulk buyers can use one AnyBike service or ask our team to coordinate the complete UK export process. Motorcycle purchases from AnyBike are supplied on an agreed trade/export basis.":"Les acheteurs professionnels, concessionnaires, importateurs et acheteurs en volume peuvent utiliser un seul service AnyBike ou demander à notre équipe de coordonner l’ensemble du processus d’exportation au Royaume-Uni. Les motos achetées auprès d’AnyBike sont fournies selon des conditions professionnelles/export convenues.",
        "Motorcycle sourcing":"Recherche de motos",
        "We search UK motorcycles by make, model, year, mileage, condition and budget.":"Nous recherchons des motos au Royaume-Uni selon la marque, le modèle, l’année, le kilométrage, l’état et le budget.",
        "Viewing and seller checks":"Visite et vérifications du vendeur",
        "We can contact sellers, confirm details and help identify unsuitable or misleading listings.":"Nous pouvons contacter les vendeurs, confirmer les informations et aider à repérer les annonces inadaptées ou trompeuses.",
        "Visual condition support":"Contrôle visuel de l’état",
        "Visible condition, identification, mileage, documents, damage, photos and video can be recorded. This is not a mechanical or engineering inspection.":"L’état visible, l’identification, le kilométrage, les documents, les dommages, les photos et les vidéos peuvent être consignés. Il ne s’agit pas d’une expertise mécanique ou technique.",
        "Purchase coordination":"Coordination de l’achat",
        "AnyBike can help coordinate communication, agreed terms, collection arrangements and the UK handover.":"AnyBike peut coordonner les échanges, les conditions convenues, l’enlèvement et la remise au Royaume-Uni.",
        "Collection anywhere in the UK":"Enlèvement partout au Royaume-Uni",
        "Collection can be arranged from private sellers, dealers, auctions, trade suppliers and storage facilities.":"L’enlèvement peut être organisé auprès de vendeurs particuliers, concessionnaires, ventes aux enchères, fournisseurs professionnels et sites de stockage.",
        "Specialist third-party crating":"Mise en caisse par un spécialiste tiers",
        "We arrange delivery to trusted professional packing companies when export crating is required.":"Nous organisons la livraison vers des sociétés d’emballage professionnelles de confiance lorsqu’une mise en caisse export est nécessaire.",
        "UK port delivery":"Livraison dans les ports britanniques",
        "Motorcycles can be delivered to ports, container depots, freight terminals and shipping warehouses.":"Les motos peuvent être livrées aux ports, dépôts de conteneurs, terminaux de fret et entrepôts d’expédition.",
        "Worldwide and door-to-door":"International et porte à porte",
        "We can liaise with shippers and help coordinate worldwide or door-to-door logistics where available.":"Nous pouvons assurer la liaison avec les transporteurs et coordonner, lorsque disponible, une logistique internationale ou porte à porte.",
        "Trade / export sale basis:":"Conditions de vente professionnelle / export :",
        "How motorcycle export works":"Comment fonctionne l’exportation d’une moto",
        "A clear route from the UK motorcycle market to your destination.":"Un parcours clair du marché britannique jusqu’à votre destination.",
        "Choose or request a bike":"Choisir ou demander une moto",
        "Browse available stock or send AnyBike a sourcing request.":"Consultez le stock disponible ou envoyez une demande de recherche à AnyBike.",
        "Check and agree":"Vérifier et convenir",
        "Availability, seller details, condition information and buying terms are confirmed.":"La disponibilité, les informations vendeur, l’état et les conditions d’achat sont confirmés.",
        "Collect and prepare":"Enlever et préparer",
        "The motorcycle is collected and delivered to the chosen port, shipper or specialist crating company.":"La moto est enlevée puis livrée au port, au transporteur ou à la société spécialisée de mise en caisse choisie.",
        "Ship and deliver":"Expédier et livrer",
        "AnyBike liaises with the freight provider or helps coordinate an available worldwide delivery route.":"AnyBike assure la liaison avec le prestataire de fret ou aide à coordonner une solution de livraison internationale disponible.",
        "Worldwide motorcycle exports":"Exportation de motos dans le monde entier",
        "UK motorcycles supplied to buyers across the world.":"Des motos britanniques fournies à des acheteurs dans le monde entier.",
        "International Motorcycle Markets":"Marchés moto internationaux",
        "71 live country guides.":"71 guides pays en ligne.",
        "Use AnyBike's dedicated market guides to explore buying UK motorcycles for your destination, with country-specific export information, route previews and direct paths into available stock.":"Utilisez les guides marchés dédiés d’AnyBike pour étudier l’achat de motos britanniques pour votre destination, avec des informations d’export propres à chaque pays, des aperçus d’itinéraires et un accès direct au stock disponible.",
        "Major UK export ports shown on the map":"Principaux ports d’export britanniques affichés sur la carte",
        "Choose a destination":"Choisissez une destination",
        "Open Guide":"Ouvrir le guide",
        "Select any live market to preview its route from the United Kingdom instantly.":"Sélectionnez un marché en ligne pour afficher instantanément son itinéraire depuis le Royaume-Uni.",
        "Live markets":"Marchés en ligne",
        "World regions":"Régions du monde",
        "View All International Markets":"Voir tous les marchés internationaux",
        "Choose a country above or hover any live guide below to preview a single route from the United Kingdom.":"Choisissez un pays ci-dessus ou survolez un guide en ligne ci-dessous pour prévisualiser son itinéraire depuis le Royaume-Uni.",
        "Live country guides":"Guides pays en ligne",
        "Explore all 71 live International Markets.":"Découvrez les 71 marchés internationaux en ligne.",
        "Every country below has a live AnyBike market page. Hover any guide to preview its route on the map above. Countries still in development are deliberately excluded from this list.":"Chaque pays ci-dessous dispose d’une page marché AnyBike en ligne. Survolez un guide pour prévisualiser son itinéraire sur la carte ci-dessus. Les pays encore en développement sont volontairement exclus de cette liste.",
        "Major UK ports and freight hubs":"Principaux ports et centres de fret britanniques",
        "Delivery to your nominated UK shipping point.":"Livraison au point d’expédition britannique que vous avez désigné.",
        "AnyBike can arrange motorcycle delivery to ports, freight forwarders, container depots, export packers and specialist motorcycle shipping companies.":"AnyBike peut organiser la livraison des motos vers les ports, transitaires, dépôts de conteneurs, emballeurs export et transporteurs spécialisés moto.",
        "Motorcycle export FAQ":"FAQ sur l’exportation de motos",
        "Questions about exporting motorcycles from the UK.":"Questions sur l’exportation de motos depuis le Royaume-Uni.",
        "Start your UK motorcycle export enquiry":"Commencez votre demande d’export moto depuis le Royaume-Uni",
        "Ready to export your next motorcycle?":"Prêt à exporter votre prochaine moto ?",
        "Browse live UK stock or tell AnyBike the motorcycle, destination and shipping support you need.":"Consultez le stock britannique disponible ou indiquez à AnyBike la moto, la destination et l’assistance d’expédition dont vous avez besoin.",
        "Send a Buying Request":"Envoyer une demande d’achat",
        "Contact the Export Team":"Contacter l’équipe export",
        "UK Motorcycle Export Specialists":"Spécialistes britanniques de l’export moto",
        "Worldwide motorcycle sourcing, collection and export support":"Recherche, enlèvement et assistance export de motos dans le monde entier",
        "Europe":"Europe","North America":"Amérique du Nord","Central America":"Amérique centrale","Caribbean":"Caraïbes","South America":"Amérique du Sud","Africa":"Afrique","Middle East":"Moyen-Orient","Asia":"Asie","Oceania":"Océanie"
      }},
      de:{text:{
        "UK motorcycle export specialists":"Spezialisten für Motorradexport aus Großbritannien","We source.":"Wir beschaffen.","We inspect.":"Wir prüfen.","We deliver worldwide.":"Wir liefern weltweit.",
        "Browse Available Stock":"Verfügbare Motorräder ansehen","Talk to the Export Team":"Exportteam kontaktieren","UK Sourcing":"Beschaffung in Großbritannien","UK Collection":"Abholung in Großbritannien","Secure Transport":"Sicherer Transport","Export Crating":"Exportverpackung","Port Delivery":"Lieferung zum Hafen","Worldwide Shipping":"Weltweiter Versand","Door to Door":"Tür zu Tür",
        "What AnyBike does":"Was AnyBike macht","Your complete UK motorcycle export partner.":"Ihr kompletter Partner für Motorradexport aus Großbritannien.","Motorcycle sourcing":"Motorradbeschaffung","Viewing and seller checks":"Besichtigung und Verkäuferprüfung","Visual condition support":"Sichtprüfung des Zustands","Purchase coordination":"Kaufkoordination","Collection anywhere in the UK":"Abholung überall in Großbritannien","Specialist third-party crating":"Professionelle Exportverpackung durch Dritte","UK port delivery":"Lieferung zu britischen Häfen","Worldwide and door-to-door":"Weltweit und Tür zu Tür",
        "How motorcycle export works":"So funktioniert der Motorradexport","Choose or request a bike":"Motorrad wählen oder anfragen","Check and agree":"Prüfen und vereinbaren","Collect and prepare":"Abholen und vorbereiten","Ship and deliver":"Versenden und liefern","Worldwide motorcycle exports":"Weltweiter Motorradexport","UK motorcycles supplied to buyers across the world.":"Britische Motorräder für Käufer weltweit.",
        "International Motorcycle Markets":"Internationale Motorradmärkte","71 live country guides.":"71 aktive Länderleitfäden.","Choose a destination":"Ziel auswählen","Open Guide":"Leitfaden öffnen","Live markets":"Aktive Märkte","World regions":"Weltregionen","View All International Markets":"Alle internationalen Märkte anzeigen","Live country guides":"Aktive Länderleitfäden","Major UK ports and freight hubs":"Wichtige britische Häfen und Frachtzentren","Motorcycle export FAQ":"FAQ zum Motorradexport","Start your UK motorcycle export enquiry":"Starten Sie Ihre britische Motorradexport-Anfrage","Ready to export your next motorcycle?":"Bereit für den Export Ihres nächsten Motorrads?","Send a Buying Request":"Kaufanfrage senden","Contact the Export Team":"Exportteam kontaktieren",
        "Europe":"Europa","North America":"Nordamerika","Central America":"Mittelamerika","Caribbean":"Karibik","South America":"Südamerika","Africa":"Afrika","Middle East":"Naher Osten","Asia":"Asien","Oceania":"Ozeanien"
      }},
      es:{text:{
        "UK motorcycle export specialists":"Especialistas en exportación de motocicletas del Reino Unido","We source.":"Buscamos.","We inspect.":"Inspeccionamos.","We deliver worldwide.":"Entregamos en todo el mundo.",
        "Browse Available Stock":"Ver motocicletas disponibles","Talk to the Export Team":"Hablar con el equipo de exportación","UK Sourcing":"Búsqueda en Reino Unido","UK Collection":"Recogida en Reino Unido","Secure Transport":"Transporte seguro","Export Crating":"Embalaje para exportación","Port Delivery":"Entrega en puerto","Worldwide Shipping":"Envío mundial","Door to Door":"Puerta a puerta",
        "What AnyBike does":"Qué hace AnyBike","Your complete UK motorcycle export partner.":"Su socio completo para exportar motocicletas desde el Reino Unido.","Motorcycle sourcing":"Búsqueda de motocicletas","Viewing and seller checks":"Visita y comprobación del vendedor","Visual condition support":"Comprobación visual del estado","Purchase coordination":"Coordinación de compra","Collection anywhere in the UK":"Recogida en cualquier lugar del Reino Unido","Specialist third-party crating":"Embalaje especializado por terceros","UK port delivery":"Entrega en puertos del Reino Unido","Worldwide and door-to-door":"Mundial y puerta a puerta",
        "How motorcycle export works":"Cómo funciona la exportación de motocicletas","Choose or request a bike":"Elija o solicite una motocicleta","Check and agree":"Comprobar y acordar","Collect and prepare":"Recoger y preparar","Ship and deliver":"Enviar y entregar","Worldwide motorcycle exports":"Exportación mundial de motocicletas","UK motorcycles supplied to buyers across the world.":"Motocicletas del Reino Unido para compradores de todo el mundo.",
        "International Motorcycle Markets":"Mercados internacionales de motocicletas","71 live country guides.":"71 guías de países activas.","Choose a destination":"Elija un destino","Open Guide":"Abrir guía","Live markets":"Mercados activos","World regions":"Regiones del mundo","View All International Markets":"Ver todos los mercados internacionales","Live country guides":"Guías de países activas","Major UK ports and freight hubs":"Principales puertos y centros de carga del Reino Unido","Motorcycle export FAQ":"Preguntas frecuentes sobre exportación de motocicletas","Start your UK motorcycle export enquiry":"Inicie su consulta de exportación desde el Reino Unido","Ready to export your next motorcycle?":"¿Listo para exportar su próxima motocicleta?","Send a Buying Request":"Enviar solicitud de compra","Contact the Export Team":"Contactar con el equipo de exportación",
        "Europe":"Europa","North America":"Norteamérica","Central America":"Centroamérica","Caribbean":"Caribe","South America":"Sudamérica","Africa":"África","Middle East":"Oriente Medio","Asia":"Asia","Oceania":"Oceanía"
      }},
      ar:{text:{
        "UK motorcycle export specialists":"متخصصون في تصدير الدراجات النارية من المملكة المتحدة","We source.":"نبحث.","We inspect.":"نفحص.","We deliver worldwide.":"نُسلّم حول العالم.","Browse Available Stock":"تصفح الدراجات المتاحة","Talk to the Export Team":"تواصل مع فريق التصدير","UK Sourcing":"البحث داخل المملكة المتحدة","UK Collection":"الاستلام داخل المملكة المتحدة","Secure Transport":"نقل آمن","Export Crating":"تعبئة للتصدير","Port Delivery":"التسليم إلى الميناء","Worldwide Shipping":"شحن عالمي","Door to Door":"من الباب إلى الباب",
        "What AnyBike does":"ما الذي تقوم به AnyBike","Your complete UK motorcycle export partner.":"شريكك المتكامل لتصدير الدراجات من المملكة المتحدة.","Motorcycle sourcing":"البحث عن الدراجات","Viewing and seller checks":"المعاينة والتحقق من البائع","Visual condition support":"دعم فحص الحالة الظاهرية","Purchase coordination":"تنسيق الشراء","Collection anywhere in the UK":"الاستلام من أي مكان في المملكة المتحدة","Specialist third-party crating":"تعبئة متخصصة بواسطة طرف ثالث","UK port delivery":"التسليم إلى موانئ المملكة المتحدة","Worldwide and door-to-door":"عالمي ومن الباب إلى الباب",
        "How motorcycle export works":"كيف يعمل تصدير الدراجات","Choose or request a bike":"اختر دراجة أو اطلبها","Check and agree":"التحقق والاتفاق","Collect and prepare":"الاستلام والتحضير","Ship and deliver":"الشحن والتسليم","Worldwide motorcycle exports":"تصدير الدراجات حول العالم","UK motorcycles supplied to buyers across the world.":"دراجات بريطانية للمشترين حول العالم.","International Motorcycle Markets":"أسواق الدراجات الدولية","71 live country guides.":"71 دليل دولة متاح.","Choose a destination":"اختر وجهة","Open Guide":"فتح الدليل","Live markets":"أسواق متاحة","World regions":"مناطق العالم","View All International Markets":"عرض جميع الأسواق الدولية","Live country guides":"أدلة الدول المتاحة","Major UK ports and freight hubs":"الموانئ ومراكز الشحن الرئيسية في المملكة المتحدة","Motorcycle export FAQ":"الأسئلة الشائعة حول تصدير الدراجات","Start your UK motorcycle export enquiry":"ابدأ استفسارك لتصدير دراجة من المملكة المتحدة","Ready to export your next motorcycle?":"هل أنت مستعد لتصدير دراجتك القادمة؟","Send a Buying Request":"إرسال طلب شراء","Contact the Export Team":"تواصل مع فريق التصدير",
        "Europe":"أوروبا","North America":"أمريكا الشمالية","Central America":"أمريكا الوسطى","Caribbean":"الكاريبي","South America":"أمريكا الجنوبية","Africa":"أفريقيا","Middle East":"الشرق الأوسط","Asia":"آسيا","Oceania":"أوقيانوسيا"
      }},
      id:{text:{
        "UK motorcycle export specialists":"Spesialis ekspor sepeda motor Inggris","We source.":"Kami mencari.","We inspect.":"Kami memeriksa.","We deliver worldwide.":"Kami mengirim ke seluruh dunia.","Browse Available Stock":"Lihat Motor Tersedia","Talk to the Export Team":"Hubungi Tim Ekspor","UK Sourcing":"Pencarian di Inggris","UK Collection":"Pengambilan di Inggris","Secure Transport":"Transportasi Aman","Export Crating":"Peti Ekspor","Port Delivery":"Pengiriman ke Pelabuhan","Worldwide Shipping":"Pengiriman Seluruh Dunia","Door to Door":"Pintu ke Pintu",
        "What AnyBike does":"Yang dilakukan AnyBike","Motorcycle sourcing":"Pencarian sepeda motor","Viewing and seller checks":"Pemeriksaan motor dan penjual","Visual condition support":"Pemeriksaan kondisi visual","Purchase coordination":"Koordinasi pembelian","Collection anywhere in the UK":"Pengambilan di seluruh Inggris","UK port delivery":"Pengiriman ke pelabuhan Inggris","Worldwide and door-to-door":"Seluruh dunia dan pintu ke pintu","How motorcycle export works":"Cara kerja ekspor sepeda motor","Choose or request a bike":"Pilih atau minta sepeda motor","Check and agree":"Periksa dan sepakati","Collect and prepare":"Ambil dan siapkan","Ship and deliver":"Kirim dan antar","International Motorcycle Markets":"Pasar Sepeda Motor Internasional","Choose a destination":"Pilih tujuan","Open Guide":"Buka Panduan","Live markets":"Pasar aktif","World regions":"Wilayah dunia","View All International Markets":"Lihat Semua Pasar Internasional","Live country guides":"Panduan negara aktif","Motorcycle export FAQ":"FAQ ekspor sepeda motor","Send a Buying Request":"Kirim Permintaan Pembelian","Contact the Export Team":"Hubungi Tim Ekspor",
        "Europe":"Eropa","North America":"Amerika Utara","Central America":"Amerika Tengah","Caribbean":"Karibia","South America":"Amerika Selatan","Africa":"Afrika","Middle East":"Timur Tengah","Asia":"Asia","Oceania":"Oseania"
      }},
      ms:{text:{
        "UK motorcycle export specialists":"Pakar eksport motosikal UK","We source.":"Kami cari.","We inspect.":"Kami periksa.","We deliver worldwide.":"Kami hantar ke seluruh dunia.","Browse Available Stock":"Lihat Motosikal Tersedia","Talk to the Export Team":"Hubungi Pasukan Eksport","UK Sourcing":"Pencarian di UK","UK Collection":"Pengambilan di UK","Secure Transport":"Pengangkutan Selamat","Export Crating":"Peti Eksport","Port Delivery":"Penghantaran ke Pelabuhan","Worldwide Shipping":"Penghantaran Seluruh Dunia","Door to Door":"Pintu ke Pintu",
        "What AnyBike does":"Apa yang AnyBike lakukan","Motorcycle sourcing":"Pencarian motosikal","Viewing and seller checks":"Pemeriksaan motosikal dan penjual","Visual condition support":"Sokongan pemeriksaan visual","Purchase coordination":"Penyelarasan pembelian","Collection anywhere in the UK":"Pengambilan di seluruh UK","UK port delivery":"Penghantaran ke pelabuhan UK","Worldwide and door-to-door":"Seluruh dunia dan pintu ke pintu","How motorcycle export works":"Cara eksport motosikal berfungsi","Choose or request a bike":"Pilih atau minta motosikal","Check and agree":"Semak dan setuju","Collect and prepare":"Ambil dan sediakan","Ship and deliver":"Hantar dan serah","International Motorcycle Markets":"Pasaran Motosikal Antarabangsa","Choose a destination":"Pilih destinasi","Open Guide":"Buka Panduan","Live markets":"Pasaran aktif","World regions":"Wilayah dunia","View All International Markets":"Lihat Semua Pasaran Antarabangsa","Live country guides":"Panduan negara aktif","Motorcycle export FAQ":"Soalan lazim eksport motosikal","Send a Buying Request":"Hantar Permintaan Pembelian","Contact the Export Team":"Hubungi Pasukan Eksport",
        "Europe":"Eropah","North America":"Amerika Utara","Central America":"Amerika Tengah","Caribbean":"Caribbean","South America":"Amerika Selatan","Africa":"Afrika","Middle East":"Timur Tengah","Asia":"Asia","Oceania":"Oceania"
      }},
      zh:{text:{
        "UK motorcycle export specialists":"英国摩托车出口专家","We source.":"我们寻找车辆。","We inspect.":"我们检查车辆。","We deliver worldwide.":"我们配送至全球。","Browse Available Stock":"浏览现有摩托车","Talk to the Export Team":"联系出口团队","UK Sourcing":"英国境内寻车","UK Collection":"英国境内提车","Secure Transport":"安全运输","Export Crating":"出口装箱","Port Delivery":"港口交付","Worldwide Shipping":"全球运输","Door to Door":"门到门",
        "What AnyBike does":"AnyBike 提供的服务","Motorcycle sourcing":"摩托车寻车","Viewing and seller checks":"看车与卖家核实","Visual condition support":"外观状况检查支持","Purchase coordination":"购买协调","Collection anywhere in the UK":"英国全境提车","UK port delivery":"英国港口交付","Worldwide and door-to-door":"全球及门到门","How motorcycle export works":"摩托车出口流程","Choose or request a bike":"选择或提出寻车需求","Check and agree":"核实并确认","Collect and prepare":"提车并准备","Ship and deliver":"运输并交付","International Motorcycle Markets":"国际摩托车市场","Choose a destination":"选择目的地","Open Guide":"打开指南","Live markets":"已上线市场","World regions":"世界地区","View All International Markets":"查看所有国际市场","Live country guides":"已上线国家指南","Motorcycle export FAQ":"摩托车出口常见问题","Send a Buying Request":"发送购买需求","Contact the Export Team":"联系出口团队",
        "Europe":"欧洲","North America":"北美洲","Central America":"中美洲","Caribbean":"加勒比地区","South America":"南美洲","Africa":"非洲","Middle East":"中东","Asia":"亚洲","Oceania":"大洋洲"
      }}
    });
  }

  if(path==="/international-markets.html"){
    const T={
      en:{pageTitle:"International Motorcycle Markets | AnyBike",text:{}},
      fr:{pageTitle:"Marchés internationaux de motos | AnyBike",text:{
        "AnyBike International Markets":"Marchés internationaux AnyBike","UK motorcycles for":"Motos britanniques pour","buyers worldwide.":"les acheteurs du monde entier.",
        "Buy quality UK motorcycles for export worldwide. Browse available motorcycles, explore international markets and discover how AnyBike can help you source, purchase and export motorcycles to your country.":"Achetez des motos britanniques de qualité pour l’exportation dans le monde entier. Consultez les motos disponibles, explorez les marchés internationaux et découvrez comment AnyBike peut vous aider à rechercher, acheter et exporter des motos vers votre pays.",
        "Find Your Country":"Trouver votre pays","Browse Live Motorcycles":"Voir les motos disponibles","View Export Services":"Voir les services d’exportation","Countries & Territories":"Pays et territoires","UK Motorcycle Stock":"Stock de motos au Royaume-Uni","Export Support":"Assistance export",
        "Find your market":"Trouver votre marché","Choose a country.":"Choisissez un pays.","Select your country to explore buying opportunities and export information. If your market page isn't live yet, you can still ask AnyBike to source a motorcycle for you.":"Sélectionnez votre pays pour découvrir les possibilités d’achat et les informations d’exportation. Si la page de votre marché n’est pas encore en ligne, vous pouvez tout de même demander à AnyBike de rechercher une moto pour vous.",
        "Clear Search":"Effacer la recherche","All":"Tous","Europe":"Europe","North America":"Amérique du Nord","Central America":"Amérique centrale","Caribbean":"Caraïbes","South America":"Amérique du Sud","Africa":"Afrique","Middle East":"Moyen-Orient","Asia":"Asie","Oceania":"Océanie",
        "From UK seller to your shipper":"Du vendeur britannique à votre transporteur","A clearer route to buying abroad.":"Un parcours plus clair pour acheter à l’étranger.","AnyBike handles the motorcycle and the practical UK work. Buyers can nominate their own shipper, freight forwarder, depot or UK port.":"AnyBike s’occupe de la moto et des opérations pratiques au Royaume-Uni. Les acheteurs peuvent désigner leur propre transporteur, transitaire, dépôt ou port britannique.",
        "Find or request a motorcycle":"Trouver ou demander une moto","Check, collect and prepare":"Vérifier, enlever et préparer","Deliver to your nominated shipper":"Livrer à votre transporteur désigné","How Motorcycle Export Works":"Comment fonctionne l’exportation d’une moto","Send a Buying Request":"Envoyer une demande d’achat",
        "Export eligibility":"Éligibilité à l’export","Export eligibility depends on the motorcycle and destination.":"L’éligibilité à l’export dépend de la moto et de la destination.","AnyBike Connect":"AnyBike Connect","Looking for a motorcycle in your country?":"Vous recherchez une moto dans votre pays ?","Request Motorcycles":"Demander des motos","Browse Available Stock":"Voir les motos disponibles","Country guide coming soon":"Guide pays bientôt disponible","Market guide":"Guide marché","Request a Motorcycle":"Demander une moto","Close":"Fermer",
        "No countries matched your search.":"Aucun pays ne correspond à votre recherche."
      },attributes:{placeholder:{"Search country or region...":"Rechercher un pays ou une région..."}, "aria-label":{"Search country or region":"Rechercher un pays ou une région"}}},
      de:{pageTitle:"Internationale Motorradmärkte | AnyBike",text:{
        "AnyBike International Markets":"Internationale AnyBike-Märkte","UK motorcycles for":"UK-Motorräder für","buyers worldwide.":"Käufer weltweit.","Find Your Country":"Land finden","Browse Live Motorcycles":"Verfügbare Motorräder ansehen","View Export Services":"Exportservices ansehen","Countries & Territories":"Länder & Gebiete","UK Motorcycle Stock":"UK-Motorradbestand","Export Support":"Exportunterstützung","Find your market":"Ihren Markt finden","Choose a country.":"Land auswählen.","Clear Search":"Suche löschen","All":"Alle","Europe":"Europa","North America":"Nordamerika","Central America":"Mittelamerika","Caribbean":"Karibik","South America":"Südamerika","Africa":"Afrika","Middle East":"Naher Osten","Asia":"Asien","Oceania":"Ozeanien","No countries matched your search.":"Keine Länder entsprechen Ihrer Suche.","Request Motorcycles":"Motorräder anfragen","Browse Available Stock":"Verfügbaren Bestand ansehen","Close":"Schließen"
      },attributes:{placeholder:{"Search country or region...":"Land oder Region suchen..."}, "aria-label":{"Search country or region":"Land oder Region suchen"}}},
      es:{pageTitle:"Mercados internacionales de motocicletas | AnyBike",text:{
        "AnyBike International Markets":"Mercados internacionales AnyBike","UK motorcycles for":"Motocicletas del Reino Unido para","buyers worldwide.":"compradores de todo el mundo.","Find Your Country":"Encontrar su país","Browse Live Motorcycles":"Ver motocicletas disponibles","View Export Services":"Ver servicios de exportación","Countries & Territories":"Países y territorios","UK Motorcycle Stock":"Stock de motocicletas del Reino Unido","Export Support":"Apoyo de exportación","Find your market":"Encuentre su mercado","Choose a country.":"Elija un país.","Clear Search":"Borrar búsqueda","All":"Todos","Europe":"Europa","North America":"Norteamérica","Central America":"Centroamérica","Caribbean":"Caribe","South America":"Sudamérica","Africa":"África","Middle East":"Oriente Medio","Asia":"Asia","Oceania":"Oceanía","No countries matched your search.":"Ningún país coincide con su búsqueda.","Request Motorcycles":"Solicitar motocicletas","Browse Available Stock":"Ver motocicletas disponibles","Close":"Cerrar"
      },attributes:{placeholder:{"Search country or region...":"Buscar país o región..."}, "aria-label":{"Search country or region":"Buscar país o región"}}},
      ar:{pageTitle:"أسواق الدراجات النارية الدولية | AnyBike",text:{
        "AnyBike International Markets":"أسواق AnyBike الدولية","UK motorcycles for":"دراجات بريطانية لـ","buyers worldwide.":"مشترين حول العالم.","Find Your Country":"ابحث عن بلدك","Browse Live Motorcycles":"تصفح الدراجات المتاحة","View Export Services":"عرض خدمات التصدير","Countries & Territories":"الدول والأقاليم","UK Motorcycle Stock":"مخزون الدراجات في المملكة المتحدة","Export Support":"دعم التصدير","Find your market":"ابحث عن سوقك","Choose a country.":"اختر دولة.","Clear Search":"مسح البحث","All":"الكل","Europe":"أوروبا","North America":"أمريكا الشمالية","Central America":"أمريكا الوسطى","Caribbean":"الكاريبي","South America":"أمريكا الجنوبية","Africa":"أفريقيا","Middle East":"الشرق الأوسط","Asia":"آسيا","Oceania":"أوقيانوسيا","No countries matched your search.":"لا توجد دول تطابق بحثك.","Request Motorcycles":"طلب دراجات","Browse Available Stock":"تصفح الدراجات المتاحة","Close":"إغلاق"
      },attributes:{placeholder:{"Search country or region...":"ابحث عن دولة أو منطقة..."}, "aria-label":{"Search country or region":"ابحث عن دولة أو منطقة"}}},
      id:{pageTitle:"Pasar Sepeda Motor Internasional | AnyBike",text:{
        "AnyBike International Markets":"Pasar Internasional AnyBike","UK motorcycles for":"Sepeda motor Inggris untuk","buyers worldwide.":"pembeli di seluruh dunia.","Find Your Country":"Temukan Negara Anda","Browse Live Motorcycles":"Lihat Motor Tersedia","View Export Services":"Lihat Layanan Ekspor","Countries & Territories":"Negara & Wilayah","UK Motorcycle Stock":"Stok Sepeda Motor Inggris","Export Support":"Dukungan Ekspor","Find your market":"Temukan pasar Anda","Choose a country.":"Pilih negara.","Clear Search":"Hapus Pencarian","All":"Semua","Europe":"Eropa","North America":"Amerika Utara","Central America":"Amerika Tengah","Caribbean":"Karibia","South America":"Amerika Selatan","Africa":"Afrika","Middle East":"Timur Tengah","Asia":"Asia","Oceania":"Oseania","No countries matched your search.":"Tidak ada negara yang cocok dengan pencarian Anda.","Request Motorcycles":"Minta Sepeda Motor","Browse Available Stock":"Lihat Motor Tersedia","Close":"Tutup"
      },attributes:{placeholder:{"Search country or region...":"Cari negara atau wilayah..."}, "aria-label":{"Search country or region":"Cari negara atau wilayah"}}},
      ms:{pageTitle:"Pasaran Motosikal Antarabangsa | AnyBike",text:{
        "AnyBike International Markets":"Pasaran Antarabangsa AnyBike","UK motorcycles for":"Motosikal UK untuk","buyers worldwide.":"pembeli di seluruh dunia.","Find Your Country":"Cari Negara Anda","Browse Live Motorcycles":"Lihat Motosikal Tersedia","View Export Services":"Lihat Perkhidmatan Eksport","Countries & Territories":"Negara & Wilayah","UK Motorcycle Stock":"Stok Motosikal UK","Export Support":"Sokongan Eksport","Find your market":"Cari pasaran anda","Choose a country.":"Pilih negara.","Clear Search":"Padam Carian","All":"Semua","Europe":"Eropah","North America":"Amerika Utara","Central America":"Amerika Tengah","Caribbean":"Caribbean","South America":"Amerika Selatan","Africa":"Afrika","Middle East":"Timur Tengah","Asia":"Asia","Oceania":"Oceania","No countries matched your search.":"Tiada negara sepadan dengan carian anda.","Request Motorcycles":"Minta Motosikal","Browse Available Stock":"Lihat Motosikal Tersedia","Close":"Tutup"
      },attributes:{placeholder:{"Search country or region...":"Cari negara atau wilayah..."}, "aria-label":{"Search country or region":"Cari negara atau wilayah"}}},
      zh:{pageTitle:"国际摩托车市场 | AnyBike",text:{
        "AnyBike International Markets":"AnyBike 国际市场","UK motorcycles for":"英国摩托车面向","buyers worldwide.":"全球买家。","Find Your Country":"查找您的国家","Browse Live Motorcycles":"浏览现有摩托车","View Export Services":"查看出口服务","Countries & Territories":"国家与地区","UK Motorcycle Stock":"英国摩托车库存","Export Support":"出口支持","Find your market":"查找您的市场","Choose a country.":"选择国家。","Clear Search":"清除搜索","All":"全部","Europe":"欧洲","North America":"北美洲","Central America":"中美洲","Caribbean":"加勒比地区","South America":"南美洲","Africa":"非洲","Middle East":"中东","Asia":"亚洲","Oceania":"大洋洲","No countries matched your search.":"没有国家符合您的搜索。","Request Motorcycles":"提出摩托车需求","Browse Available Stock":"浏览现有摩托车","Close":"关闭"
      },attributes:{placeholder:{"Search country or region...":"搜索国家或地区..."}, "aria-label":{"Search country or region":"搜索国家或地区"}}}
    };

    reg(T,function(language,dictionary){
      const count=document.getElementById("resultsNote");
      if(count){
        const m=String(count.textContent||"").match(/(\d+)/);
        const n=m?Number(m[1]):0;
        const formats={
          en:n+" market"+(n===1?"":"s")+" shown",
          fr:n+" marché"+(n===1?"":"s")+" affiché"+(n===1?"":"s"),
          de:n+" Markt"+(n===1?"":"märkte")+" angezeigt",
          es:n+" mercado"+(n===1?"":"s")+" mostrado"+(n===1?"":"s"),
          ar:"تم عرض "+n+" سوق",
          id:n+" pasar ditampilkan",
          ms:n+" pasaran dipaparkan",
          zh:"显示 "+n+" 个市场"
        };
        count.textContent=formats[language]||formats.en;
      }
    });
  }
})();