/*
AnyBike
File: public-page-translations.js
Public translation dictionaries — first full rollout batch
Date: 20 September 2026

English remains the drafting/source language.
*/

(function(){
  if(!window.AnyBikePageLanguage){
    return;
  }

  const path=String(location.pathname || "/").toLowerCase();

  function register(paths,translations){
    if(!paths.includes(path)){
      return;
    }

    window.AnyBikePageLanguage.register({
      root:"main",
      translations:translations
    });
  }

  register(["/","/index.html"],{
    en:{pageTitle:"AnyBike | UK Motorcycles for International & Trade Buyers",text:{}},
    de:{pageTitle:"AnyBike | UK-Motorräder für internationale Handelskäufer",text:{
      "International retail • International trade • UK trade":"Internationaler Handel • Internationaler Export • UK-Handel",
      "UK motorcycles.":"UK-Motorräder.",
      "Bought and sold by AnyBike.":"Von AnyBike gekauft und verkauft.",
      "AnyBike sources and buys motorcycles from across the United Kingdom and resells them to international retail buyers, international trade buyers and UK motorcycle trade customers.":"AnyBike beschafft und kauft Motorräder im gesamten Vereinigten Königreich und verkauft sie an internationale Handelskäufer sowie an britische Motorradhandelskunden weiter.",
      "Browse motorcycles available through AnyBike, tell us what you are looking for, or supply motorcycles to us. We support sourcing, purchase, collection, documentation and international delivery arrangements.":"Durchsuchen Sie über AnyBike verfügbare Motorräder, teilen Sie uns mit, was Sie suchen, oder bieten Sie uns Motorräder an. Wir unterstützen Beschaffung, Kauf, Abholung, Dokumentation und internationale Lieferorganisation.",
      "Browse Motorcycles":"Motorräder ansehen","Tell Us What You Need":"Sagen Sie uns, was Sie suchen","Sell to AnyBike":"An AnyBike verkaufen",
      "AnyBike buys and resells":"AnyBike kauft und verkauft weiter","International retail & trade":"Internationaler Handel","UK dealer-to-dealer trade":"UK-Händlerhandel","Worldwide export support":"Weltweite Exportunterstützung",
      "UK trade only":"Nur UK-Handel","AnyBike does not sell motorcycles to the general public in the UK.":"AnyBike verkauft in Großbritannien keine Motorräder an die allgemeine Öffentlichkeit.",
      "Motorcycles available through AnyBike":"Über AnyBike verfügbare Motorräder","Recently added motorcycles.":"Neu hinzugefügte Motorräder.","Selected motorcycles currently available through AnyBike.":"Ausgewählte Motorräder, die derzeit über AnyBike verfügbar sind.","Browse All Motorcycles":"Alle Motorräder ansehen",
      "Start with AnyBike":"Mit AnyBike starten","What would you like to do?":"Was möchten Sie tun?","Choose the route that best matches your motorcycle enquiry.":"Wählen Sie den Weg, der am besten zu Ihrer Motorradanfrage passt.",
      "Buy a Motorcycle":"Motorrad kaufen","Start buying →":"Kauf starten →","Sell / Supply a Motorcycle":"Motorrad verkaufen / anbieten","Sell to AnyBike →":"An AnyBike verkaufen →",
      "I'm a Motorcycle Dealer":"Ich bin Motorradhändler","Dealer opportunities →":"Händlermöglichkeiten →","International Motorcycle Services":"Internationale Motorradservices","Explore international services →":"Internationale Services ansehen →",
      "Why AnyBike":"Warum AnyBike","A motorcycle trading business, not a classified marketplace.":"Ein Motorradhandelsunternehmen, kein Kleinanzeigenportal.","Explore Export Services":"Exportservices ansehen"
    }},
    fr:{pageTitle:"AnyBike | Motos britanniques pour acheteurs professionnels internationaux",text:{
      "International retail • International trade • UK trade":"Commerce international • Export • Commerce UK","UK motorcycles.":"Motos britanniques.","Bought and sold by AnyBike.":"Achetées et revendues par AnyBike.",
      "Browse Motorcycles":"Voir les motos","Tell Us What You Need":"Dites-nous ce que vous recherchez","Sell to AnyBike":"Vendre à AnyBike",
      "AnyBike buys and resells":"AnyBike achète et revend","International retail & trade":"Commerce international","UK dealer-to-dealer trade":"Commerce entre professionnels UK","Worldwide export support":"Assistance export mondiale",
      "UK trade only":"Professionnels UK uniquement","AnyBike does not sell motorcycles to the general public in the UK.":"AnyBike ne vend pas de motos au grand public au Royaume-Uni.",
      "Motorcycles available through AnyBike":"Motos disponibles via AnyBike","Recently added motorcycles.":"Motos récemment ajoutées.","Selected motorcycles currently available through AnyBike.":"Sélection de motos actuellement disponibles via AnyBike.","Browse All Motorcycles":"Voir toutes les motos",
      "Start with AnyBike":"Commencer avec AnyBike","What would you like to do?":"Que souhaitez-vous faire ?","Choose the route that best matches your motorcycle enquiry.":"Choisissez le parcours correspondant le mieux à votre demande.",
      "Buy a Motorcycle":"Acheter une moto","Start buying →":"Commencer l'achat →","Sell / Supply a Motorcycle":"Vendre / proposer une moto","Sell to AnyBike →":"Vendre à AnyBike →",
      "I'm a Motorcycle Dealer":"Je suis professionnel de la moto","Dealer opportunities →":"Opportunités professionnels →","International Motorcycle Services":"Services moto internationaux","Explore international services →":"Découvrir les services internationaux →",
      "Why AnyBike":"Pourquoi AnyBike","A motorcycle trading business, not a classified marketplace.":"Une entreprise de négoce moto, pas un site de petites annonces.","Explore Export Services":"Découvrir les services export"
    }},
    es:{pageTitle:"AnyBike | Motos del Reino Unido para compradores profesionales internacionales",text:{
      "International retail • International trade • UK trade":"Comercio internacional • Exportación • Comercio UK","UK motorcycles.":"Motocicletas del Reino Unido.","Bought and sold by AnyBike.":"Compradas y revendidas por AnyBike.",
      "Browse Motorcycles":"Ver motocicletas","Tell Us What You Need":"Díganos qué busca","Sell to AnyBike":"Vender a AnyBike",
      "AnyBike buys and resells":"AnyBike compra y revende","International retail & trade":"Comercio internacional","UK dealer-to-dealer trade":"Comercio entre profesionales UK","Worldwide export support":"Apoyo mundial de exportación",
      "UK trade only":"Solo comercio UK","AnyBike does not sell motorcycles to the general public in the UK.":"AnyBike no vende motocicletas al público general en el Reino Unido.",
      "Motorcycles available through AnyBike":"Motocicletas disponibles a través de AnyBike","Recently added motorcycles.":"Motocicletas añadidas recientemente.","Selected motorcycles currently available through AnyBike.":"Selección de motocicletas actualmente disponibles a través de AnyBike.","Browse All Motorcycles":"Ver todas las motocicletas",
      "Start with AnyBike":"Empezar con AnyBike","What would you like to do?":"¿Qué desea hacer?","Choose the route that best matches your motorcycle enquiry.":"Elija la opción que mejor se adapte a su consulta.",
      "Buy a Motorcycle":"Comprar una motocicleta","Start buying →":"Empezar compra →","Sell / Supply a Motorcycle":"Vender / suministrar una motocicleta","Sell to AnyBike →":"Vender a AnyBike →",
      "I'm a Motorcycle Dealer":"Soy profesional de motocicletas","Dealer opportunities →":"Oportunidades para profesionales →","International Motorcycle Services":"Servicios internacionales de motocicletas","Explore international services →":"Ver servicios internacionales →",
      "Why AnyBike":"Por qué AnyBike","A motorcycle trading business, not a classified marketplace.":"Una empresa de comercio de motocicletas, no un portal de anuncios.","Explore Export Services":"Ver servicios de exportación"
    }},
    ar:{pageTitle:"AnyBike | دراجات بريطانية للمشترين التجاريين الدوليين",text:{
      "International retail • International trade • UK trade":"تجارة دولية • تصدير • تجارة داخل المملكة المتحدة","UK motorcycles.":"دراجات نارية بريطانية.","Bought and sold by AnyBike.":"تشتريها AnyBike وتعيد بيعها.",
      "Browse Motorcycles":"تصفح الدراجات","Tell Us What You Need":"أخبرنا بما تحتاجه","Sell to AnyBike":"بع إلى AnyBike",
      "AnyBike buys and resells":"AnyBike تشتري وتعيد البيع","International retail & trade":"تجارة دولية","UK dealer-to-dealer trade":"تجارة بين التجار في المملكة المتحدة","Worldwide export support":"دعم تصدير عالمي",
      "UK trade only":"تجارة المملكة المتحدة فقط","AnyBike does not sell motorcycles to the general public in the UK.":"لا تبيع AnyBike الدراجات النارية لعامة الجمهور في المملكة المتحدة.",
      "Motorcycles available through AnyBike":"دراجات متاحة عبر AnyBike","Recently added motorcycles.":"دراجات أضيفت مؤخراً.","Selected motorcycles currently available through AnyBike.":"دراجات مختارة متاحة حالياً عبر AnyBike.","Browse All Motorcycles":"عرض جميع الدراجات",
      "Start with AnyBike":"ابدأ مع AnyBike","What would you like to do?":"ماذا تريد أن تفعل؟","Choose the route that best matches your motorcycle enquiry.":"اختر المسار الأنسب لاستفسارك.",
      "Buy a Motorcycle":"شراء دراجة نارية","Start buying →":"ابدأ الشراء →","Sell / Supply a Motorcycle":"بيع / توريد دراجة","Sell to AnyBike →":"بع إلى AnyBike →",
      "I'm a Motorcycle Dealer":"أنا تاجر دراجات نارية","Dealer opportunities →":"فرص التجار →","International Motorcycle Services":"خدمات الدراجات الدولية","Explore international services →":"استكشف الخدمات الدولية →",
      "Why AnyBike":"لماذا AnyBike","A motorcycle trading business, not a classified marketplace.":"شركة تجارة دراجات نارية وليست سوق إعلانات مبوبة.","Explore Export Services":"استكشف خدمات التصدير"
    }}
  });

  register(["/about-us.html"],{
    en:{pageTitle:"About AnyBike | International & Trade Motorcycle Buying",text:{}},
    de:{pageTitle:"Über AnyBike | Internationaler Motorradhandel",text:{
      "About AnyBike":"Über AnyBike","A different way to buy and trade":"Eine andere Art, Motorräder zu kaufen und zu handeln","UK motorcycles.":"UK-Motorräder.",
      "Browse Motorcycles":"Motorräder ansehen","Work With AnyBike":"Mit AnyBike arbeiten","How AnyBike works":"So funktioniert AnyBike","AnyBike is the buyer and the seller.":"AnyBike ist Käufer und Verkäufer.",
      "Experience":"Erfahrung","Approximately 40 years of motorcycle industry experience behind AnyBike.":"Rund 40 Jahre Erfahrung in der Motorradbranche stehen hinter AnyBike.","Why we are building AnyBike":"Warum wir AnyBike aufbauen",
      "Motorcycles should move more intelligently between markets.":"Motorräder sollten intelligenter zwischen Märkten bewegt werden.","Who AnyBike sells to":"An wen AnyBike verkauft","International buyers and motorcycle trade customers.":"Internationale Käufer und Motorradhandelskunden.",
      "International Retail":"Internationaler Verkauf","International Trade":"Internationaler Handel","UK Trade":"UK-Handel"
    }},
    fr:{pageTitle:"À propos d’AnyBike | Négoce moto international",text:{
      "About AnyBike":"À propos d’AnyBike","A different way to buy and trade":"Une autre façon d'acheter et de négocier","UK motorcycles.":"des motos britanniques.",
      "Browse Motorcycles":"Voir les motos","Work With AnyBike":"Travailler avec AnyBike","How AnyBike works":"Comment fonctionne AnyBike","AnyBike is the buyer and the seller.":"AnyBike est l'acheteur et le vendeur.",
      "Experience":"Expérience","Approximately 40 years of motorcycle industry experience behind AnyBike.":"Environ 40 ans d'expérience dans l'industrie moto derrière AnyBike.","Why we are building AnyBike":"Pourquoi nous construisons AnyBike",
      "Motorcycles should move more intelligently between markets.":"Les motos devraient circuler plus intelligemment entre les marchés.","Who AnyBike sells to":"À qui AnyBike vend","International buyers and motorcycle trade customers.":"Acheteurs internationaux et clients professionnels de la moto.",
      "International Retail":"International","International Trade":"Commerce international","UK Trade":"Commerce UK"
    }},
    es:{pageTitle:"Sobre AnyBike | Comercio internacional de motocicletas",text:{
      "About AnyBike":"Sobre AnyBike","A different way to buy and trade":"Una forma diferente de comprar y comerciar","UK motorcycles.":"motocicletas del Reino Unido.",
      "Browse Motorcycles":"Ver motocicletas","Work With AnyBike":"Trabajar con AnyBike","How AnyBike works":"Cómo funciona AnyBike","AnyBike is the buyer and the seller.":"AnyBike es el comprador y el vendedor.",
      "Experience":"Experiencia","Approximately 40 years of motorcycle industry experience behind AnyBike.":"Aproximadamente 40 años de experiencia en la industria de la motocicleta detrás de AnyBike.","Why we are building AnyBike":"Por qué estamos construyendo AnyBike",
      "Motorcycles should move more intelligently between markets.":"Las motocicletas deberían moverse de forma más inteligente entre mercados.","Who AnyBike sells to":"A quién vende AnyBike","International buyers and motorcycle trade customers.":"Compradores internacionales y clientes profesionales de motocicletas.",
      "International Retail":"Internacional","International Trade":"Comercio internacional","UK Trade":"Comercio UK"
    }},
    ar:{pageTitle:"عن AnyBike | تجارة الدراجات الدولية",text:{
      "About AnyBike":"عن AnyBike","A different way to buy and trade":"طريقة مختلفة لشراء وتجارة","UK motorcycles.":"الدراجات البريطانية.",
      "Browse Motorcycles":"تصفح الدراجات","Work With AnyBike":"اعمل مع AnyBike","How AnyBike works":"كيف تعمل AnyBike","AnyBike is the buyer and the seller.":"AnyBike هي المشتري والبائع.",
      "Experience":"الخبرة","Approximately 40 years of motorcycle industry experience behind AnyBike.":"تقف وراء AnyBike خبرة تقارب 40 عاماً في صناعة الدراجات النارية.","Why we are building AnyBike":"لماذا نبني AnyBike",
      "Motorcycles should move more intelligently between markets.":"ينبغي أن تنتقل الدراجات بذكاء أكبر بين الأسواق.","Who AnyBike sells to":"لمن تبيع AnyBike","International buyers and motorcycle trade customers.":"المشترون الدوليون وعملاء تجارة الدراجات.",
      "International Retail":"دولي","International Trade":"تجارة دولية","UK Trade":"تجارة المملكة المتحدة"
    }}
  });

  register(["/buy-motorcycles.html"],{
    en:{pageTitle:"Buy Motorcycles from the UK | AnyBike Export Motorcycle Buyers",text:{}},
    de:{pageTitle:"Motorräder aus Großbritannien kaufen | AnyBike",text:{
      "Buy motorcycles from the UK":"Motorräder aus Großbritannien kaufen","Buy UK motorcycles for export.":"UK-Motorräder für den Export kaufen.",
      "AnyBike supplies UK motorcycles to trade and business buyers, dealers, wholesalers and overseas importers.":"AnyBike liefert UK-Motorräder an gewerbliche Käufer, Händler, Großhändler und Importeure im Ausland.",
      "Browse Available Stock":"Verfügbaren Bestand ansehen","Request Multiple Bikes":"Mehrere Motorräder anfragen","Buyer routes":"Käuferwege","Choose how you want to buy.":"Wählen Sie, wie Sie kaufen möchten.",
      "Buy one motorcycle":"Ein Motorrad kaufen","Request a motorcycle":"Motorrad anfragen","Bulk buyers & dealers":"Großabnehmer & Händler",
      "Live UK stock":"Aktueller UK-Bestand","Available motorcycles.":"Verfügbare Motorräder.","How buying works":"So funktioniert der Kauf","From enquiry to UK shipper.":"Von der Anfrage bis zum UK-Spediteur.",
      "Buyer FAQ":"Käufer-FAQ","Buying motorcycles from the UK.":"Motorräder aus Großbritannien kaufen.","Can I buy one motorcycle?":"Kann ich ein einzelnes Motorrad kaufen?","Does an export motorcycle include a mechanical warranty?":"Enthält ein Exportmotorrad eine mechanische Garantie?","Where are the trade sale terms?":"Wo finde ich die Handelsbedingungen?"
    }},
    fr:{pageTitle:"Acheter des motos au Royaume-Uni | AnyBike",text:{
      "Buy motorcycles from the UK":"Acheter des motos au Royaume-Uni","Buy UK motorcycles for export.":"Achetez des motos britanniques pour l'export.",
      "Browse Available Stock":"Voir le stock disponible","Request Multiple Bikes":"Demander plusieurs motos","Buyer routes":"Parcours acheteur","Choose how you want to buy.":"Choisissez comment vous souhaitez acheter.",
      "Buy one motorcycle":"Acheter une moto","Request a motorcycle":"Demander une moto","Bulk buyers & dealers":"Acheteurs en volume & professionnels",
      "Live UK stock":"Stock UK en direct","Available motorcycles.":"Motos disponibles.","How buying works":"Comment fonctionne l'achat","From enquiry to UK shipper.":"De la demande au transporteur UK.",
      "Buyer FAQ":"FAQ acheteur","Buying motorcycles from the UK.":"Acheter des motos au Royaume-Uni.","Can I buy one motorcycle?":"Puis-je acheter une seule moto ?","Does an export motorcycle include a mechanical warranty?":"Une moto export inclut-elle une garantie mécanique ?","Where are the trade sale terms?":"Où trouver les conditions de vente professionnelle ?"
    }},
    es:{pageTitle:"Comprar motocicletas del Reino Unido | AnyBike",text:{
      "Buy motorcycles from the UK":"Comprar motocicletas del Reino Unido","Buy UK motorcycles for export.":"Compre motocicletas del Reino Unido para exportación.",
      "Browse Available Stock":"Ver stock disponible","Request Multiple Bikes":"Solicitar varias motocicletas","Buyer routes":"Opciones de compra","Choose how you want to buy.":"Elija cómo quiere comprar.",
      "Buy one motorcycle":"Comprar una motocicleta","Request a motorcycle":"Solicitar una motocicleta","Bulk buyers & dealers":"Compradores de volumen y profesionales",
      "Live UK stock":"Stock del Reino Unido","Available motorcycles.":"Motocicletas disponibles.","How buying works":"Cómo funciona la compra","From enquiry to UK shipper.":"De la consulta al transportista del Reino Unido.",
      "Buyer FAQ":"Preguntas frecuentes","Buying motorcycles from the UK.":"Comprar motocicletas del Reino Unido.","Can I buy one motorcycle?":"¿Puedo comprar una sola motocicleta?","Does an export motorcycle include a mechanical warranty?":"¿Una motocicleta de exportación incluye garantía mecánica?","Where are the trade sale terms?":"¿Dónde están las condiciones de venta comercial?"
    }},
    ar:{pageTitle:"شراء دراجات من المملكة المتحدة | AnyBike",text:{
      "Buy motorcycles from the UK":"شراء دراجات من المملكة المتحدة","Buy UK motorcycles for export.":"اشتر دراجات بريطانية للتصدير.",
      "Browse Available Stock":"تصفح المخزون المتاح","Request Multiple Bikes":"اطلب عدة دراجات","Buyer routes":"مسارات الشراء","Choose how you want to buy.":"اختر طريقة الشراء.",
      "Buy one motorcycle":"شراء دراجة واحدة","Request a motorcycle":"طلب دراجة","Bulk buyers & dealers":"المشترون بالجملة والتجار",
      "Live UK stock":"المخزون البريطاني المباشر","Available motorcycles.":"الدراجات المتاحة.","How buying works":"كيف يعمل الشراء","From enquiry to UK shipper.":"من الاستفسار إلى شركة الشحن البريطانية.",
      "Buyer FAQ":"أسئلة المشترين","Buying motorcycles from the UK.":"شراء دراجات من المملكة المتحدة.","Can I buy one motorcycle?":"هل يمكنني شراء دراجة واحدة؟","Does an export motorcycle include a mechanical warranty?":"هل تتضمن الدراجة المصدرة ضماناً ميكانيكياً؟","Where are the trade sale terms?":"أين شروط البيع التجاري؟"
    }}
  });

  register(["/motorcycle-inspection.html"],{
    en:{pageTitle:"Motorcycle Inspection UK | AnyBike Export Services",text:{}},
    de:{pageTitle:"Motorradprüfung UK | AnyBike Export Services",text:{
      "Motorcycle Inspection Support":"Unterstützung bei Motorradprüfungen","Motorcycle":"Motorrad","Inspection":"Prüfung",
      "AnyBike can help with:":"AnyBike kann helfen bei:","Visible condition checks":"Sichtprüfung des Zustands","Identification and mileage review":"Prüfung von Identität und Kilometerstand","Photos and video where available":"Fotos und Videos, soweit verfügbar","Document and damage observations":"Dokument- und Schadensbeobachtungen",
      "How the service works":"So funktioniert der Service","Better information before a motorcycle moves.":"Bessere Informationen, bevor ein Motorrad bewegt wird.",
      "Visible condition":"Sichtbarer Zustand","Identity and details":"Identität und Details","Photo and video evidence":"Foto- und Videonachweise",
      "Collection Condition Check":"Zustandsprüfung bei Abholung","Independent Mechanical Inspection":"Unabhängige mechanische Prüfung","Your inspection choice is recorded":"Ihre Prüfungswahl wird dokumentiert",
      "What happens next":"Was passiert danach","Request inspection support":"Prüfunterstützung anfragen"
    }},
    fr:{pageTitle:"Inspection moto UK | AnyBike",text:{
      "Motorcycle Inspection Support":"Assistance inspection moto","Motorcycle":"Moto","Inspection":"Inspection","AnyBike can help with:":"AnyBike peut vous aider avec :",
      "Visible condition checks":"Contrôles visuels d'état","Identification and mileage review":"Vérification de l'identification et du kilométrage","Photos and video where available":"Photos et vidéos si disponibles","Document and damage observations":"Observations sur les documents et dommages",
      "How the service works":"Comment fonctionne le service","Better information before a motorcycle moves.":"De meilleures informations avant le déplacement de la moto.","Visible condition":"État visible","Identity and details":"Identification et détails","Photo and video evidence":"Preuves photo et vidéo","Collection Condition Check":"Contrôle d'état à l'enlèvement","Independent Mechanical Inspection":"Inspection mécanique indépendante","Your inspection choice is recorded":"Votre choix d'inspection est enregistré","What happens next":"Étape suivante","Request inspection support":"Demander une inspection"
    }},
    es:{pageTitle:"Inspección de motocicletas UK | AnyBike",text:{
      "Motorcycle Inspection Support":"Apoyo para inspección de motocicletas","Motorcycle":"Motocicleta","Inspection":"Inspección","AnyBike can help with:":"AnyBike puede ayudar con:",
      "Visible condition checks":"Comprobaciones visuales de estado","Identification and mileage review":"Revisión de identificación y kilometraje","Photos and video where available":"Fotos y vídeo cuando estén disponibles","Document and damage observations":"Observaciones de documentos y daños",
      "How the service works":"Cómo funciona el servicio","Better information before a motorcycle moves.":"Mejor información antes de mover una motocicleta.","Visible condition":"Estado visible","Identity and details":"Identificación y detalles","Photo and video evidence":"Evidencia fotográfica y vídeo","Collection Condition Check":"Comprobación de estado en recogida","Independent Mechanical Inspection":"Inspección mecánica independiente","Your inspection choice is recorded":"Se registra su elección de inspección","What happens next":"Qué ocurre después","Request inspection support":"Solicitar apoyo de inspección"
    }},
    ar:{pageTitle:"فحص الدراجات في المملكة المتحدة | AnyBike",text:{
      "Motorcycle Inspection Support":"دعم فحص الدراجات","Motorcycle":"دراجة نارية","Inspection":"فحص","AnyBike can help with:":"يمكن لـ AnyBike المساعدة في:",
      "Visible condition checks":"فحوص الحالة الظاهرة","Identification and mileage review":"مراجعة الهوية والمسافة","Photos and video where available":"صور وفيديو عند توفرها","Document and damage observations":"ملاحظات المستندات والأضرار",
      "How the service works":"كيف تعمل الخدمة","Better information before a motorcycle moves.":"معلومات أفضل قبل نقل الدراجة.","Visible condition":"الحالة الظاهرة","Identity and details":"الهوية والتفاصيل","Photo and video evidence":"أدلة الصور والفيديو","Collection Condition Check":"فحص الحالة عند الاستلام","Independent Mechanical Inspection":"فحص ميكانيكي مستقل","Your inspection choice is recorded":"يتم تسجيل اختيار الفحص","What happens next":"ما التالي","Request inspection support":"اطلب دعم الفحص"
    }}
  });

  register(["/motorcycle-collection.html"],{
    en:{pageTitle:"Motorcycle Collection UK | AnyBike Export Services",text:{}},
    de:{pageTitle:"Motorradabholung UK | AnyBike",text:{
      "Motorcycle Collection":"Motorradabholung","UK motorcycle collection arranged around the deal.":"UK-Motorradabholung passend zum Geschäft organisiert.","Collection can be arranged from:":"Abholung möglich von:","Private sellers":"Privatverkäufern","Motorcycle dealers":"Motorradhändlern","Auctions and trade suppliers":"Auktionen und Handelspartnern","Storage facilities":"Lagereinrichtungen","How collection works":"So funktioniert die Abholung","From seller to the agreed UK handover point.":"Vom Verkäufer zum vereinbarten UK-Übergabepunkt.","Request Collection":"Abholung anfragen"
    }},
    fr:{pageTitle:"Enlèvement de motos UK | AnyBike",text:{
      "Motorcycle Collection":"Enlèvement de moto","UK motorcycle collection arranged around the deal.":"Enlèvement au Royaume-Uni organisé autour de la transaction.","Collection can be arranged from:":"Enlèvement possible auprès de :","Private sellers":"Vendeurs particuliers","Motorcycle dealers":"Professionnels moto","Auctions and trade suppliers":"Enchères et fournisseurs professionnels","Storage facilities":"Sites de stockage","How collection works":"Comment fonctionne l'enlèvement","From seller to the agreed UK handover point.":"Du vendeur au point de remise UK convenu.","Request Collection":"Demander un enlèvement"
    }},
    es:{pageTitle:"Recogida de motocicletas UK | AnyBike",text:{
      "Motorcycle Collection":"Recogida de motocicletas","UK motorcycle collection arranged around the deal.":"Recogida en el Reino Unido organizada según la operación.","Collection can be arranged from:":"La recogida puede organizarse desde:","Private sellers":"Vendedores particulares","Motorcycle dealers":"Profesionales de motocicletas","Auctions and trade suppliers":"Subastas y proveedores comerciales","Storage facilities":"Instalaciones de almacenamiento","How collection works":"Cómo funciona la recogida","From seller to the agreed UK handover point.":"Del vendedor al punto de entrega UK acordado.","Request Collection":"Solicitar recogida"
    }},
    ar:{pageTitle:"استلام الدراجات في المملكة المتحدة | AnyBike",text:{
      "Motorcycle Collection":"استلام الدراجات","UK motorcycle collection arranged around the deal.":"تنظيم استلام الدراجة في المملكة المتحدة حسب الصفقة.","Collection can be arranged from:":"يمكن ترتيب الاستلام من:","Private sellers":"البائعين الأفراد","Motorcycle dealers":"تجار الدراجات","Auctions and trade suppliers":"المزادات والموردين التجاريين","Storage facilities":"مرافق التخزين","How collection works":"كيف يعمل الاستلام","From seller to the agreed UK handover point.":"من البائع إلى نقطة التسليم البريطانية المتفق عليها.","Request Collection":"طلب استلام"
    }}
  });

  register(["/shipping-advice.html"],{
    en:{pageTitle:"Motorcycle Shipping Advice | AnyBike Export Services",text:{}},
    de:{pageTitle:"Motorrad-Versandberatung | AnyBike",text:{
      "Motorcycle Shipping Advice":"Motorrad-Versandberatung","Plan the UK handover before the motorcycle is purchased.":"Planen Sie die UK-Übergabe, bevor das Motorrad gekauft wird.","AnyBike can coordinate with:":"AnyBike kann koordinieren mit:","Your freight forwarder":"Ihrem Spediteur","UK ports and depots":"UK-Häfen und Depots","Export crating companies":"Export-Verpackungsunternehmen","Specialist motorcycle shippers":"Spezialisierten Motorradspediteuren","Shipping route":"Versandroute","A clear UK handover plan.":"Ein klarer UK-Übergabeplan.","Ask AnyBike for Shipping Advice":"AnyBike um Versandberatung bitten"
    }},
    fr:{pageTitle:"Conseils d'expédition moto | AnyBike",text:{
      "Motorcycle Shipping Advice":"Conseils d'expédition moto","Plan the UK handover before the motorcycle is purchased.":"Planifiez la remise au Royaume-Uni avant l'achat de la moto.","AnyBike can coordinate with:":"AnyBike peut coordonner avec :","Your freight forwarder":"Votre transitaire","UK ports and depots":"Ports et dépôts UK","Export crating companies":"Sociétés de mise en caisse export","Specialist motorcycle shippers":"Transporteurs moto spécialisés","Shipping route":"Itinéraire d'expédition","A clear UK handover plan.":"Un plan clair de remise au Royaume-Uni.","Ask AnyBike for Shipping Advice":"Demander conseil à AnyBike"
    }},
    es:{pageTitle:"Consejos de envío de motocicletas | AnyBike",text:{
      "Motorcycle Shipping Advice":"Consejos de envío de motocicletas","Plan the UK handover before the motorcycle is purchased.":"Planifique la entrega en el Reino Unido antes de comprar la motocicleta.","AnyBike can coordinate with:":"AnyBike puede coordinar con:","Your freight forwarder":"Su transitario","UK ports and depots":"Puertos y depósitos UK","Export crating companies":"Empresas de embalaje para exportación","Specialist motorcycle shippers":"Transportistas especializados en motocicletas","Shipping route":"Ruta de envío","A clear UK handover plan.":"Un plan claro de entrega en el Reino Unido.","Ask AnyBike for Shipping Advice":"Pedir asesoramiento de envío a AnyBike"
    }},
    ar:{pageTitle:"نصائح شحن الدراجات | AnyBike",text:{
      "Motorcycle Shipping Advice":"نصائح شحن الدراجات","Plan the UK handover before the motorcycle is purchased.":"خطط لتسليم الدراجة في المملكة المتحدة قبل شرائها.","AnyBike can coordinate with:":"يمكن لـ AnyBike التنسيق مع:","Your freight forwarder":"وكيل الشحن الخاص بك","UK ports and depots":"الموانئ والمستودعات البريطانية","Export crating companies":"شركات صناديق التصدير","Specialist motorcycle shippers":"شركات شحن الدراجات المتخصصة","Shipping route":"مسار الشحن","A clear UK handover plan.":"خطة واضحة للتسليم في المملكة المتحدة.","Ask AnyBike for Shipping Advice":"اطلب نصائح الشحن من AnyBike"
    }}
  });

  register(["/international-markets.html"],{
    en:{pageTitle:"International Motorcycle Markets | AnyBike",text:{},attributes:{placeholder:{}}},
    de:{pageTitle:"Internationale Motorradmärkte | AnyBike",text:{
      "AnyBike International Markets":"AnyBike Internationale Märkte","UK motorcycles for":"UK-Motorräder für","buyers worldwide.":"Käufer weltweit.","Find Your Country":"Ihr Land finden","Browse Live Motorcycles":"Aktuelle Motorräder ansehen","View Export Services":"Exportservices ansehen","Countries & Territories":"Länder & Gebiete","Live":"Live","UK Motorcycle Stock":"UK-Motorradbestand","Worldwide":"Weltweit","Export Support":"Exportunterstützung","Find your market":"Finden Sie Ihren Markt","Choose a country.":"Land auswählen.","Clear Search":"Suche löschen","From UK seller to your shipper":"Vom UK-Verkäufer zu Ihrem Spediteur","A clearer route to buying abroad.":"Ein klarerer Weg zum Kauf im Ausland.","Find or request a motorcycle":"Motorrad finden oder anfragen","Check, collect and prepare":"Prüfen, abholen und vorbereiten","Deliver to your nominated shipper":"Lieferung an Ihren benannten Spediteur","Export eligibility":"Exportfähigkeit","AnyBike Connect":"AnyBike Kontakt","Looking for a motorcycle in your country?":"Suchen Sie ein Motorrad für Ihr Land?","Request Motorcycles":"Motorräder anfragen","Browse Available Stock":"Verfügbaren Bestand ansehen"
    },attributes:{placeholder:{"Search country or region...":"Land oder Region suchen..."}}},
    fr:{pageTitle:"Marchés moto internationaux | AnyBike",text:{
      "AnyBike International Markets":"Marchés internationaux AnyBike","UK motorcycles for":"Motos britanniques pour","buyers worldwide.":"acheteurs du monde entier.","Find Your Country":"Trouver votre pays","Browse Live Motorcycles":"Voir les motos disponibles","View Export Services":"Voir les services export","Countries & Territories":"Pays & territoires","Live":"En direct","UK Motorcycle Stock":"Stock moto UK","Worldwide":"Monde entier","Export Support":"Assistance export","Find your market":"Trouver votre marché","Choose a country.":"Choisissez un pays.","Clear Search":"Effacer la recherche","From UK seller to your shipper":"Du vendeur UK à votre transporteur","A clearer route to buying abroad.":"Un parcours plus clair pour acheter à l'étranger.","Find or request a motorcycle":"Trouver ou demander une moto","Check, collect and prepare":"Contrôler, enlever et préparer","Deliver to your nominated shipper":"Livrer à votre transporteur désigné","Export eligibility":"Éligibilité à l'export","AnyBike Connect":"AnyBike Connect","Looking for a motorcycle in your country?":"Vous cherchez une moto pour votre pays ?","Request Motorcycles":"Demander des motos","Browse Available Stock":"Voir le stock disponible"
    },attributes:{placeholder:{"Search country or region...":"Rechercher un pays ou une région..."}}},
    es:{pageTitle:"Mercados internacionales de motocicletas | AnyBike",text:{
      "AnyBike International Markets":"Mercados internacionales AnyBike","UK motorcycles for":"Motocicletas UK para","buyers worldwide.":"compradores de todo el mundo.","Find Your Country":"Buscar su país","Browse Live Motorcycles":"Ver motocicletas disponibles","View Export Services":"Ver servicios de exportación","Countries & Territories":"Países y territorios","Live":"En directo","UK Motorcycle Stock":"Stock de motocicletas UK","Worldwide":"Mundial","Export Support":"Apoyo de exportación","Find your market":"Encuentre su mercado","Choose a country.":"Elija un país.","Clear Search":"Borrar búsqueda","From UK seller to your shipper":"Del vendedor UK a su transportista","A clearer route to buying abroad.":"Una ruta más clara para comprar en el extranjero.","Find or request a motorcycle":"Buscar o solicitar una motocicleta","Check, collect and prepare":"Comprobar, recoger y preparar","Deliver to your nominated shipper":"Entregar a su transportista designado","Export eligibility":"Elegibilidad de exportación","AnyBike Connect":"AnyBike Connect","Looking for a motorcycle in your country?":"¿Busca una motocicleta para su país?","Request Motorcycles":"Solicitar motocicletas","Browse Available Stock":"Ver stock disponible"
    },attributes:{placeholder:{"Search country or region...":"Buscar país o región..."}}},
    ar:{pageTitle:"أسواق الدراجات الدولية | AnyBike",text:{
      "AnyBike International Markets":"أسواق AnyBike الدولية","UK motorcycles for":"دراجات بريطانية لـ","buyers worldwide.":"المشترين حول العالم.","Find Your Country":"ابحث عن بلدك","Browse Live Motorcycles":"تصفح الدراجات المتاحة","View Export Services":"عرض خدمات التصدير","Countries & Territories":"الدول والأقاليم","Live":"مباشر","UK Motorcycle Stock":"مخزون الدراجات البريطانية","Worldwide":"عالمي","Export Support":"دعم التصدير","Find your market":"ابحث عن سوقك","Choose a country.":"اختر بلداً.","Clear Search":"مسح البحث","From UK seller to your shipper":"من البائع البريطاني إلى شركة الشحن","A clearer route to buying abroad.":"مسار أوضح للشراء من الخارج.","Find or request a motorcycle":"ابحث عن دراجة أو اطلبها","Check, collect and prepare":"تحقق واستلم وجهز","Deliver to your nominated shipper":"التسليم إلى شركة الشحن المختارة","Export eligibility":"أهلية التصدير","AnyBike Connect":"AnyBike Connect","Looking for a motorcycle in your country?":"هل تبحث عن دراجة لبلدك؟","Request Motorcycles":"اطلب دراجات","Browse Available Stock":"تصفح المخزون المتاح"
    },attributes:{placeholder:{"Search country or region...":"ابحث عن بلد أو منطقة..."}}}
  });

})();