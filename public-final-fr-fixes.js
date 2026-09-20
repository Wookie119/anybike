/*
AnyBike
File: public-final-fr-fixes.js
Purpose: Final French whole-element translation pass for pages with mixed nested/dynamic text
Date: 20 September 2026
*/
(function(){
  const path=String(location.pathname||"").toLowerCase();

  const maps={
    "/freight-forwarders.html":{
      "AnyBike sells and sources motorcycles. Shipping supports the motorcycle purchase and can be arranged independently by the buyer.":"AnyBike vend et recherche des motos. Le transport accompagne l’achat de la moto et peut être organisé indépendamment par l’acheteur.",
      "AnyBike can help coordinate collection instructions after the motorcycle purchase has been agreed.":"AnyBike peut aider à coordonner les instructions d’enlèvement une fois l’achat de la moto convenu.",
      "The motorcycle can be handed to a nominated UK forwarder, warehouse, packer, port or transport partner.":"La moto peut être remise à un transitaire britannique désigné, un entrepôt, un emballeur, un port ou un partenaire transport.",
      "Our team can liaise with the buyer and selected provider so that the UK handover requirements are understood.":"Notre équipe peut assurer la liaison entre l’acheteur et le prestataire choisi afin que les exigences de remise au Royaume-Uni soient clairement comprises.",
      "Check whether collection, packing, storage, export clearance, terminal handling, marine insurance and destination delivery are included.":"Vérifiez si l’enlèvement, l’emballage, le stockage, le dédouanement export, la manutention terminale, l’assurance maritime et la livraison à destination sont inclus.",
      "Port fees, customs clearance, duties, taxes, inspections, registration and local delivery may be payable separately.":"Les frais portuaires, le dédouanement, les droits, taxes, inspections, immatriculation et livraison locale peuvent être facturés séparément.",
      "Confirm fuel limits, battery rules, keys, alarms, personal items and whether a crate, case or specialist securing method is required.":"Confirmez les limites de carburant, les règles concernant la batterie, les clés, alarmes, effets personnels et la nécessité éventuelle d’une caisse ou d’un système d’arrimage spécialisé.",
      "The buyer must confirm that the motorcycle can legally be imported, cleared, inspected and registered in the destination country before purchase.":"L’acheteur doit confirmer avant l’achat que la moto peut être légalement importée, dédouanée, inspectée et immatriculée dans le pays de destination.",
      "The businesses on this page are independent of AnyBike unless a separate written arrangement expressly states otherwise. Inclusion in this directory does not constitute endorsement, approval, accreditation, recommendation or a guarantee of service.":"Les entreprises présentées sur cette page sont indépendantes d’AnyBike sauf accord écrit distinct indiquant expressément le contraire. Leur présence dans cet annuaire ne constitue ni approbation, ni accréditation, ni recommandation, ni garantie de service.",
      "Company services, routes, prices, insurance arrangements, memberships and trading status can change. Customers must make their own checks, obtain current written terms directly from the provider and satisfy themselves that the provider is suitable before making payment or entering into an agreement.":"Les services, routes, tarifs, assurances, adhésions et statuts commerciaux peuvent évoluer. Les clients doivent effectuer leurs propres vérifications, obtenir des conditions écrites à jour directement auprès du prestataire et s’assurer qu’il leur convient avant tout paiement ou engagement.",
      "Directory profiles were reviewed in July 2026 using information published by the providers. Any company may contact AnyBike to request a factual correction or removal.":"Les profils de l’annuaire ont été vérifiés en juillet 2026 à partir des informations publiées par les prestataires. Toute entreprise peut contacter AnyBike pour demander une correction factuelle ou son retrait.",
      "Southampton specialist in loading and securing vehicles, including motorcycles, inside shipping containers.":"Spécialiste de Southampton du chargement et de l’arrimage de véhicules, y compris les motos, dans des conteneurs maritimes.",
      "Vehicle loading and handling specialist":"Spécialiste du chargement et de la manutention de véhicules",
      "Container loading and unloading":"Chargement et déchargement de conteneurs",
      "Southampton container preparation":"Préparation de conteneurs à Southampton",
      "Southampton freight-forwarding office describing specialist automobile logistics and wider international freight services.":"Bureau de transit à Southampton proposant une logistique automobile spécialisée et des services de fret international.",
      "Freight forwarder and automobile logistics":"Transitaire et logistique automobile",
      "Confirm for each route":"À confirmer pour chaque route",
      "Southampton freight enquiries":"Demandes de fret à Southampton",
      "Southampton-based freight-forwarding company covering UK ports and specialist vehicle and project cargo movements.":"Société de transit basée à Southampton couvrant les ports britanniques ainsi que les mouvements de véhicules spécialisés et de fret projet.",
      "Southampton freight forwarder":"Transitaire basé à Southampton",
      "RoRo and container services":"Services RoRo et conteneur",
      "Vehicle-related port enquiries":"Demandes portuaires liées aux véhicules",
      "International motorcycle and vehicle transport specialist serving riders, travellers and customers moving motorcycles overseas.":"Spécialiste du transport international de motos et véhicules pour motards, voyageurs et clients expédiant des motos à l’étranger.",
      "Dedicated motorcycle freight specialist":"Spécialiste dédié du fret moto",
      "Route-dependent international options":"Options internationales selon la route",
      "Adventure and personal motorcycle shipping":"Transport de motos de voyage et personnelles",
      "International cargo company with a dedicated motorcycle-shipping service for overseas travel, relocation and vehicle movements.":"Société de fret international disposant d’un service dédié au transport de motos pour voyages, déménagements et transferts de véhicules.",
      "International cargo and motorcycle shipping":"Fret international et transport de motos",
      "Sea, air, road and route-dependent options":"Options mer, air et route selon la destination",
      "Managed motorcycle freight enquiries":"Demandes de fret moto prises en charge",
      "United States vehicle-shipping company offering international transport for cars and motorcycles by sea and air.":"Société américaine de transport de véhicules proposant le transport international de voitures et motos par mer et par air.",
      "United States vehicle shipper":"Transporteur de véhicules basé aux États-Unis",
      "Sea, air and door-to-door services":"Services maritimes, aériens et porte à porte",
      "International vehicle-shipping service offering motorcycle RoRo, full-container and shared-container options on supported routes.":"Service international de transport de véhicules proposant, selon les routes, RoRo moto, conteneur complet et conteneur partagé.",
      "International vehicle shipper":"Transporteur international de véhicules",
      "RoRo, full and shared containers":"RoRo, conteneurs complets et partagés",
      "Comparing common sea-freight options":"Comparaison des principales options de fret maritime",
      "UK international vehicle shipper with motorcycle services, nationwide collection and onsite container-loading facilities.":"Transporteur britannique international de véhicules proposant des services moto, enlèvement national et chargement de conteneurs sur site.",
      "UK vehicle and motorcycle shipper":"Transporteur britannique de véhicules et motos",
      "Container, RoRo and UK collection":"Conteneur, RoRo et enlèvement UK",
      "Worldwide vehicle-shipping enquiries":"Demandes de transport de véhicules dans le monde entier",
      "UK vehicle-shipping company offering motorcycle export services to destinations including Africa, the Caribbean and the Middle East.":"Société britannique de transport de véhicules proposant l’export de motos vers notamment l’Afrique, les Caraïbes et le Moyen-Orient.",
      "UK international vehicle shipper":"Transporteur international de véhicules basé au Royaume-Uni",
      "Container, RoRo and export support":"Conteneur, RoRo et assistance export",
      "Africa, Caribbean and Middle East enquiries":"Demandes Afrique, Caraïbes et Moyen-Orient",
      "Vehicle logistics":"Logistique véhicules","Freight forwarding":"Transit","Adventure travel":"Voyage aventure","Worldwide":"Monde entier","Warehouse":"Entrepôt","Middle East":"Moyen-Orient","Caribbean":"Caraïbes","Shared container":"Conteneur partagé","Door to door":"Porte à porte","UK ports":"Ports UK","Dealer pickup":"Enlèvement concessionnaire","Depot delivery":"Livraison dépôt"
    },
    "/services-and-fees.html":{
      "The Buyer Fee covers AnyBike's work in sourcing or securing the motorcycle, managing the seller or dealer relationship, managing the purchase and moving the transaction into the AnyBike buying and operations process.":"Les frais acheteur couvrent le travail d’AnyBike pour rechercher ou sécuriser la moto, gérer la relation avec le vendeur ou le concessionnaire, gérer l’achat et faire passer la transaction dans le processus d’achat et d’opérations AnyBike.",
      "These fees apply where an international buyer uses AnyBike to source, secure and purchase a motorcycle from the UK.":"Ces frais s’appliquent lorsqu’un acheteur international utilise AnyBike pour rechercher, sécuriser et acheter une moto au Royaume-Uni.",
      "Standard UK trade motorcycles are sold at the agreed AnyBike trade price. Delivery and any specifically requested additional services may be charged separately.":"Les motos destinées au commerce UK sont vendues au prix professionnel AnyBike convenu. La livraison et tout service supplémentaire demandé spécifiquement peuvent être facturés séparément.",
      "For international buyers using AnyBike to source, secure and purchase a motorcycle from the UK.":"Pour les acheteurs internationaux utilisant AnyBike pour rechercher, sécuriser et acheter une moto au Royaume-Uni.",
      "AnyBike charges relate to services we provide or coordinate. Transport, specialist packing, freight, storage and some inspections may involve an external provider. We separate those costs wherever practical so the quotation is clear.":"Les frais AnyBike concernent les services que nous fournissons ou coordonnons. Le transport, l’emballage spécialisé, le fret, le stockage et certaines inspections peuvent faire intervenir un prestataire externe. Nous séparons ces coûts lorsque possible afin que le devis soit clair.",
      "Sourcing, coordination, administration or another agreed service carried out by AnyBike.":"Recherche, coordination, administration ou autre service convenu réalisé par AnyBike.",
      "Transport, packing, freight, storage or other specialist costs included in or added to the agreed quotation.":"Transport, emballage, fret, stockage ou autres coûts spécialisés inclus dans le devis convenu ou ajoutés à celui-ci."
    },
    "/privacy-policy.html":{
      "This policy explains how AnyBike collects, uses, stores and shares personal information when you visit AnyBike.co.uk, create an account, contact us, buy or sell a motorcycle, join the Global Buyer Network or use our services.":"Cette politique explique comment AnyBike collecte, utilise, conserve et partage les informations personnelles lorsque vous visitez AnyBike.co.uk, créez un compte, nous contactez, achetez ou vendez une moto, rejoignez le réseau Global Buyer ou utilisez nos services.",
      "AnyBike uses personal information to operate customer accounts, respond to enquiries, manage motorcycle purchases and sales, provide sourcing and export support, prevent misuse and improve the platform. We do not sell personal information.":"AnyBike utilise les informations personnelles pour gérer les comptes clients, répondre aux demandes, gérer les achats et ventes de motos, fournir une assistance à la recherche et à l’export, prévenir les abus et améliorer la plateforme. Nous ne vendons pas les informations personnelles.",
      "AnyBike operates the website AnyBike.co.uk and provides UK motorcycle buying, selling, sourcing, stock and export-support services.":"AnyBike exploite le site AnyBike.co.uk et propose des services d’achat, de vente, de recherche, de stock et d’assistance export de motos au Royaume-Uni.",
      "For the personal information described in this policy, AnyBike is the organisation responsible for deciding how and why that information is used.":"Pour les informations personnelles décrites dans cette politique, AnyBike est l’organisation responsable de décider comment et pourquoi ces informations sont utilisées.",
      "The information collected depends on how you use AnyBike. It may include:":"Les informations collectées dépendent de votre utilisation d’AnyBike. Elles peuvent inclure :",
      "Please do not submit sensitive personal information that AnyBike has not asked for.":"Merci de ne pas transmettre d’informations personnelles sensibles qu’AnyBike n’a pas demandées.",
      "The website may use IP-location and UK postcode services to help identify an approximate country, location or map position. This information may be inaccurate and can be overridden by information you provide directly.":"Le site peut utiliser des services de géolocalisation IP et de code postal britannique pour estimer un pays, un emplacement ou une position sur une carte. Ces informations peuvent être imprécises et remplacées par celles que vous fournissez directement.",
      "Depending on the situation, AnyBike may rely on one or more of the following lawful bases:":"Selon la situation, AnyBike peut s’appuyer sur une ou plusieurs des bases juridiques suivantes :",
      "AnyBike works with customers, buyers, dealers and logistics providers worldwide. Personal information may therefore be accessed or shared outside the United Kingdom where this is necessary to provide a requested service.":"AnyBike travaille avec des clients, acheteurs, concessionnaires et prestataires logistiques dans le monde entier. Les informations personnelles peuvent donc être consultées ou partagées en dehors du Royaume-Uni lorsque cela est nécessaire pour fournir un service demandé.",
      "Some technology providers may also process information in more than one country. Where required, AnyBike will use appropriate contractual or legal safeguards for international transfers.":"Certains fournisseurs technologiques peuvent également traiter les informations dans plusieurs pays. Lorsque cela est requis, AnyBike utilise des garanties contractuelles ou juridiques appropriées pour les transferts internationaux.",
      "AnyBike keeps personal information only for as long as reasonably necessary for the purpose for which it was collected, including customer service, transaction, security, legal, tax, accounting and dispute-resolution requirements.":"AnyBike conserve les informations personnelles uniquement pendant la durée raisonnablement nécessaire à la finalité pour laquelle elles ont été collectées, notamment pour le service client, les transactions, la sécurité, les obligations juridiques, fiscales, comptables et la résolution des litiges.",
      "AnyBike uses reasonable technical and organisational safeguards designed to protect personal information. These include account authentication, access controls, restricted administration pages, database security policies and encrypted network connections.":"AnyBike utilise des mesures techniques et organisationnelles raisonnables destinées à protéger les informations personnelles, notamment l’authentification des comptes, les contrôles d’accès, les pages d’administration restreintes, les politiques de sécurité de la base de données et les connexions réseau chiffrées.",
      "No internet or storage system can be guaranteed to be completely secure. Customers should use a strong, unique password and should not share login details.":"Aucun système Internet ou de stockage ne peut être garanti comme totalement sécurisé. Les clients doivent utiliser un mot de passe fort et unique et ne pas partager leurs identifiants.",
      "AnyBike may use browser storage, authentication tokens, cookies or similar technologies to:":"AnyBike peut utiliser le stockage du navigateur, des jetons d’authentification, des cookies ou des technologies similaires pour :",
      "Some storage is necessary for the website and account features to function. Where non-essential cookies or analytics are introduced, AnyBike will provide any consent controls required by law.":"Certains stockages sont nécessaires au fonctionnement du site et des fonctions de compte. Si des cookies non essentiels ou des outils d’analyse sont introduits, AnyBike fournira les contrôles de consentement requis par la loi.",
      "Browser settings can be used to remove or block stored data, but doing so may sign you out or prevent some website features from working correctly.":"Les paramètres du navigateur permettent de supprimer ou bloquer les données stockées, mais cela peut vous déconnecter ou empêcher certaines fonctions du site de fonctionner correctement.",
      "Depending on the circumstances, UK data-protection law may give you rights to:":"Selon les circonstances, la législation britannique sur la protection des données peut vous accorder certains droits :",
      "AnyBike services are intended for adults and businesses involved in purchasing, selling, sourcing or exporting motorcycles. The website is not intended to collect personal information knowingly from children.":"Les services AnyBike sont destinés aux adultes et aux entreprises impliqués dans l’achat, la vente, la recherche ou l’exportation de motos. Le site n’a pas vocation à collecter sciemment des informations personnelles concernant des enfants.",
      "A parent or guardian who believes a child has submitted personal information should contact AnyBike so that the matter can be reviewed.":"Un parent ou tuteur qui pense qu’un enfant a transmis des informations personnelles doit contacter AnyBike afin que la situation puisse être examinée.",
      "AnyBike may update this privacy policy when services, technology, suppliers or legal requirements change.":"AnyBike peut mettre à jour cette politique de confidentialité lorsque les services, technologies, fournisseurs ou exigences légales évoluent.",
      "The latest version will be published on this page with an updated revision date. Material changes may also be highlighted elsewhere on the website or communicated directly where appropriate.":"La dernière version sera publiée sur cette page avec une date de révision mise à jour. Les modifications importantes pourront également être signalées ailleurs sur le site ou communiquées directement lorsque cela est approprié."
    }
  };

  function lang(){
    return String(localStorage.getItem("anybikeLanguage")||localStorage.getItem("anybike_language")||document.documentElement.lang||"en").toLowerCase();
  }

  function apply(){
    if(lang()!=="fr") return;
    const map=maps[path];
    if(!map) return;
    document.querySelectorAll("main p, main li, main span, main small, main td, main th, main h2, main h3, main strong, main .tag, main .provider-type, main .notice, main .disclaimer-box p").forEach(el=>{
      if(el.children.length) return;
      const key=String(el.textContent||"").replace(/\s+/g," ").trim();
      if(map[key]) el.textContent=map[key];
    });
  }

  if(!maps[path]) return;
  window.addEventListener("anybikeLanguageChanged",()=>setTimeout(apply,0));
  document.addEventListener("DOMContentLoaded",()=>setTimeout(apply,50));
  const obs=new MutationObserver(()=>apply());
  obs.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(apply,100);
})();